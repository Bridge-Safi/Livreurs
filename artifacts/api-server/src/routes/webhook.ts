import { Router, type IRouter } from "express";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";
import { sendPushToAllDeliverers } from "./push";
import { signAssignToken } from "./assign";

const router: IRouter = Router();

const WEBHOOK_SECRET = process.env["BRIDGE_WEBHOOK_SECRET"] || "";

function generateTrackingNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BRG-${ts}-${rnd}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dispatchWithDelay(
  deliveryId: number,
  customerName: string,
  deliveryAddress: string,
  itemsSummary: string,
  source: string,
  logger: any,
): Promise<void> {
  await sleep(2000);

  const pushBody = [
    `📍 ${deliveryAddress}`,
    itemsSummary ? `🍽️ ${itemsSummary}` : "",
    `⏱️ 5 min pour accepter`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendPushToAllDeliverers({
      title: `🔔 Nouvelle commande — ${customerName}`,
      body: pushBody,
      url: "/livreur",
      urgent: true,
    });
    logger.info({ deliveryId, source }, "[DISPATCH] 🔔 Push envoyé aux livreurs (+2s)");
  } catch (err) {
    logger.error({ deliveryId, err }, "[DISPATCH] ❌ Push échoué");
  }
}

router.post("/orders/inbound", async (req, res): Promise<void> => {
  const secret = req.headers["x-bridge-secret"] || req.body?.secret;
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const {
    customerName,
    customerPhone,
    deliveryAddress,
    pickupAddress,
    items,
    total,
    notes,
    source,
  } = req.body;

  if (!customerName || !deliveryAddress) {
    res.status(400).json({ error: "customerName et deliveryAddress sont requis" });
    return;
  }

  const pickup = pickupAddress || "Bridge Eats — Safi";
  const trackingNumber = generateTrackingNumber();
  const orderSource = source || "bridge_eats";

  const itemsSummary = Array.isArray(items)
    ? items.map((i: any) => `${i.quantity || 1}× ${i.name || i.title || "article"}`).join(", ")
    : "";

  const orderNotes = [
    itemsSummary ? `Commande: ${itemsSummary}` : "",
    total ? `Total: ${total} MAD` : "",
    notes || "",
  ]
    .filter(Boolean)
    .join(" | ");

  const [delivery] = await db
    .insert(deliveriesTable)
    .values({
      trackingNumber,
      customerName: String(customerName),
      customerPhone: customerPhone ? String(customerPhone) : null,
      pickupAddress: pickup,
      deliveryAddress: String(deliveryAddress),
      status: "pending",
      dispatchPhase: "cascade",
      dispatchedAt: new Date(),
      notes: orderNotes || null,
      priority: "urgent",
    })
    .returning();

  req.log.info(
    { deliveryId: delivery.id, trackingNumber, source: orderSource },
    "Inbound order — dispatch scheduled in 2s"
  );

  // Build base URL from the incoming request
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const baseUrl = `${proto}://${host}`;

  // Fetch all deliverers and generate a signed quick-assign link for each
  const deliverers = await db.select().from(deliverersTable).orderBy(deliverersTable.id);
  const assignLinks = deliverers.map(d => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    url: `${baseUrl}/api/assign/${delivery.id}/${d.id}/${signAssignToken(delivery.id, d.id)}`,
  }));

  // ✅ Respond immediately with assign links
  res.json({
    success: true,
    deliveryId: delivery.id,
    trackingNumber,
    message: "Commande reçue — les livreurs seront alertés dans 2 secondes",
    assignLinks,
  });

  // 🔔 Trigger push after 2s (without blocking response)
  dispatchWithDelay(
    delivery.id,
    String(customerName),
    String(deliveryAddress),
    itemsSummary,
    orderSource,
    req.log,
  );
});

export default router;

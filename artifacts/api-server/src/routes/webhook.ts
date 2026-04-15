import { Router, type IRouter } from "express";
import { db, deliveriesTable } from "@workspace/db";
import { sendPushToAllDeliverers } from "./push";

const router: IRouter = Router();

const WEBHOOK_SECRET = process.env["BRIDGE_WEBHOOK_SECRET"] || "";

function generateTrackingNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BRG-${ts}-${rnd}`;
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
  } = req.body;

  if (!customerName || !deliveryAddress) {
    res.status(400).json({ error: "customerName et deliveryAddress sont requis" });
    return;
  }

  const pickup = pickupAddress || "Bridge Eats — Safi";
  const trackingNumber = generateTrackingNumber();

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
      priority: "high",
    })
    .returning();

  req.log.info({ deliveryId: delivery.id, trackingNumber }, "Inbound order from Bridge Eats");

  const pushBody = [
    `📍 ${deliveryAddress}`,
    itemsSummary ? `🍽️ ${itemsSummary}` : "",
    `⏱️ 7 min pour accepter`,
  ]
    .filter(Boolean)
    .join("\n");

  sendPushToAllDeliverers({
    title: `🔔 Nouvelle commande — ${customerName}`,
    body: pushBody,
    url: "/livreur",
    urgent: true,
  }).catch(() => {});

  res.json({
    success: true,
    deliveryId: delivery.id,
    trackingNumber,
    message: "Commande reçue et dispatché aux livreurs",
  });
});

export default router;

import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";
import { sendPushToAllDeliverers, sendPushToDeliverer } from "./push";
import { signAssignToken } from "./assign";

const router: IRouter = Router();

// Colonnes paiement (cash à encaisser par le livreur) — migration idempotente
// car la table "deliveries" existait avant l'ajout de cette fonctionnalité.
async function ensurePaymentColumns() {
  try {
    await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS payment_method TEXT`);
    await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS amount_to_collect REAL`);
    await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS cash_collected BOOLEAN NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS restaurant_status TEXT`);
    await db.execute(sql`ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS estimated_prep_time INTEGER`);
  } catch (err) {
    console.error("Failed to ensure payment columns on deliveries", err);
  }
}
ensurePaymentColumns();

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

  const SERVICE_EMOJIS: Record<string, string> = {
    eats: "🍽️", tabac: "🚬", pharmacie: "💊", fleurs: "💐", autre: "📦",
  };
  const serviceEmoji = SERVICE_EMOJIS[source] ?? "📦";

  const pushBody = [
    `📍 ${deliveryAddress}`,
    itemsSummary ? `${serviceEmoji} ${itemsSummary}` : "",
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
    paymentMethod,
    notes,
    source,
    serviceType,
  } = req.body;

  if (!customerName || !deliveryAddress) {
    res.status(400).json({ error: "customerName et deliveryAddress sont requis" });
    return;
  }

  const VALID_SERVICE_TYPES = ["eats", "tabac", "pharmacie", "fleurs", "autre"] as const;
  type ServiceType = typeof VALID_SERVICE_TYPES[number];
  const validatedServiceType: ServiceType = VALID_SERVICE_TYPES.includes(serviceType) ? serviceType : "eats";

  const SERVICE_PICKUPS: Record<ServiceType, string> = {
    eats:      "Bridge Eats — Safi",
    tabac:     "Tabac — Safi",
    pharmacie: "Pharmacie — Safi",
    fleurs:    "Fleurs — Safi",
    autre:     "Bridge — Safi",
  };

  const pickup = pickupAddress || SERVICE_PICKUPS[validatedServiceType];
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
      serviceType: validatedServiceType,
      paymentMethod: paymentMethod ? String(paymentMethod) : "cash",
      amountToCollect: typeof total === "number" ? total : (total ? Number(total) : null),
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

// ── Statut resto -> livreur assigne (delai de preparation + "commande prete") ──
// POST /api/deliveries/restaurant-status
// Appele par Bridge-safi (orders.ts::notifyLivreursRestaurantStatus) quand le
// restaurateur choisit son delai de preparation (10/15/20min) puis quand il
// marque la commande prete. zabi: "le livreur doit recevoir le delai sur quoi
// le restaurant a appuye" + "une notification pour le livreur que la commande
// est prete meme s'il a recu le delai". Best-effort : la livraison peut
// encore n'avoir aucun livreur assigne (delivererId null) si personne n'a
// encore accepte la course cote Livreurs -> dans ce cas on ne pousse rien
// (rien a notifier), mais on repond quand meme 200 pour ne pas faire echouer
// Bridge-safi.
router.post("/deliveries/restaurant-status", async (req, res): Promise<void> => {
  const secret = req.headers["x-bridge-secret"] || req.body?.secret;
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { trackingNumber, status, estimatedPrepTime } = req.body as {
    trackingNumber?: string;
    status?: "preparing" | "ready";
    estimatedPrepTime?: number | null;
  };

  if (!trackingNumber || (status !== "preparing" && status !== "ready")) {
    res.status(400).json({ error: "trackingNumber et status ('preparing'|'ready') requis" });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.trackingNumber, trackingNumber));
  if (!delivery) {
    req.log.info({ trackingNumber }, "restaurant-status: livraison introuvable (pas encore creee cote Livreurs ?)");
    res.json({ ok: true, notified: false });
    return;
  }

  // Persiste le statut resto sur la livraison : c'est ce qui debloque le
  // bouton "Commande recuperee" du livreur (bloque tant que status=preparing).
  await db
    .update(deliveriesTable)
    .set({
      restaurantStatus: status,
      ...(estimatedPrepTime != null ? { estimatedPrepTime } : {}),
      updatedAt: new Date(),
    })
    .where(eq(deliveriesTable.id, delivery.id));

  if (!delivery.delivererId) {
    req.log.info({ trackingNumber, status }, "restaurant-status: aucun livreur assigne pour l'instant, rien a pousser");
    res.json({ ok: true, notified: false });
    return;
  }

  const payload = status === "preparing"
    ? {
        title: "👨‍🍳 En préparation",
        body: estimatedPrepTime
          ? `Le commerçant prépare la commande — prête dans ~${estimatedPrepTime} min`
          : "Le commerçant prépare la commande",
        url: "/livreur",
      }
    : {
        title: "✅ Commande prête !",
        body: "Allez récupérer la commande chez le commerçant",
        url: "/livreur",
        urgent: true,
      };

  try {
    await sendPushToDeliverer(delivery.delivererId, payload);
    req.log.info({ trackingNumber, status, delivererId: delivery.delivererId }, "restaurant-status: push envoye au livreur");
  } catch (err) {
    req.log.error({ err, trackingNumber, status }, "restaurant-status: push echoue");
  }

  res.json({ ok: true, notified: true });
});

export default router;

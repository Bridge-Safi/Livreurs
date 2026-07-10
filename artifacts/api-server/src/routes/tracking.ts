import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable, delivererReviewsTable } from "@workspace/db";
import { sendPushToDeliverer } from "./push";
import { logger } from "../lib/logger";

// Table des avis clients sur les livreurs (note + commentaire), créée ici
// de façon idempotente car elle n'existait pas dans le schéma initial.
async function ensureDelivererReviewsTable() {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS deliverer_reviews (
      id SERIAL PRIMARY KEY,
      deliverer_id INTEGER NOT NULL,
      order_ref TEXT,
      stars REAL NOT NULL,
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    logger.info("deliverer_reviews table verified");
  } catch (err) {
    logger.error({ err }, "Failed to ensure deliverer_reviews table");
  }
}
ensureDelivererReviewsTable();

const router: IRouter = Router();

router.get("/tracking/:trackingNumber", async (req, res): Promise<void> => {
  const { trackingNumber } = req.params;

  const deliveries = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.trackingNumber, trackingNumber))
    .limit(1);

  const delivery = deliveries[0];
  if (!delivery) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  let deliverer: {
    id: number;
    name: string;
    phone: string;
    vehicleType: string;
    rating: number;
    photoUrl: string | null;
    lastLat: number | null;
    lastLng: number | null;
  } | null = null;

  if (delivery.delivererId) {
    const rows = await db
      .select({
        id: deliverersTable.id,
        name: deliverersTable.name,
        phone: deliverersTable.phone,
        vehicleType: deliverersTable.vehicleType,
        rating: deliverersTable.rating,
        photoUrl: deliverersTable.photoUrl,
        lastLat: deliverersTable.lastLat,
        lastLng: deliverersTable.lastLng,
      })
      .from(deliverersTable)
      .where(eq(deliverersTable.id, delivery.delivererId))
      .limit(1);
    deliverer = rows[0] ?? null;
  }

  res.json({
    trackingNumber: delivery.trackingNumber,
    status: delivery.status,
    customerName: delivery.customerName,
    pickupAddress: delivery.pickupAddress,
    deliveryAddress: delivery.deliveryAddress,
    notes: delivery.notes ?? null,
    estimatedDeliveryTime: delivery.estimatedDeliveryTime ?? null,
    pickedUpAt: delivery.pickedUpAt instanceof Date
      ? delivery.pickedUpAt.toISOString()
      : (delivery.pickedUpAt ? String(delivery.pickedUpAt) : null),
    createdAt: delivery.createdAt instanceof Date
      ? delivery.createdAt.toISOString()
      : String(delivery.createdAt),
    deliverer,
  });
});

// ── Annuler une commande + notifier le livreur (0dh, pas de calcul de trajet) ─
// Appelé server-to-server par Bridge-safi quand le client annule sa commande.
// La commande disparaît automatiquement de l'app du livreur (le dashboard
// ne liste que status pending/in_progress), et si un livreur était déjà
// assigné, il reçoit une notif push l'informant que la commande est annulée.
router.post("/tracking/:trackingNumber/cancel", async (req, res): Promise<void> => {
  const { trackingNumber } = req.params;

  const deliveries = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.trackingNumber, trackingNumber))
    .limit(1);

  const delivery = deliveries[0];
  if (!delivery) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  if (delivery.status === "delivered" || delivery.status === "cancelled") {
    res.json({ ok: true, alreadyFinal: true });
    return;
  }

  await db
    .update(deliveriesTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(deliveriesTable.id, delivery.id));

  res.json({ ok: true });

  if (delivery.delivererId) {
    sendPushToDeliverer(delivery.delivererId, {
      title: "❌ Commande annulée",
      body: `Le client a annulé la commande${delivery.customerName ? ` de ${delivery.customerName}` : ""} — elle a été retirée de votre liste.`,
      url: "/livreur",
      urgent: false,
    }).catch(() => {});
  }
});

// Note + commentaire client sur le livreur (le livreur voit ses avis).
// Appelé server-to-server par Bridge-safi juste après que le client a noté
// sa commande. Enregistre l'avis et recalcule la moyenne du livreur en
// direct — cette moyenne (deliverersTable.rating) s'affiche déjà sur le
// tableau de bord du livreur.
router.post("/tracking/:trackingNumber/review", async (req, res): Promise<void> => {
  const { trackingNumber } = req.params;
  const { stars, comment } = req.body ?? {};

  const n = Number(stars);
  if (!Number.isFinite(n) || n < 1 || n > 5) {
    res.status(400).json({ error: "stars requis (1-5)" });
    return;
  }

  const deliveries = await db
    .select()
    .from(deliveriesTable)
    .where(eq(deliveriesTable.trackingNumber, trackingNumber))
    .limit(1);

  const delivery = deliveries[0];
  if (!delivery || !delivery.delivererId) {
    res.json({ ok: true, skipped: true });
    return;
  }

  await db.insert(delivererReviewsTable).values({
    delivererId: delivery.delivererId,
    orderRef: trackingNumber,
    stars: n,
    comment: typeof comment === "string" && comment.trim() ? comment.trim().slice(0, 500) : null,
  });

  const avgRows = await db
    .select({ avg: sql<number>`avg(${delivererReviewsTable.stars})` })
    .from(delivererReviewsTable)
    .where(eq(delivererReviewsTable.delivererId, delivery.delivererId));
  const newAvg = avgRows[0]?.avg != null ? Math.round(Number(avgRows[0].avg) * 10) / 10 : n;

  await db.update(deliverersTable).set({ rating: newAvg }).where(eq(deliverersTable.id, delivery.delivererId));

  logger.info({ trackingNumber, delivererId: delivery.delivererId, stars: n }, "Deliverer review saved");
  res.json({ ok: true });
});

export default router;

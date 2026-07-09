import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";
import { sendPushToDeliverer } from "./push";

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

export default router;

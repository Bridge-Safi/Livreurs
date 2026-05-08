import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";

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

export default router;

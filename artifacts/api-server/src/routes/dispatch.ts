import { Router, type IRouter } from "express";
import { eq, and, ne, count } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";
import {
  DispatchDeliveryParams,
  AcceptDeliveryBody,
  AcceptDeliveryParams,
  RefuseDeliveryBody,
  RefuseDeliveryParams,
  ConfirmDeliveredBody,
  ConfirmDeliveredParams,
  GetPendingDispatchQueryParams,
  GetPendingDispatchParams,
  GetDeliveryResponse,
} from "@workspace/api-zod";
import { sendWhatsAppProof } from "../lib/whatsapp";
import { serializeDelivery } from "../lib/serializers";
import { sendPushToAll } from "./push";
import { haversineKm } from "../lib/haversine";

const router: IRouter = Router();

const DISPATCH_TIMEOUT_MS = 5 * 60 * 1000;

// Proximity constants
// Deliverers within this radius get the delivery immediately (wave 1)
const PROXIMITY_THRESHOLD_KM = 2.0;
// Deliverers beyond the threshold must wait this long before seeing the delivery (wave 2)
const PROXIMITY_DELAY_MS = 60 * 1000;
// Default Safi city center (used when no GPS is stored for the restaurant)
const SAFI_CENTER_LAT = 32.2994;
const SAFI_CENTER_LNG = -9.2372;

router.get("/deliveries/pending-dispatch", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");

  const rawDelivererId = parseInt(req.query.delivererId as string, 10);
  if (!rawDelivererId || isNaN(rawDelivererId)) {
    res.status(400).json({ error: "delivererId est requis" });
    return;
  }

  // Fetch deliverer to get their GPS position
  const [deliverer] = await db
    .select()
    .from(deliverersTable)
    .where(eq(deliverersTable.id, rawDelivererId));

  const allDispatching = await db
    .select()
    .from(deliveriesTable)
    .where(
      and(
        ne(deliveriesTable.dispatchPhase, "none"),
        ne(deliveriesTable.dispatchPhase, "accepted")
      )
    );

  let found = null;
  for (const delivery of allDispatching) {
    const now = Date.now();
    const dispatchedTime = delivery.dispatchedAt ? new Date(delivery.dispatchedAt).getTime() : 0;
    const elapsed = now - dispatchedTime;

    // Expired — clean up
    if (elapsed >= DISPATCH_TIMEOUT_MS) {
      await db
        .update(deliveriesTable)
        .set({ dispatchPhase: "none", updatedAt: new Date() })
        .where(eq(deliveriesTable.id, delivery.id));
      continue;
    }

    // ── Proximity gate ──────────────────────────────────────────
    // Restaurant coordinates: use stored pickup coords or default to Safi center
    const restaurantLat = delivery.pickupLat ?? SAFI_CENTER_LAT;
    const restaurantLng = delivery.pickupLng ?? SAFI_CENTER_LNG;

    if (deliverer?.lastLat != null && deliverer?.lastLng != null) {
      const distanceKm = haversineKm(
        deliverer.lastLat, deliverer.lastLng,
        restaurantLat, restaurantLng
      );

      const isNearby = distanceKm < PROXIMITY_THRESHOLD_KM;

      if (!isNearby && elapsed < PROXIMITY_DELAY_MS) {
        // Far deliverer — must wait 60 seconds before seeing this delivery
        req.log.debug(
          { delivererId: rawDelivererId, distanceKm: distanceKm.toFixed(2), elapsed },
          "Proximity delay active — far deliverer"
        );
        continue;
      }
    }
    // ── End proximity gate ───────────────────────────────────────

    const secondsLeft = Math.max(0, Math.floor((DISPATCH_TIMEOUT_MS - elapsed) / 1000));
    found = {
      hasPending: true,
      delivery: GetDeliveryResponse.parse(serializeDelivery(delivery)),
      expiresAt: new Date(dispatchedTime + DISPATCH_TIMEOUT_MS).toISOString(),
      secondsLeft,
      phase: "cascade",
    };
    break;
  }

  if (!found) {
    res.json({ hasPending: false });
    return;
  }

  res.json(found);
});

router.post("/deliveries/:id/dispatch", async (req, res): Promise<void> => {
  const params = DispatchDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  const availableDeliverers = await db
    .select()
    .from(deliverersTable)
    .where(eq(deliverersTable.status, "available"));

  if (availableDeliverers.length === 0) {
    res.status(409).json({ error: "Aucun livreur disponible pour le moment" });
    return;
  }

  const [updated] = await db
    .update(deliveriesTable)
    .set({
      delivererId: null,
      status: "pending",
      dispatchPhase: "cascade",
      dispatchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();

  req.log.info({ deliveryId: params.data.id, phase: "cascade" }, "Delivery broadcast to all deliverers");

  sendPushToAll({
    title: "🛵 Nouvelle commande — Bridge Safi",
    body: `${updated.customerName} · ${updated.deliveryAddress} — 7 min pour accepter`,
    url: "/",
  }).catch(() => {});

  res.json({
    delivery: GetDeliveryResponse.parse(serializeDelivery(updated)),
    phase: "cascade",
    message: `Commande envoyée à tous les livreurs disponibles — 7 minutes pour accepter`,
  });
});

router.post("/deliveries/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AcceptDeliveryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  if (delivery.dispatchPhase === "none" || delivery.dispatchPhase === "accepted") {
    res.status(409).json({ error: "Cette livraison n'est plus disponible" });
    return;
  }

  // Enforce max 3 simultaneous deliveries
  const [{ activeCount }] = await db
    .select({ activeCount: count() })
    .from(deliveriesTable)
    .where(and(
      eq(deliveriesTable.delivererId, body.data.delivererId),
      eq(deliveriesTable.status, "in_progress")
    ));

  if (activeCount >= 3) {
    res.status(409).json({ error: "Maximum 3 commandes simultanées atteint" });
    return;
  }

  const [updated] = await db
    .update(deliveriesTable)
    .set({
      delivererId: body.data.delivererId,
      status: "in_progress",
      dispatchPhase: "accepted",
      updatedAt: new Date(),
    })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();

  await db
    .update(deliverersTable)
    .set({ status: "busy" })
    .where(eq(deliverersTable.id, body.data.delivererId));

  req.log.info({ deliveryId: params.data.id, delivererId: body.data.delivererId, activeCount: activeCount + 1 }, "Delivery accepted");

  res.json(GetDeliveryResponse.parse(serializeDelivery(updated)));
});

router.post("/deliveries/:id/refuse", async (req, res): Promise<void> => {
  const params = RefuseDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = RefuseDeliveryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }

  req.log.info({ deliveryId: params.data.id, delivererId: body.data.delivererId }, "Delivery refused (local only)");

  res.json(GetDeliveryResponse.parse(serializeDelivery(delivery)));
});

router.post("/deliveries/:id/confirm-delivered", async (req, res): Promise<void> => {
  const params = ConfirmDeliveredParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = ConfirmDeliveredBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Livraison introuvable" });
    return;
  }

  if (delivery.status === "delivered") {
    res.status(409).json({ error: "Livraison déjà confirmée" });
    return;
  }

  // ── Anti-cheat: confirmCode must match if one was generated ──────────────
  if (delivery.confirmCode) {
    if (!body.data.confirmCode || body.data.confirmCode.trim() !== delivery.confirmCode.trim()) {
      res.status(403).json({ error: "Code de confirmation incorrect. Demandez le code au client." });
      return;
    }
  }

  // ── Anti-cheat: cannot confirm too soon after pickup ─────────────────────
  if (delivery.pickedUpAt) {
    const elapsed = Date.now() - new Date(delivery.pickedUpAt).getTime();
    if (elapsed < 60_000) {
      res.status(409).json({ error: "Trop tôt — attendez d'être arrivé chez le client." });
      return;
    }
  }

  const delivererId = body.data.delivererId;
  const [deliverer] = await db.select().from(deliverersTable).where(eq(deliverersTable.id, delivererId));

  const [updated] = await db
    .update(deliveriesTable)
    .set({
      status: "delivered",
      dispatchPhase: "none",
      updatedAt: new Date(),
    })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();

  // Check remaining active deliveries (excluding this one just delivered)
  const [{ remainingCount }] = await db
    .select({ remainingCount: count() })
    .from(deliveriesTable)
    .where(and(
      eq(deliveriesTable.delivererId, delivererId),
      eq(deliveriesTable.status, "in_progress")
    ));

  await db
    .update(deliverersTable)
    .set({
      status: remainingCount > 0 ? "busy" : "available",
      totalDeliveries: (deliverer?.totalDeliveries ?? 0) + 1,
    })
    .where(eq(deliverersTable.id, delivererId));

  req.log.info({ deliveryId: params.data.id }, "Delivery confirmed as delivered");

  if (deliverer) {
    sendWhatsAppProof({
      deliveryId: delivery.id,
      trackingNumber: delivery.trackingNumber,
      customerName: delivery.customerName,
      deliveryAddress: delivery.deliveryAddress,
      delivererName: deliverer.name,
      delivererPhone: deliverer.phone,
      proofNote: body.data.proofNote,
    }).catch(() => {});
  }

  res.json(GetDeliveryResponse.parse(serializeDelivery(updated)));
});

router.get("/deliveries/:id/pending-dispatch", async (req, res): Promise<void> => {
  const params = GetPendingDispatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = GetPendingDispatchQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));

  if (!delivery) {
    res.json({ hasPending: false });
    return;
  }

  if (delivery.dispatchPhase !== "cascade") {
    res.json({ hasPending: false });
    return;
  }

  const now = Date.now();
  const dispatchedTime = delivery.dispatchedAt ? new Date(delivery.dispatchedAt).getTime() : 0;
  const elapsed = now - dispatchedTime;

  if (elapsed >= DISPATCH_TIMEOUT_MS) {
    await db
      .update(deliveriesTable)
      .set({ dispatchPhase: "none", updatedAt: new Date() })
      .where(eq(deliveriesTable.id, params.data.id));
    res.json({ hasPending: false });
    return;
  }

  const secondsLeft = Math.max(0, Math.floor((DISPATCH_TIMEOUT_MS - elapsed) / 1000));

  res.json({
    hasPending: true,
    delivery: GetDeliveryResponse.parse(serializeDelivery(delivery)),
    expiresAt: new Date(dispatchedTime + DISPATCH_TIMEOUT_MS).toISOString(),
    secondsLeft,
    phase: "cascade",
  });
});

export default router;

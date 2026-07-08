import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, deliveriesTable, deliverersTable } from "@workspace/db";
import {
  CreateDeliveryBody,
  UpdateDeliveryBody,
  UpdateDeliveryParams,
  GetDeliveryParams,
  GetDeliveryResponse,
  UpdateDeliveryResponse,
  ListDeliveriesResponse,
  ListDeliveriesQueryParams,
  GetDeliveryStatsResponse,
  GetDeliveryStatsQueryParams,
  ConfirmDeliveredParams,
  ConfirmDeliveredBody,
  ConfirmDeliveredResponse,
} from "@workspace/api-zod";
import { serializeDelivery } from "../lib/serializers";
import { sendPushToAllDeliverers } from "./push";

const router: IRouter = Router();

function genConfirmCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.get("/deliveries/stats", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const queryParams = GetDeliveryStatsQueryParams.safeParse(req.query);
  const delivererId = queryParams.success ? queryParams.data.delivererId : undefined;

  const whereClause = delivererId ? eq(deliveriesTable.delivererId, delivererId) : undefined;

  const all = whereClause
    ? await db.select().from(deliveriesTable).where(whereClause)
    : await db.select().from(deliveriesTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() <= 15 ? 1 : 16);
  periodStart.setHours(0, 0, 0, 0);

  const todayDeliveries = all.filter(d => new Date(d.createdAt) >= today);
  const completed = todayDeliveries.filter(d => d.status === "delivered");
  const inProgress = all.filter(d => d.status === "in_progress");
  const pending = all.filter(d => d.status === "pending");
  const cancelled = todayDeliveries.filter(d => d.status === "cancelled");

  const periodDeliveries = all.filter(d => d.status === "delivered" && new Date(d.createdAt) >= periodStart);

  const earningsToday = completed.length * 6;
  const earningsWeek = periodDeliveries.length * 6;

  const stats = {
    totalToday: todayDeliveries.length,
    completedToday: completed.length,
    inProgress: inProgress.length,
    pending: pending.length,
    cancelled: cancelled.length,
    earningsToday,
    earningsWeek,
    averageDeliveryTime: 25,
  };

  res.json(GetDeliveryStatsResponse.parse(stats));
});

router.get("/deliveries", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const queryParams = ListDeliveriesQueryParams.safeParse(req.query);
  const status = queryParams.success ? queryParams.data.status : undefined;
  const delivererId = queryParams.success ? queryParams.data.delivererId : undefined;

  let conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(deliveriesTable.status, status));
  if (delivererId) conditions.push(eq(deliveriesTable.delivererId, delivererId));

  const deliveries = conditions.length > 0
    ? await db.select().from(deliveriesTable).where(and(...conditions)).orderBy(deliveriesTable.createdAt)
    : await db.select().from(deliveriesTable).orderBy(deliveriesTable.createdAt);

  res.json(ListDeliveriesResponse.parse(deliveries.map(serializeDelivery)));
});

router.post("/deliveries", async (req, res): Promise<void> => {
  const parsed = CreateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [delivery] = await db
    .insert(deliveriesTable)
    .values({
      ...parsed.data,
      confirmCode: null,
      dispatchPhase: "cascade",
      dispatchedAt: new Date(),
    })
    .returning();

  req.log.info({ deliveryId: delivery.id }, "Delivery created — auto-dispatched to all deliverers");

  res.status(201).json(GetDeliveryResponse.parse(serializeDelivery(delivery)));

  sendPushToAllDeliverers({
    title: `🔔 Nouvelle commande — ${delivery.customerName}`,
    body: `📍 ${delivery.deliveryAddress}\n⏱️ 5 min pour accepter`,
    url: "/livreur",
    urgent: true,
  }).catch(() => {});
});

// ── pickup: mark as picked up from merchant ───────────────────────────────────
router.patch("/deliveries/:id/pickup", async (req, res): Promise<void> => {
  const params = GetDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Livraison introuvable" });
    return;
  }

  if (delivery.status !== "pending") {
    res.status(409).json({ error: "Impossible — statut incorrect" });
    return;
  }

  const [updated] = await db
    .update(deliveriesTable)
    .set({ status: "in_progress", pickedUpAt: new Date(), updatedAt: new Date() })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();

  req.log.info({ deliveryId: params.data.id }, "Delivery picked up from merchant");
  res.json(GetDeliveryResponse.parse(serializeDelivery(updated)));

  // ── Notifie Bridge-safi (client) que le livreur a récupéré la commande ────
  // Sans ceci, la page de suivi du client ne montre jamais qui est le livreur
  // (nom, photo, note) tant que la commande n'est pas encore livrée — elle
  // n'affichait que la carte GPS nue. On pousse ces infos dès le clic sur le
  // bouton orange "Commande récupérée", fire-and-forget comme le callback de
  // livraison terminée plus bas dans dispatch.ts.
  if (updated.trackingNumber && updated.delivererId) {
    db.select().from(deliverersTable).where(eq(deliverersTable.id, updated.delivererId))
      .then(([deliverer]) => {
        if (!deliverer) return;
        return fetch(`https://www.safi-bridge.ma/api/tracking/${updated.trackingNumber}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "on_the_way",
            driverName: deliverer.name,
            driverPhone: deliverer.phone,
            driverPhoto: deliverer.photoUrl ?? undefined,
            driverRating: deliverer.rating,
          }),
        });
      })
      .then((r) => { if (r) req.log.info({ trackingNumber: updated.trackingNumber, ok: r.ok }, "Bridge-safi notified of pickup (driver info)"); })
      .catch((err) => req.log.warn({ err, trackingNumber: updated.trackingNumber }, "Failed to notify Bridge-safi of pickup"));
  }
});

router.get("/deliveries/:id", async (req, res): Promise<void> => {
  const params = GetDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [delivery] = await db.select().from(deliveriesTable).where(eq(deliveriesTable.id, params.data.id));
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  res.json(GetDeliveryResponse.parse(serializeDelivery(delivery)));
});

router.patch("/deliveries/:id", async (req, res): Promise<void> => {
  const params = UpdateDeliveryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDeliveryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const extraFields: Record<string, unknown> = {};
  if (parsed.data.status === "in_progress") {
    extraFields.pickedUpAt = new Date();
  }

  const [delivery] = await db
    .update(deliveriesTable)
    .set({ ...parsed.data, ...extraFields, updatedAt: new Date() })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  res.json(UpdateDeliveryResponse.parse(serializeDelivery(delivery)));
});

export default router;

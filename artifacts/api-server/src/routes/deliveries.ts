import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, deliveriesTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { serializeDelivery } from "../lib/serializers";
import { sendPushToAllDeliverers } from "./push";

const router: IRouter = Router();

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

  // Current 15-day pay period: 1-15 or 16-end of month
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() <= 15 ? 1 : 16);
  periodStart.setHours(0, 0, 0, 0);

  const todayDeliveries = all.filter(d => new Date(d.createdAt) >= today);
  const completed = todayDeliveries.filter(d => d.status === "delivered");
  const inProgress = all.filter(d => d.status === "in_progress");
  const pending = all.filter(d => d.status === "pending");
  const cancelled = todayDeliveries.filter(d => d.status === "cancelled");

  const periodDeliveries = all.filter(d => d.status === "delivered" && new Date(d.createdAt) >= periodStart);

  const earningsToday = completed.length * 7;
  const earningsWeek = periodDeliveries.length * 7;

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
      dispatchPhase: "cascade",
      dispatchedAt: new Date(),
    })
    .returning();

  req.log.info({ deliveryId: delivery.id }, "Delivery created — auto-dispatched to all deliverers");

  res.status(201).json(GetDeliveryResponse.parse(serializeDelivery(delivery)));

  // Push après la réponse pour ne pas bloquer le client
  sendPushToAllDeliverers({
    title: `🔔 Nouvelle commande — ${delivery.customerName}`,
    body: `📍 ${delivery.deliveryAddress}\n⏱️ 5 min pour accepter`,
    url: "/livreur",
    urgent: true,
  }).catch(() => {});
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
  const [delivery] = await db
    .update(deliveriesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(deliveriesTable.id, params.data.id))
    .returning();
  if (!delivery) {
    res.status(404).json({ error: "Delivery not found" });
    return;
  }
  res.json(UpdateDeliveryResponse.parse(serializeDelivery(delivery)));
});

export default router;

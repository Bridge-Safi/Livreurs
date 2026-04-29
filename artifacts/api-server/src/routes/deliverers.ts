import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverersTable } from "@workspace/db";
import {
  CreateDelivererBody,
  UpdateDelivererBody,
  UpdateDelivererParams,
  GetDelivererParams,
  GetDelivererResponse,
  UpdateDelivererResponse,
  ListDeliverersResponse,
} from "@workspace/api-zod";
import { serializeDeliverer } from "../lib/serializers";

const router: IRouter = Router();

router.get("/deliverers", async (_req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const deliverers = await db.select().from(deliverersTable).orderBy(deliverersTable.createdAt);
  res.json(ListDeliverersResponse.parse(deliverers.map(serializeDeliverer)));
});

router.post("/deliverers", async (req, res): Promise<void> => {
  const parsed = CreateDelivererBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deliverer] = await db.insert(deliverersTable).values(parsed.data).returning();
  res.status(201).json(GetDelivererResponse.parse(serializeDeliverer(deliverer)));
});

router.get("/deliverers/:id", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const params = GetDelivererParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deliverer] = await db.select().from(deliverersTable).where(eq(deliverersTable.id, params.data.id));
  if (!deliverer) {
    res.status(404).json({ error: "Deliverer not found" });
    return;
  }
  res.json(GetDelivererResponse.parse(serializeDeliverer(deliverer)));
});

router.patch("/deliverers/:id", async (req, res): Promise<void> => {
  const params = UpdateDelivererParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDelivererBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [deliverer] = await db
    .update(deliverersTable)
    .set(parsed.data)
    .where(eq(deliverersTable.id, params.data.id))
    .returning();
  if (!deliverer) {
    res.status(404).json({ error: "Deliverer not found" });
    return;
  }
  res.json(UpdateDelivererResponse.parse(serializeDeliverer(deliverer)));
});

export default router;

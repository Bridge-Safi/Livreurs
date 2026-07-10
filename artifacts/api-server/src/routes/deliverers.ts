import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, deliverersTable, delivererReviewsTable } from "@workspace/db";
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

// Lightweight endpoint to update deliverer GPS position (called silently by the app)
router.patch("/deliverers/:id/location", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const { lat, lng } = req.body as { lat?: unknown; lng?: unknown };
  if (typeof lat !== "number" || typeof lng !== "number") {
    res.status(400).json({ error: "lat et lng requis (number)" });
    return;
  }
  const [updated] = await db
    .update(deliverersTable)
    .set({ lastLat: lat, lastLng: lng })
    .where(eq(deliverersTable.id, id))
    .returning({ id: deliverersTable.id });
  if (!updated) {
    res.status(404).json({ error: "Livreur introuvable" });
    return;
  }
  res.json({ ok: true });
});

// Liste des avis (note + commentaire) laissés par les clients pour ce
// livreur — affiché sur sa page Profil. Ordre du plus récent au plus ancien.
router.get("/deliverers/:id/reviews", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const limitRaw = parseInt(req.query.limit as string, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const rows = await db
    .select()
    .from(delivererReviewsTable)
    .where(eq(delivererReviewsTable.delivererId, id))
    .orderBy(desc(delivererReviewsTable.createdAt))
    .limit(limit);

  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  })));
});

export default router;

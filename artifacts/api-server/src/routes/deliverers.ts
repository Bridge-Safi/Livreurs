import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
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
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Colonnes documents/paiement/verrouillage ajoutees de facon idempotente
// (pas d'acces console DB direct) - demande zabi 2026-07-10 "la page ou le
// livreur peut poser et voir ses documents" (#90/#96). On etend directement
// la table deliverers plutot que d'ajouter une table a part, car ce sont des
// attributs 1-1 du livreur.
async function ensureDelivererDocumentColumns() {
  try {
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS cin_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS cin_photo_back_url TEXT`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS permis_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS carte_grise_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS rib TEXT`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'`);
    await db.execute(sql`ALTER TABLE deliverers ADD COLUMN IF NOT EXISTS profile_locked BOOLEAN NOT NULL DEFAULT false`);
    logger.info("deliverers document/payment columns verified");
  } catch (err) {
    logger.error({ err }, "Failed to ensure deliverer document columns");
  }
}
ensureDelivererDocumentColumns();

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

// ── Documents + moyen de paiement livreur (#90/#96) ──────────────────────
// Champs hors schema genere (api-zod), donc routes "maison" en SQL brut,
// meme logique que /reviews plus haut. Le nom + la photo de profil sont
// verrouilles (plus modifiables) des qu'ils ont ete enregistres une premiere
// fois avec succes ici - demande explicite zabi. Les documents et le RIB
// restent modifiables ensuite (un livreur doit pouvoir mettre a jour un
// document expire).
router.get("/deliverers/:id/documents", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const rows = await db.execute(sql`
    SELECT name, phone, photo_url AS "photoUrl", vehicle_type AS "vehicleType",
           cin_photo_url AS "cinPhotoUrl", cin_photo_back_url AS "cinPhotoBackUrl",
           permis_photo_url AS "permisPhotoUrl", carte_grise_photo_url AS "carteGrisePhotoUrl",
           rib, payment_method AS "paymentMethod", profile_locked AS "profileLocked"
    FROM deliverers WHERE id = ${id} LIMIT 1
  `);
  const row = (rows as unknown as { rows: Record<string, unknown>[] }).rows?.[0];
  if (!row) {
    res.status(404).json({ error: "Livreur introuvable" });
    return;
  }
  res.json(row);
});

router.put("/deliverers/:id/documents", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const body = req.body as {
    name?: string; photoUrl?: string;
    cinPhotoUrl?: string; cinPhotoBackUrl?: string;
    permisPhotoUrl?: string; carteGrisePhotoUrl?: string;
    rib?: string; paymentMethod?: "cash" | "rib";
  };

  const lockedRows = await db.execute(sql`SELECT profile_locked AS "profileLocked" FROM deliverers WHERE id = ${id} LIMIT 1`);
  const lockedRow = (lockedRows as unknown as { rows: { profileLocked: boolean }[] }).rows?.[0];
  if (!lockedRow) {
    res.status(404).json({ error: "Livreur introuvable" });
    return;
  }
  const wasLocked = !!lockedRow.profileLocked;

  // Nom + photo : ignores silencieusement si deja verrouilles (au lieu de
  // renvoyer une erreur qui casserait la sauvegarde des autres champs).
  const nextName = !wasLocked && typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  const nextPhoto = !wasLocked && typeof body.photoUrl === "string" && body.photoUrl ? body.photoUrl : undefined;

  await db.execute(sql`
    UPDATE deliverers SET
      name = COALESCE(${nextName ?? null}, name),
      photo_url = COALESCE(${nextPhoto ?? null}, photo_url),
      cin_photo_url = COALESCE(${body.cinPhotoUrl ?? null}, cin_photo_url),
      cin_photo_back_url = COALESCE(${body.cinPhotoBackUrl ?? null}, cin_photo_back_url),
      permis_photo_url = COALESCE(${body.permisPhotoUrl ?? null}, permis_photo_url),
      carte_grise_photo_url = COALESCE(${body.carteGrisePhotoUrl ?? null}, carte_grise_photo_url),
      rib = COALESCE(${body.rib ?? null}, rib),
      payment_method = COALESCE(${body.paymentMethod ?? null}, payment_method)
    WHERE id = ${id}
  `);

  // Verrouillage : des que nom + photo sont tous les deux renseignes (a
  // l'instant T, apres cette sauvegarde), on verrouille pour la suite.
  const afterRows = await db.execute(sql`SELECT name, photo_url AS "photoUrl", profile_locked AS "profileLocked" FROM deliverers WHERE id = ${id} LIMIT 1`);
  const after = (afterRows as unknown as { rows: { name: string; photoUrl: string | null; profileLocked: boolean }[] }).rows?.[0];
  if (after && !after.profileLocked && after.name && after.photoUrl) {
    await db.execute(sql`UPDATE deliverers SET profile_locked = true WHERE id = ${id}`);
  }

  const finalRows = await db.execute(sql`
    SELECT name, phone, photo_url AS "photoUrl", vehicle_type AS "vehicleType",
           cin_photo_url AS "cinPhotoUrl", cin_photo_back_url AS "cinPhotoBackUrl",
           permis_photo_url AS "permisPhotoUrl", carte_grise_photo_url AS "carteGrisePhotoUrl",
           rib, payment_method AS "paymentMethod", profile_locked AS "profileLocked"
    FROM deliverers WHERE id = ${id} LIMIT 1
  `);
  res.json((finalRows as unknown as { rows: Record<string, unknown>[] }).rows?.[0]);
});

export default router;

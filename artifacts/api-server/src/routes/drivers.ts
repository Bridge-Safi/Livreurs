import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, driversTable } from "@workspace/db";
import {
  CreateDriverBody,
  UpdateDriverBody,
  UpdateDriverParams,
  GetDriverParams,
  GetDriverResponse,
  UpdateDriverResponse,
  ListDriversResponse,
} from "@workspace/api-zod";
import { serializeDriver } from "../lib/serializers";
import bcrypt from "bcryptjs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Memes colonnes documents/paiement/verrouillage que sur deliverers (voir
// deliverers.ts), ajoutees ici pour les chauffeurs Taxi Confort + Moto Taxi
// - demande zabi 2026-07-10 "ET CA TU LE MET POUR LES CHAUFFEUR TAXI ET MOTO
// TAXI" (la table drivers sert aux deux, differencies par vehicle_type).
async function ensureDriverDocumentColumns() {
  try {
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cin_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cin_photo_back_url TEXT`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS permis_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS carte_grise_photo_url TEXT`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS rib TEXT`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash'`);
    await db.execute(sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_locked BOOLEAN NOT NULL DEFAULT false`);
    logger.info("drivers document/payment columns verified");
  } catch (err) {
    logger.error({ err }, "Failed to ensure driver document columns");
  }
}
ensureDriverDocumentColumns();

router.get("/drivers", async (_req, res): Promise<void> => {
  const drivers = await db.select().from(driversTable).orderBy(driversTable.createdAt);
  res.json(ListDriversResponse.parse(drivers.map(serializeDriver)));
});

router.post("/drivers", async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = { ...parsed.data };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const [driver] = await db.insert(driversTable).values(data).returning();
  res.status(201).json(GetDriverResponse.parse(serializeDriver(driver)));
});

router.get("/drivers/:id", async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.json(GetDriverResponse.parse(serializeDriver(driver)));
});

router.patch("/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = { ...parsed.data };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const [driver] = await db
    .update(driversTable)
    .set(data)
    .where(eq(driversTable.id, params.data.id))
    .returning();
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.json(UpdateDriverResponse.parse(serializeDriver(driver)));
});

router.delete("/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [driver] = await db
    .delete(driversTable)
    .where(eq(driversTable.id, params.data.id))
    .returning();
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.status(204).send();
});

// ── Documents + moyen de paiement chauffeur (Taxi Confort / Moto Taxi) ───
// Meme logique et memes regles de verrouillage nom/photo que pour les
// livreurs (voir deliverers.ts /documents) - juste sur la table drivers.
router.get("/drivers/:id/documents", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const rows = await db.execute(sql`
    SELECT name, phone, photo_url AS "photoUrl", vehicle_type AS "vehicleType",
           license_number AS "licenseNumber", vehicle_model AS "vehicleModel", vehicle_plate AS "vehiclePlate",
           cin_photo_url AS "cinPhotoUrl", cin_photo_back_url AS "cinPhotoBackUrl",
           permis_photo_url AS "permisPhotoUrl", carte_grise_photo_url AS "carteGrisePhotoUrl",
           rib, payment_method AS "paymentMethod", profile_locked AS "profileLocked"
    FROM drivers WHERE id = ${id} LIMIT 1
  `);
  const row = (rows as unknown as { rows: Record<string, unknown>[] }).rows?.[0];
  if (!row) {
    res.status(404).json({ error: "Chauffeur introuvable" });
    return;
  }
  res.json(row);
});

router.put("/drivers/:id/documents", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "id invalide" });
    return;
  }
  const body = req.body as {
    name?: string; photoUrl?: string; phone?: string;
    cinPhotoUrl?: string; cinPhotoBackUrl?: string;
    permisPhotoUrl?: string; carteGrisePhotoUrl?: string;
    rib?: string; paymentMethod?: "cash" | "rib";
  };

  const lockedRows = await db.execute(sql`SELECT profile_locked AS "profileLocked" FROM drivers WHERE id = ${id} LIMIT 1`);
  const lockedRow = (lockedRows as unknown as { rows: { profileLocked: boolean }[] }).rows?.[0];
  if (!lockedRow) {
    res.status(404).json({ error: "Chauffeur introuvable" });
    return;
  }
  const wasLocked = !!lockedRow.profileLocked;

  const nextName = !wasLocked && typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
  const nextPhoto = !wasLocked && typeof body.photoUrl === "string" && body.photoUrl ? body.photoUrl : undefined;
  const nextPhone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : undefined;

  await db.execute(sql`
    UPDATE drivers SET
      name = COALESCE(${nextName ?? null}, name),
      photo_url = COALESCE(${nextPhoto ?? null}, photo_url),
      phone = COALESCE(${nextPhone ?? null}, phone),
      cin_photo_url = COALESCE(${body.cinPhotoUrl ?? null}, cin_photo_url),
      cin_photo_back_url = COALESCE(${body.cinPhotoBackUrl ?? null}, cin_photo_back_url),
      permis_photo_url = COALESCE(${body.permisPhotoUrl ?? null}, permis_photo_url),
      carte_grise_photo_url = COALESCE(${body.carteGrisePhotoUrl ?? null}, carte_grise_photo_url),
      rib = COALESCE(${body.rib ?? null}, rib),
      payment_method = COALESCE(${body.paymentMethod ?? null}, payment_method)
    WHERE id = ${id}
  `);

  const afterRows = await db.execute(sql`SELECT name, photo_url AS "photoUrl", profile_locked AS "profileLocked" FROM drivers WHERE id = ${id} LIMIT 1`);
  const after = (afterRows as unknown as { rows: { name: string; photoUrl: string | null; profileLocked: boolean }[] }).rows?.[0];
  if (after && !after.profileLocked && after.name && after.photoUrl) {
    await db.execute(sql`UPDATE drivers SET profile_locked = true WHERE id = ${id}`);
  }

  const finalRows = await db.execute(sql`
    SELECT name, phone, photo_url AS "photoUrl", vehicle_type AS "vehicleType",
           license_number AS "licenseNumber", vehicle_model AS "vehicleModel", vehicle_plate AS "vehiclePlate",
           cin_photo_url AS "cinPhotoUrl", cin_photo_back_url AS "cinPhotoBackUrl",
           permis_photo_url AS "permisPhotoUrl", carte_grise_photo_url AS "carteGrisePhotoUrl",
           rib, payment_method AS "paymentMethod", profile_locked AS "profileLocked"
    FROM drivers WHERE id = ${id} LIMIT 1
  `);
  res.json((finalRows as unknown as { rows: Record<string, unknown>[] }).rows?.[0]);
});

export default router;

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

const router: IRouter = Router();

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

router.get("/drivers/_sync_schema_now", async (req, res): Promise<void> => {
  try {
    await db.execute(sql`
      ALTER TABLE drivers
        ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available',
        ADD COLUMN IF NOT EXISTS total_trips integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS rating real NOT NULL DEFAULT 5.0,
        ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'car',
        ADD COLUMN IF NOT EXISTS pin text NOT NULL DEFAULT '5678',
        ADD COLUMN IF NOT EXISTS password text,
        ADD COLUMN IF NOT EXISTS photo_url text,
        ADD COLUMN IF NOT EXISTS license_number text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS vehicle_model text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS vehicle_plate text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now()
    `);
    res.json({ success: true, message: "Schema synced" });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;

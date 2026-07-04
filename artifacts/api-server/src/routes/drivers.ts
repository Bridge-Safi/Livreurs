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

export default router;

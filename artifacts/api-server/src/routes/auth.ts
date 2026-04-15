import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverersTable, driversTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/auth/deliverers", async (req, res): Promise<void> => {
  const deliverers = await db
    .select({ id: deliverersTable.id, name: deliverersTable.name, phone: deliverersTable.phone })
    .from(deliverersTable);
  res.json(deliverers);
});

router.post("/auth/deliverer-verify", async (req, res): Promise<void> => {
  const { delivererId, pin } = req.body;
  if (!delivererId || !pin) {
    res.status(400).json({ success: false, error: "delivererId et pin sont requis" });
    return;
  }

  const [deliverer] = await db
    .select()
    .from(deliverersTable)
    .where(eq(deliverersTable.id, Number(delivererId)));

  if (!deliverer) {
    res.status(404).json({ success: false, error: "Livreur introuvable" });
    return;
  }

  if (deliverer.pin !== String(pin)) {
    res.status(401).json({ success: false, error: "Code PIN incorrect" });
    return;
  }

  res.json({
    success: true,
    id: deliverer.id,
    name: deliverer.name,
    phone: deliverer.phone,
    vehicleType: deliverer.vehicleType,
    status: deliverer.status,
  });
});

router.get("/auth/drivers", async (req, res): Promise<void> => {
  const drivers = await db
    .select({ id: driversTable.id, name: driversTable.name, phone: driversTable.phone })
    .from(driversTable);
  res.json(drivers);
});

router.post("/auth/driver-verify", async (req, res): Promise<void> => {
  const { driverId, pin } = req.body;
  if (!driverId || !pin) {
    res.status(400).json({ success: false, error: "driverId et pin sont requis" });
    return;
  }

  const [driver] = await db
    .select()
    .from(driversTable)
    .where(eq(driversTable.id, Number(driverId)));

  if (!driver) {
    res.status(404).json({ success: false, error: "Chauffeur introuvable" });
    return;
  }

  if (driver.pin !== String(pin)) {
    res.status(401).json({ success: false, error: "Code PIN incorrect" });
    return;
  }

  res.json({
    success: true,
    id: driver.id,
    name: driver.name,
    phone: driver.phone,
    vehicleModel: driver.vehicleModel,
    vehiclePlate: driver.vehiclePlate,
    status: driver.status,
  });
});

export default router;

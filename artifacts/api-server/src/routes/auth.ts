import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverersTable, driversTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

const PIN_ONLY_IDS = new Set([1, 2]);

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// ── GET all deliverers ────────────────────────────────────────────────────
router.get("/auth/deliverers", async (req, res): Promise<void> => {
  const deliverers = await db
    .select({ id: deliverersTable.id, name: deliverersTable.name, email: deliverersTable.email })
    .from(deliverersTable);
  res.json(deliverers);
});

// ── GET all drivers ───────────────────────────────────────────────────────
router.get("/auth/drivers", async (req, res): Promise<void> => {
  const drivers = await db
    .select({ id: driversTable.id, name: driversTable.name, email: driversTable.email })
    .from(driversTable);
  res.json(drivers);
});

// ── POST /auth/login — Email + password OR PIN ────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password, role } = req.body as { email?: string; password?: string; role?: string };
  if (!email || !password || !role || !["livreur", "chauffeur"].includes(role)) {
    res.status(400).json({ success: false, error: "email, password et role requis" });
    return;
  }

  const normalizedEmail = normalizeEmail(email);

  if (role === "livreur") {
    const [user] = await db.select().from(deliverersTable).where(eq(deliverersTable.email, normalizedEmail));
    if (!user) {
      res.status(404).json({ success: false, error: "Email non reconnu. Contactez votre responsable." });
      return;
    }
    // PIN-only admins (id 1 & 2)
    if (PIN_ONLY_IDS.has(user.id)) {
      if (password !== user.pin) {
        res.status(401).json({ success: false, error: "Mot de passe incorrect" });
        return;
      }
    } else {
      if (!user.password) {
        res.status(401).json({ success: false, error: "Aucun mot de passe défini. Contactez votre responsable." });
        return;
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        res.status(401).json({ success: false, error: "Mot de passe incorrect" });
        return;
      }
    }
    req.log.info({ userId: user.id, role }, "Login success");
    res.json({
      success: true,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      vehicleType: user.vehicleType,
      status: user.status,
    });
  } else {
    const [user] = await db.select().from(driversTable).where(eq(driversTable.email, normalizedEmail));
    if (!user) {
      res.status(404).json({ success: false, error: "Email non reconnu. Contactez votre responsable." });
      return;
    }
    if (PIN_ONLY_IDS.has(user.id)) {
      if (password !== user.pin) {
        res.status(401).json({ success: false, error: "Mot de passe incorrect" });
        return;
      }
    } else {
      if (!user.password) {
        res.status(401).json({ success: false, error: "Aucun mot de passe défini. Contactez votre responsable." });
        return;
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        res.status(401).json({ success: false, error: "Mot de passe incorrect" });
        return;
      }
    }
    req.log.info({ userId: user.id, role }, "Login success");
    res.json({
      success: true,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      vehicleModel: user.vehicleModel,
      vehiclePlate: user.vehiclePlate,
      status: user.status,
    });
  }
});

// ── POST /auth/set-password — Admin sets password for a user ──────────────
router.post("/auth/set-password", async (req, res): Promise<void> => {
  const { userId, role, password } = req.body as { userId?: number; role?: string; password?: string };
  if (!userId || !role || !password || !["livreur", "chauffeur"].includes(role)) {
    res.status(400).json({ success: false, error: "userId, role et password requis" });
    return;
  }
  if (password.length < 4) {
    res.status(400).json({ success: false, error: "Mot de passe trop court (min 4 caractères)" });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  if (role === "livreur") {
    await db.update(deliverersTable).set({ password: hashed }).where(eq(deliverersTable.id, userId));
  } else {
    await db.update(driversTable).set({ password: hashed }).where(eq(driversTable.id, userId));
  }
  res.json({ success: true });
});

export default router;

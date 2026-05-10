import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, deliverersTable, driversTable, phoneVerificationsTable } from "@workspace/db";

const router: IRouter = Router();

// ── PIN-only user IDs (first 2 of each role) ──────────────────────────────
const PIN_ONLY_IDS = new Set([1, 2]);

// ── Infobip / SMS helpers ─────────────────────────────────────────────────
function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSms(to: string, text: string): Promise<boolean> {
  const apiKey = process.env.INFOBIP_API_KEY;
  const baseUrl = process.env.INFOBIP_BASE_URL; // e.g. pd23kl.api.infobip.com
  const sender = process.env.INFOBIP_SENDER || "447491163443";
  if (!apiKey || !baseUrl) {
    // Mode développement : afficher le code dans les logs
    console.log(`[OTP DEV] ${to} → ${text}`);
    return true;
  }
  try {
    const resp = await fetch(`https://${baseUrl}/sms/3/messages`, {
      method: "POST",
      headers: {
        "Authorization": `App ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        messages: [{
          destinations: [{ to }],
          sender,
          content: { text },
        }],
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error("[INFOBIP ERROR]", resp.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[SMS ERROR]", err);
    return false;
  }
}

function normalizePhone(raw: string): string {
  let p = raw.replace(/\s+/g, "").replace(/[-().]/g, "");
  if (p.startsWith("0") && p.length === 10) p = "+212" + p.slice(1);
  if (!p.startsWith("+")) p = "+" + p;
  return p;
}

// ── GET all deliverers (for PIN flow, filtered) ────────────────────────────
router.get("/auth/deliverers", async (req, res): Promise<void> => {
  const deliverers = await db
    .select({ id: deliverersTable.id, name: deliverersTable.name, phone: deliverersTable.phone })
    .from(deliverersTable);
  res.json(deliverers);
});

// ── GET all drivers (for PIN flow, filtered) ──────────────────────────────
router.get("/auth/drivers", async (req, res): Promise<void> => {
  const drivers = await db
    .select({ id: driversTable.id, name: driversTable.name, phone: driversTable.phone })
    .from(driversTable);
  res.json(drivers);
});

// ── POST /auth/request-login — Phone-number entry point ───────────────────
// Determines if user should use PIN (id<=2) or OTP, and sends SMS if OTP.
router.post("/auth/request-login", async (req, res): Promise<void> => {
  const { phone, role } = req.body as { phone?: string; role?: string };
  if (!phone || !role || !["livreur", "chauffeur"].includes(role)) {
    res.status(400).json({ success: false, error: "phone et role requis" });
    return;
  }

  const normalized = normalizePhone(phone);

  let user: { id: number; name: string; phone: string | null } | undefined;

  if (role === "livreur") {
    const rows = await db.select({ id: deliverersTable.id, name: deliverersTable.name, phone: deliverersTable.phone })
      .from(deliverersTable);
    user = rows.find(r => r.phone && normalizePhone(r.phone) === normalized);
  } else {
    const rows = await db.select({ id: driversTable.id, name: driversTable.name, phone: driversTable.phone })
      .from(driversTable);
    user = rows.find(r => r.phone && normalizePhone(r.phone) === normalized);
  }

  if (!user) {
    res.status(404).json({ success: false, error: "Numéro non reconnu. Contactez votre responsable." });
    return;
  }

  // First 2 users of each role → PIN flow
  if (PIN_ONLY_IDS.has(user.id)) {
    res.json({ success: true, method: "pin", userId: user.id, name: user.name });
    return;
  }

  // OTP flow — generate & store code
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing OTP for this phone+role
  await db.delete(phoneVerificationsTable)
    .where(and(
      eq(phoneVerificationsTable.phone, normalized),
      eq(phoneVerificationsTable.role, role)
    ));

  await db.insert(phoneVerificationsTable).values({
    phone: normalized,
    role,
    code,
    attempts: 0,
    expiresAt,
  });

  const sent = await sendSms(
    normalized,
    `Bridge Safi — Votre code de connexion : ${code} (valable 10 min)`
  );

  if (!sent) {
    res.status(503).json({ success: false, error: "Erreur envoi SMS. Réessayez." });
    return;
  }

  req.log.info({ userId: user.id, role, phone: normalized.slice(0, -4) + "****" }, "OTP sent");
  res.json({ success: true, method: "otp", userId: user.id, name: user.name });
});

// ── POST /auth/verify-otp ─────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { phone, role, code } = req.body as { phone?: string; role?: string; code?: string };
  if (!phone || !role || !code) {
    res.status(400).json({ success: false, error: "phone, role et code requis" });
    return;
  }

  const normalized = normalizePhone(phone);
  const now = new Date();

  const [record] = await db.select().from(phoneVerificationsTable)
    .where(and(
      eq(phoneVerificationsTable.phone, normalized),
      eq(phoneVerificationsTable.role, role),
      gt(phoneVerificationsTable.expiresAt, now)
    ));

  if (!record) {
    res.status(400).json({ success: false, error: "Code expiré ou invalide. Recommencez." });
    return;
  }

  const attempts = (record.attempts ?? 0) + 1;

  if (attempts > 5) {
    await db.delete(phoneVerificationsTable).where(eq(phoneVerificationsTable.id, record.id));
    res.status(429).json({ success: false, error: "Trop d'essais. Recommencez depuis le début." });
    return;
  }

  if (record.code !== code.trim()) {
    await db.update(phoneVerificationsTable)
      .set({ attempts })
      .where(eq(phoneVerificationsTable.id, record.id));
    const remaining = 5 - attempts;
    res.status(401).json({ success: false, error: `Code incorrect. ${remaining} essai${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}.` });
    return;
  }

  // Code valid — delete record and return user
  await db.delete(phoneVerificationsTable).where(eq(phoneVerificationsTable.id, record.id));

  if (role === "livreur") {
    const rows = await db.select().from(deliverersTable);
    const user = rows.find(r => r.phone && normalizePhone(r.phone) === normalized);
    if (!user) {
      res.status(404).json({ success: false, error: "Livreur introuvable" });
      return;
    }
    res.json({
      success: true,
      id: user.id,
      name: user.name,
      phone: user.phone,
      vehicleType: user.vehicleType,
      status: user.status,
    });
  } else {
    const rows = await db.select().from(driversTable);
    const user = rows.find(r => r.phone && normalizePhone(r.phone) === normalized);
    if (!user) {
      res.status(404).json({ success: false, error: "Chauffeur introuvable" });
      return;
    }
    res.json({
      success: true,
      id: user.id,
      name: user.name,
      phone: user.phone,
      vehicleModel: user.vehicleModel,
      vehiclePlate: user.vehiclePlate,
      status: user.status,
    });
  }
});

// ── POST /auth/deliverer-verify (PIN — unchanged) ─────────────────────────
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

// ── POST /auth/driver-verify (PIN — unchanged) ────────────────────────────
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

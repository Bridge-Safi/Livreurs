import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverersTable, driversTable, passwordResetTokensTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

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

// ── POST /auth/admin-add-user — Insert a new deliverer or driver ──────────
router.post("/auth/admin-add-user", async (req, res): Promise<void> => {
  const adminToken = req.headers["x-admin-token"];
  if (!adminToken || adminToken !== process.env.SESSION_SECRET) {
    res.status(403).json({ success: false, error: "Forbidden" });
    return;
  }
  const { name, email, password, role } = req.body as { name?: string; email?: string; password?: string; role?: string };
  if (!name || !email || !password || !role || !["livreur", "chauffeur"].includes(role)) {
    res.status(400).json({ success: false, error: "name, email, password, role requis" });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  if (role === "livreur") {
    const [inserted] = await db.insert(deliverersTable).values({ name, email, password: hashed, phone: "" }).returning({ id: deliverersTable.id });
    res.json({ success: true, id: inserted.id });
  } else {
    const [inserted] = await db.insert(driversTable).values({ name, email, password: hashed, phone: "", licenseNumber: "", vehicleModel: "", vehiclePlate: "" }).returning({ id: driversTable.id });
    res.json({ success: true, id: inserted.id });
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

// ── POST /auth/forgot-password ─────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email, role } = req.body as { email?: string; role?: string };
  if (!email || !role || !["livreur", "chauffeur"].includes(role)) {
    res.status(400).json({ success: false, error: "email et role requis" });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const table = role === "livreur" ? deliverersTable : driversTable;
  const [user] = await db.select({ id: table.id, name: table.name }).from(table).where(eq(table.email, normalizedEmail));

  // Always return success to avoid email enumeration
  if (!user) {
    res.json({ success: true });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await db.insert(passwordResetTokensTable).values({ email: normalizedEmail, role, token, expiresAt });

  const INFOBIP_BASE_URL = process.env["INFOBIP_BASE_URL"] || "";
  const INFOBIP_API_KEY = process.env["INFOBIP_API_KEY"] || "";

  const appUrl = `https://livreur.safi-bridge.ma`;
  const resetUrl = `${appUrl}/reset-password?token=${token}&role=${role}`;
  const roleLabel = role === "livreur" ? "Livreur de Repas" : "Taxi Confort";

  try {
    const emailRes = await fetch(`https://${INFOBIP_BASE_URL}/email/3/send`, {
      method: "POST",
      headers: {
        "Authorization": `App ${INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        from: "Bridge Safi <no-reply@safi-bridge.ma>",
        to: [{ to: normalizedEmail, placeholders: { firstName: user.name } }],
        subject: "Réinitialisation de votre mot de passe — Bridge Safi",
        htmlBody: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF6EF;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#2C1810;font-size:22px;margin:0;">Bridge Safi</h1>
              <p style="color:#9B7060;font-size:13px;margin:4px 0 0;">${roleLabel}</p>
            </div>
            <div style="background:white;border-radius:16px;padding:28px;border:1px solid #E8DDD0;">
              <p style="color:#2C1810;font-size:16px;margin:0 0 12px;">Bonjour ${user.name},</p>
              <p style="color:#6B4033;font-size:14px;margin:0 0 24px;">
                Tu as demandé à réinitialiser ton mot de passe Bridge. Clique sur le bouton ci-dessous. Ce lien est valable <strong>30 minutes</strong>.
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${resetUrl}" style="background:#C14B2A;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:15px;display:inline-block;">
                  Changer mon mot de passe
                </a>
              </div>
              <p style="color:#9B7060;font-size:12px;margin:16px 0 0;text-align:center;">
                Si tu n'as pas demandé cela, ignore cet email.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      req.log.error({ status: emailRes.status, body: errText }, "Infobip email failed");
    } else {
      req.log.info({ email: normalizedEmail, role }, "Password reset email sent");
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send reset email");
  }

  res.json({ success: true });
});

// ── POST /auth/reset-password ──────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body as { token?: string; password?: string };
  if (!token || !password) {
    res.status(400).json({ success: false, error: "token et password requis" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, error: "Mot de passe trop court (6 caractères min)" });
    return;
  }

  const [resetToken] = await db.select().from(passwordResetTokensTable).where(eq(passwordResetTokensTable.token, token));

  if (!resetToken) {
    res.status(400).json({ success: false, error: "Lien invalide" });
    return;
  }
  if (resetToken.usedAt) {
    res.status(400).json({ success: false, error: "Ce lien a déjà été utilisé" });
    return;
  }
  if (new Date() > resetToken.expiresAt) {
    res.status(400).json({ success: false, error: "Lien expiré — demandez un nouveau lien" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const table = resetToken.role === "livreur" ? deliverersTable : driversTable;
  await db.update(table).set({ password: hashed }).where(eq(table.email, resetToken.email));
  await db.update(passwordResetTokensTable).set({ usedAt: new Date() }).where(eq(passwordResetTokensTable.id, resetToken.id));

  req.log.info({ email: resetToken.email, role: resetToken.role }, "Password reset successful");
  res.json({ success: true });
});

export default router;

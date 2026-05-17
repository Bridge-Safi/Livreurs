import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverersTable, driversTable, passwordResetTokensTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const router: IRouter = Router();

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

// ── POST /auth/login — Email + password ──────────────────────────────────
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
    if (!user.password) {
      res.status(401).json({ success: false, error: "Aucun mot de passe défini. Contactez votre responsable." });
      return;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ success: false, error: "Mot de passe incorrect" });
      return;
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
    if (!user.password) {
      res.status(401).json({ success: false, error: "Aucun mot de passe défini. Contactez votre responsable." });
      return;
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      res.status(401).json({ success: false, error: "Mot de passe incorrect" });
      return;
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

// ── Email helpers ──────────────────────────────────────────────────────────

function buildResetEmailHtml(opts: {
  name: string;
  role: "livreur" | "chauffeur";
  resetUrl: string;
}): string {
  const isLivreur = opts.role === "livreur";
  const accentColor = isLivreur ? "#C14B2A" : "#D4880C";
  const accentLight = isLivreur ? "#FFF0EB" : "#FEF6E4";
  const roleLabel = isLivreur ? "Livreur de Repas" : "Taxi Confort";

  const logoSvg = isLivreur
    ? `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="${accentColor}"/>
        <text x="32" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="white" letter-spacing="1">BRIDGE</text>
        <rect x="10" y="26" width="44" height="22" rx="4" fill="white" opacity="0.15"/>
        <path d="M12 38 Q20 26 32 26 Q44 26 52 38" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="20" cy="42" r="4" fill="white"/>
        <circle cx="44" cy="42" r="4" fill="white"/>
        <path d="M24 42 L40 42" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="28" y="28" width="8" height="10" rx="2" fill="white" opacity="0.9"/>
        <text x="32" y="53" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="bold" fill="white" opacity="0.9">LIVREUR</text>
      </svg>`
    : `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="16" fill="${accentColor}"/>
        <text x="32" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="white" letter-spacing="1">BRIDGE</text>
        <path d="M10 40 Q12 28 22 28 L42 28 Q52 28 54 40 L54 43 Q54 46 51 46 L13 46 Q10 46 10 43 Z" fill="white" opacity="0.2"/>
        <path d="M12 40 Q14 30 22 30 L42 30 Q50 30 52 40" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <rect x="18" y="30" width="10" height="8" rx="2" fill="white" opacity="0.9"/>
        <rect x="36" y="30" width="10" height="8" rx="2" fill="white" opacity="0.9"/>
        <circle cx="19" cy="46" r="5" fill="white"/>
        <circle cx="19" cy="46" r="2" fill="${accentColor}"/>
        <circle cx="45" cy="46" r="5" fill="white"/>
        <circle cx="45" cy="46" r="2" fill="${accentColor}"/>
        <text x="32" y="53" text-anchor="middle" font-family="Arial,sans-serif" font-size="7" font-weight="bold" fill="white" opacity="0.9">TAXI</text>
      </svg>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Réinitialisation — Bridge Safi</title></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0EBE3;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Header -->
        <tr><td align="center" style="padding-bottom:28px;">
          ${logoSvg}
          <div style="margin-top:12px;">
            <span style="font-size:22px;font-weight:800;color:#2C1810;letter-spacing:-0.5px;">Bridge Safi</span>
            <div style="margin-top:4px;">
              <span style="display:inline-block;background:${accentColor};color:white;font-size:11px;font-weight:700;padding:3px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">
                ${roleLabel}
              </span>
            </div>
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Card top stripe -->
          <div style="height:5px;background:linear-gradient(90deg,#C14B2A,#D4880C,#2A7A48,#D4880C,#C14B2A);"></div>

          <div style="padding:36px 32px;">

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#2C1810;">Bonjour, ${opts.name} 👋</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6B4033;line-height:1.6;">
              Tu as demandé à réinitialiser ton mot de passe <strong style="color:#2C1810;">Bridge ${roleLabel}</strong>.<br>
              Clique sur le bouton ci-dessous — ce lien est valable <strong>30&nbsp;minutes</strong>.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
              <a href="${opts.resetUrl}"
                style="display:inline-block;background:${accentColor};color:white;text-decoration:none;
                       padding:16px 40px;border-radius:14px;font-size:16px;font-weight:700;
                       letter-spacing:0.3px;box-shadow:0 4px 16px ${accentColor}55;">
                🔑 &nbsp;Changer mon mot de passe
              </a>
            </td></tr></table>

            <!-- Divider -->
            <div style="border-top:1px solid #F0EBE3;margin-bottom:24px;"></div>

            <!-- Security note -->
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:top;padding-right:12px;">
                <div style="width:36px;height:36px;background:${accentLight};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;text-align:center;line-height:36px;">🔒</div>
              </td>
              <td>
                <p style="margin:0;font-size:13px;color:#9B7060;line-height:1.6;">
                  Si tu n'as pas demandé cette réinitialisation, ignore cet email — ton mot de passe reste inchangé.<br>
                  <span style="color:#C14B2A;font-weight:600;">Ne partage jamais ce lien avec quelqu'un d'autre.</span>
                </p>
              </td>
            </tr></table>

          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <div style="display:inline-flex;gap:6px;margin-bottom:10px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#C14B2A;display:inline-block;"></span>
            <span style="width:8px;height:8px;border-radius:50%;background:#D4880C;display:inline-block;"></span>
            <span style="width:8px;height:8px;border-radius:50%;background:#2A7A48;display:inline-block;"></span>
          </div>
          <p style="margin:0;font-size:12px;color:#B0A090;">Bridge Safi — Safi, Maroc 🇲🇦</p>
          <p style="margin:4px 0 0;font-size:11px;color:#C0B0A0;">livreur.safi-bridge.ma</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendInfobipEmail(opts: {
  to: string;
  subject: string;
  html: string;
  log: typeof console;
}): Promise<boolean> {
  const baseUrl = process.env["INFOBIP_BASE_URL"] || "";
  const apiKey = process.env["INFOBIP_API_KEY"] || "";
  if (!baseUrl || !apiKey) {
    opts.log.error("Missing INFOBIP_BASE_URL or INFOBIP_API_KEY");
    return false;
  }

  const form = new FormData();
  form.append("from", "Bridge Safi <no-reply@safi-bridge.ma>");
  form.append("to", opts.to);
  form.append("subject", opts.subject);
  form.append("html", opts.html);

  try {
    const res = await fetch(`https://${baseUrl}/email/3/send`, {
      method: "POST",
      headers: {
        "Authorization": `App ${apiKey}`,
        "Accept": "application/json",
      },
      body: form,
    });
    const body = await res.text();
    if (!res.ok) {
      opts.log.error(`Infobip error ${res.status}: ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    opts.log.error(`Infobip fetch failed: ${err}`);
    return false;
  }
}

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
    req.log.warn({ email: normalizedEmail, role }, "Forgot-password: email not found");
    res.json({ success: true });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.insert(passwordResetTokensTable).values({ email: normalizedEmail, role, token, expiresAt });

  const resetUrl = `https://livreur.safi-bridge.ma/reset-password?token=${token}&role=${role}`;
  const html = buildResetEmailHtml({ name: user.name, role: role as "livreur" | "chauffeur", resetUrl });
  const subject = role === "livreur"
    ? "🚴 Réinitialisation de ton mot de passe — Bridge Livreur"
    : "🚗 Réinitialisation de ton mot de passe — Bridge Taxi";

  const ok = await sendInfobipEmail({ to: normalizedEmail, subject, html, log: console });
  if (ok) {
    req.log.info({ email: normalizedEmail, role }, "Password reset email sent");
  } else {
    req.log.error({ email: normalizedEmail, role }, "Password reset email failed");
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

import { Router, type IRouter } from "express";
import webpush from "web-push";
import { eq, isNotNull } from "drizzle-orm";
import { db, pushSubscriptionsTable } from "@workspace/db";

const router: IRouter = Router();

const VAPID_PUBLIC_KEY = process.env["VAPID_PUBLIC_KEY"] || "";
const VAPID_PRIVATE_KEY = process.env["VAPID_PRIVATE_KEY"] || "";
const VAPID_SUBJECT = process.env["VAPID_SUBJECT"] || "mailto:admin@bridge-safi.ma";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export { webpush, VAPID_PUBLIC_KEY };

router.get("/push/vapid-public-key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post("/push/subscribe", async (req, res): Promise<void> => {
  const { subscription, delivererId, driverId } = req.body;
  if (!subscription?.endpoint) {
    res.status(400).json({ error: "Subscription manquante" });
    return;
  }

  try {
    await db
      .insert(pushSubscriptionsTable)
      .values({
        delivererId: delivererId ? Number(delivererId) : null,
        driverId: driverId ? Number(driverId) : null,
        endpoint: subscription.endpoint,
        subscription: JSON.stringify(subscription),
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          delivererId: delivererId ? Number(delivererId) : null,
          driverId: driverId ? Number(driverId) : null,
          subscription: JSON.stringify(subscription),
        },
      });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to store push subscription");
    res.status(500).json({ error: "Impossible de sauvegarder la subscription" });
  }
});

router.delete("/push/unsubscribe", async (req, res): Promise<void> => {
  const { endpoint } = req.body;
  if (!endpoint) {
    res.status(400).json({ error: "Endpoint manquant" });
    return;
  }
  await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, endpoint));
  res.json({ success: true });
});

async function sendPushBatch(
  subs: typeof pushSubscriptionsTable.$inferSelect[],
  payload: { title: string; body: string; url?: string; urgent?: boolean }
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("[PUSH] VAPID keys manquantes — push annulé");
    return;
  }
  if (subs.length === 0) {
    console.warn("[PUSH] Aucun abonnement trouvé — personne à notifier");
    return;
  }
  const message = JSON.stringify(payload);
  console.log(`[PUSH] Envoi à ${subs.length} abonné(s) — payload: ${payload.title}`);

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        const parsed = JSON.parse(sub.subscription);
        const result = await webpush.sendNotification(parsed, message, {
          urgency: payload.urgent ? "high" : "normal",
          TTL: 300,
        });
        console.log(`[PUSH] ✅ OK — delivererId=${sub.delivererId ?? "?"} status=${result.statusCode}`);
        return { ok: true, delivererId: sub.delivererId };
      } catch (err: any) {
        console.error(`[PUSH] ❌ ERREUR — delivererId=${sub.delivererId ?? "?"} status=${err?.statusCode} body=${JSON.stringify(err?.body ?? err?.message)}`);
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint));
          console.log(`[PUSH] 🗑 Subscription expirée supprimée — delivererId=${sub.delivererId}`);
        }
        return { ok: false, delivererId: sub.delivererId, error: err?.statusCode };
      }
    })
  );

  const ok = results.filter(r => r.status === "fulfilled" && (r.value as any).ok).length;
  const fail = results.length - ok;
  console.log(`[PUSH] Résultat: ${ok} succès, ${fail} échec(s)`);
}

export async function sendPushToAll(payload: {
  title: string;
  body: string;
  url?: string;
  urgent?: boolean;
}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const allSubs = await db.select().from(pushSubscriptionsTable);
  await sendPushBatch(allSubs, payload);
}

export async function sendPushToAllDeliverers(payload: {
  title: string;
  body: string;
  url?: string;
  urgent?: boolean;
}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(isNotNull(pushSubscriptionsTable.delivererId));
  await sendPushBatch(subs, payload);
}

export default router;

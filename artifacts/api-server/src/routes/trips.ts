import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, tripsTable, driversTable } from "@workspace/db";
import {
  CreateTripBody,
  UpdateTripBody,
  UpdateTripParams,
  GetTripParams,
  GetTripResponse,
  UpdateTripResponse,
  ListTripsResponse,
  ListTripsQueryParams,
  GetTripStatsResponse,
  GetTripStatsQueryParams,
  GetMyPendingRideQueryParams,
  DispatchRideParams,
  AcceptRideParams,
  AcceptRideBody,
  RefuseRideParams,
  RefuseRideBody,
} from "@workspace/api-zod";
import { serializeTrip } from "../lib/serializers";
import { sendPushToAll } from "./push";

const router: IRouter = Router();

const DISPATCH_TIMEOUT_MS = 5 * 60 * 1000;

// ── Ride dispatch: get pending ride for a driver ────────────────────────────
router.get("/trips/pending-dispatch", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");

  const query = GetMyPendingRideQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "driverId est requis" });
    return;
  }
  const driverId = query.data.driverId;

  const allDispatching = await db
    .select()
    .from(tripsTable)
    .where(
      and(
        ne(tripsTable.dispatchPhase, "none"),
        ne(tripsTable.dispatchPhase, "accepted")
      )
    );

  let found = null;
  for (const trip of allDispatching) {
    const now = Date.now();
    const dispatchedTime = trip.dispatchedAt ? new Date(trip.dispatchedAt).getTime() : 0;
    const elapsed = now - dispatchedTime;

    if (elapsed >= DISPATCH_TIMEOUT_MS) {
      await db
        .update(tripsTable)
        .set({ dispatchPhase: "none", updatedAt: new Date() })
        .where(eq(tripsTable.id, trip.id));
      continue;
    }

    const secondsLeft = Math.max(0, Math.floor((DISPATCH_TIMEOUT_MS - elapsed) / 1000));
    found = {
      hasPending: true,
      trip: GetTripResponse.parse(serializeTrip(trip)),
      expiresAt: new Date(dispatchedTime + DISPATCH_TIMEOUT_MS).toISOString(),
      secondsLeft,
      phase: "cascade",
    };
    break;
  }

  if (!found) {
    res.json({ hasPending: false });
    return;
  }
  res.json(found);
});

// ── Ride dispatch: broadcast to all available drivers ──────────────────────
router.post("/trips/:id/dispatch", async (req, res): Promise<void> => {
  const params = DispatchRideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Course introuvable" });
    return;
  }

  const available = await db.select().from(driversTable).where(eq(driversTable.status, "available"));
  if (available.length === 0) {
    res.status(409).json({ error: "Aucun chauffeur disponible pour le moment" });
    return;
  }

  const [updated] = await db
    .update(tripsTable)
    .set({
      driverId: null,
      status: "scheduled",
      dispatchPhase: "cascade",
      dispatchedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tripsTable.id, params.data.id))
    .returning();

  req.log.info({ tripId: params.data.id }, "Ride broadcast to all drivers");

  sendPushToAll({
    title: "🚖 Nouvelle course — Bridge Safi",
    body: `${updated.passengerName} · ${updated.pickupAddress} → ${updated.dropoffAddress} — 5 min pour accepter`,
    url: "/",
  }).catch(() => {});

  res.json(GetTripResponse.parse(serializeTrip(updated)));
});

// ── Ride dispatch: driver accepts a ride ───────────────────────────────────
router.post("/trips/:id/accept", async (req, res): Promise<void> => {
  const params = AcceptRideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AcceptRideBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Course introuvable" });
    return;
  }
  if (trip.dispatchPhase === "none" || trip.dispatchPhase === "accepted") {
    res.status(409).json({ error: "Cette course n'est plus disponible" });
    return;
  }

  const [updated] = await db
    .update(tripsTable)
    .set({
      driverId: body.data.driverId,
      status: "in_progress",
      dispatchPhase: "accepted",
      updatedAt: new Date(),
    })
    .where(eq(tripsTable.id, params.data.id))
    .returning();

  await db
    .update(driversTable)
    .set({ status: "busy" })
    .where(eq(driversTable.id, body.data.driverId));

  req.log.info({ tripId: params.data.id, driverId: body.data.driverId }, "Ride accepted");
  res.json(GetTripResponse.parse(serializeTrip(updated)));
});

// ── Ride dispatch: driver refuses a ride ────────────────────────────────────
router.post("/trips/:id/refuse", async (req, res): Promise<void> => {
  const params = RefuseRideParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = RefuseRideBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Course introuvable" });
    return;
  }

  req.log.info({ tripId: params.data.id, driverId: body.data.driverId }, "Ride refused (local only)");
  res.json(GetTripResponse.parse(serializeTrip(trip)));
});

// ── Stats ──────────────────────────────────────────────────────────────────
router.get("/trips/stats", async (req, res): Promise<void> => {
  const queryParams = GetTripStatsQueryParams.safeParse(req.query);
  const driverId = queryParams.success ? queryParams.data.driverId : undefined;

  const whereClause = driverId ? eq(tripsTable.driverId, driverId) : undefined;
  const all = whereClause
    ? await db.select().from(tripsTable).where(whereClause)
    : await db.select().from(tripsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTrips = all.filter(t => new Date(t.createdAt) >= today);
  const completed = todayTrips.filter(t => t.status === "completed");
  const inProgress = all.filter(t => t.status === "in_progress");
  const cancelled = todayTrips.filter(t => t.status === "cancelled");

  const earningsToday = completed.reduce((sum, t) => sum + (t.fare || 0), 0);
  const earningsWeek = all.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.fare || 0), 0);
  const totalKmToday = completed.reduce((sum, t) => sum + (t.distance || 0), 0);
  const allCompleted = all.filter(t => t.status === "completed");
  const averageFare = allCompleted.length > 0
    ? allCompleted.reduce((sum, t) => sum + (t.fare || 0), 0) / allCompleted.length
    : 0;

  res.json(GetTripStatsResponse.parse({
    totalToday: todayTrips.length,
    completedToday: completed.length,
    inProgress: inProgress.length,
    cancelled: cancelled.length,
    earningsToday,
    earningsWeek,
    totalKmToday,
    averageFare,
  }));
});

// ── List / Create ──────────────────────────────────────────────────────────
router.get("/trips", async (req, res): Promise<void> => {
  const queryParams = ListTripsQueryParams.safeParse(req.query);
  const status = queryParams.success ? queryParams.data.status : undefined;
  const driverId = queryParams.success ? queryParams.data.driverId : undefined;

  let conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(tripsTable.status, status));
  if (driverId) conditions.push(eq(tripsTable.driverId, driverId));

  const trips = conditions.length > 0
    ? await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.createdAt)
    : await db.select().from(tripsTable).orderBy(tripsTable.createdAt);

  res.json(ListTripsResponse.parse(trips.map(serializeTrip)));
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trip] = await db.insert(tripsTable).values(parsed.data).returning();
  res.status(201).json(GetTripResponse.parse(serializeTrip(trip)));
});

// ── Get / Update ───────────────────────────────────────────────────────────
router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(GetTripResponse.parse(serializeTrip(trip)));
});

router.patch("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [trip] = await db
    .update(tripsTable)
    .set(parsed.data)
    .where(eq(tripsTable.id, params.data.id))
    .returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(UpdateTripResponse.parse(serializeTrip(trip)));
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tripsTable } from "@workspace/db";
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
} from "@workspace/api-zod";
import { serializeTrip } from "../lib/serializers";

const router: IRouter = Router();

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

  const stats = {
    totalToday: todayTrips.length,
    completedToday: completed.length,
    inProgress: inProgress.length,
    cancelled: cancelled.length,
    earningsToday,
    earningsWeek,
    totalKmToday,
    averageFare,
  };

  res.json(GetTripStatsResponse.parse(stats));
});

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

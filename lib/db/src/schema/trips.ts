import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  passengerName: text("passenger_name").notNull(),
  passengerPhone: text("passenger_phone"),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  status: text("status").notNull().default("scheduled"),
  fare: real("fare").notNull(),
  distance: real("distance"),
  duration: integer("duration"),
  driverId: integer("driver_id"),
  scheduledAt: text("scheduled_at"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  dispatchPhase: text("dispatch_phase").default("none"),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  passengerPickedUpAt: timestamp("passenger_picked_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  // ── InDrive-style negotiation ──────────────────────────────────────────────
  suggestedFare: real("suggested_fare"),          // auto-calculated: base + km × rate
  passengerOffer: real("passenger_offer"),        // price passenger proposes
  driverOffer: real("driver_offer"),              // driver counter-offer
  negotiationStatus: text("negotiation_status").default("open"), // open | countered | agreed
  pricePerKm: real("price_per_km").default(2.5), // DH/km at booking time
  baseFare: real("base_fare").default(5),         // base flat DH
  vehicleType: text("vehicle_type").notNull().default("car"), // car | moto
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;

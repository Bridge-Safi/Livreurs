import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  delivererId: integer("deliverer_id"),
  driverId: integer("driver_id"),
  endpoint: text("endpoint").notNull().unique(),
  subscription: text("subscription").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;

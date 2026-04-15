import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliverersTable = pgTable("deliverers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  vehicleType: text("vehicle_type").notNull().default("motorcycle"),
  status: text("status").notNull().default("available"),
  zone: text("zone"),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  rating: real("rating").notNull().default(5.0),
  averageDeliveryTime: real("average_delivery_time").notNull().default(30),
  pin: text("pin").notNull().default("1612"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDelivererSchema = createInsertSchema(deliverersTable).omit({ id: true, createdAt: true });
export type InsertDeliverer = z.infer<typeof insertDelivererSchema>;
export type Deliverer = typeof deliverersTable.$inferSelect;

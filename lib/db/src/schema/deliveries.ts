import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  trackingNumber: text("tracking_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("normal"),
  weight: real("weight"),
  notes: text("notes"),
  delivererId: integer("deliverer_id"),
  estimatedDeliveryTime: text("estimated_delivery_time"),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  dispatchPhase: text("dispatch_phase").default("none"),
  pickupLat: real("pickup_lat"),
  pickupLng: real("pickup_lng"),
  serviceType: text("service_type").default("eats"), // eats | tabac | pharmacie | fleurs | autre | click_collect
  confirmCode: text("confirm_code"),
  // Paiement — permet au livreur de savoir s'il doit encaisser du cash à la
  // livraison, combien, et de confirmer qu'il l'a bien fait.
  paymentMethod: text("payment_method"), // cash | card | online | qr
  amountToCollect: real("amount_to_collect"),
  cashCollected: boolean("cash_collected").notNull().default(false),
  // Statut cote restaurateur (dashboard resto) : null (aucun signal) |
  // "preparing" | "ready". Tant que c'est "preparing", le livreur ne peut
  // pas appuyer sur "Commande recuperee".
  restaurantStatus: text("restaurant_status"),
  estimatedPrepTime: integer("estimated_prep_time"),
  pickedUpAt: timestamp("picked_up_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;

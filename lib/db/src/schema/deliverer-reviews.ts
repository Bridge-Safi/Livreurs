import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";

export const delivererReviewsTable = pgTable("deliverer_reviews", {
  id: serial("id").primaryKey(),
  delivererId: integer("deliverer_id").notNull(),
  orderRef: text("order_ref"),
  stars: real("stars").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DelivererReview = typeof delivererReviewsTable.$inferSelect;

import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const phoneVerificationsTable = pgTable("phone_verifications", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  role: text("role").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

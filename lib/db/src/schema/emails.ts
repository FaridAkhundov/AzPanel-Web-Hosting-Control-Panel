import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emailsTable = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  domain: text("domain").notNull(),
  password: text("password").notNull(),
  quota: integer("quota").notNull().default(1024),
  used: numeric("used", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emailsTable).omit({ id: true, createdAt: true, used: true });
export type InsertEmail = z.infer<typeof insertEmailSchema>;
export type EmailAccount = typeof emailsTable.$inferSelect;

import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const databasesTable = pgTable("hosting_databases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dbUser: text("db_user").notNull(),
  password: text("password").notNull(),
  size: numeric("size", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDatabaseSchema = createInsertSchema(databasesTable).omit({ id: true, createdAt: true, size: true });
export type InsertDatabase = z.infer<typeof insertDatabaseSchema>;
export type HostingDatabase = typeof databasesTable.$inferSelect;

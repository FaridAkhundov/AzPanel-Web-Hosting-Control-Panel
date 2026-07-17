import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const cronjobsTable = pgTable("cronjobs", {
  id: serial("id").primaryKey(),
  command: text("command").notNull(),
  schedule: text("schedule").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

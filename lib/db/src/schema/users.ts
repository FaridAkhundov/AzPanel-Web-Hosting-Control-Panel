import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const panelUsersTable = pgTable("panel_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPanelUserSchema = createInsertSchema(panelUsersTable).omit({ id: true, createdAt: true });
export type InsertPanelUser = z.infer<typeof insertPanelUserSchema>;
export type PanelUser = typeof panelUsersTable.$inferSelect;

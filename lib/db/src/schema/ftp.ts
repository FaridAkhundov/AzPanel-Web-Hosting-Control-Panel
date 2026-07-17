import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ftpTable = pgTable("ftp_accounts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  directory: text("directory").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFtpSchema = createInsertSchema(ftpTable).omit({ id: true, createdAt: true });
export type InsertFtp = z.infer<typeof insertFtpSchema>;
export type FtpAccount = typeof ftpTable.$inferSelect;

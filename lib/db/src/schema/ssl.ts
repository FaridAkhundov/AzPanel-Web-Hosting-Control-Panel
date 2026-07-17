import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sslTable = pgTable("ssl_certs", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  issuer: text("issuer").notNull().default("Let's Encrypt"),
  type: text("type").notNull().default("letsencrypt"),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSslSchema = createInsertSchema(sslTable).omit({ id: true, createdAt: true, expiresAt: true, issuer: true, status: true });
export type InsertSsl = z.infer<typeof insertSslSchema>;
export type SslCert = typeof sslTable.$inferSelect;

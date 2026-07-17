import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dnsTable = pgTable("dns_records", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  ttl: integer("ttl").notNull().default(3600),
  priority: integer("priority"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDnsSchema = createInsertSchema(dnsTable).omit({ id: true, createdAt: true });
export type InsertDns = z.infer<typeof insertDnsSchema>;
export type DnsRecord = typeof dnsTable.$inferSelect;

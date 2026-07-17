import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { domainsTable } from "./domains";

export const subdomainsTable = pgTable("subdomains", {
  id: serial("id").primaryKey(),
  domainId: integer("domain_id").notNull().references(() => domainsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  documentRoot: text("document_root").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subdomainsTable, domainsTable, activityTable } from "@workspace/db";

const router: IRouter = Router();

function validateCreateSubdomain(body: any): { domainId: number; name: string; documentRoot: string } | null {
  if (typeof body?.domainId !== 'number' || !Number.isInteger(body.domainId) || body.domainId < 1) return null;
  if (typeof body?.name !== 'string' || body.name.trim().length < 1) return null;
  if (typeof body?.documentRoot !== 'string' || body.documentRoot.trim().length < 1) return null;
  return { domainId: body.domainId, name: body.name.trim(), documentRoot: body.documentRoot.trim() };
}

router.get("/subdomains", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: subdomainsTable.id,
      domainId: subdomainsTable.domainId,
      name: subdomainsTable.name,
      documentRoot: subdomainsTable.documentRoot,
      status: subdomainsTable.status,
      createdAt: subdomainsTable.createdAt,
      domainName: domainsTable.name,
    })
    .from(subdomainsTable)
    .leftJoin(domainsTable, eq(subdomainsTable.domainId, domainsTable.id))
    .orderBy(subdomainsTable.createdAt);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.get("/subdomains/by-domain/:domainId", async (req, res): Promise<void> => {
  const domainId = parseInt(req.params.domainId, 10);
  if (isNaN(domainId)) { res.status(400).json({ error: "Invalid domainId" }); return; }
  const rows = await db
    .select()
    .from(subdomainsTable)
    .where(eq(subdomainsTable.domainId, domainId));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/subdomains", async (req, res): Promise<void> => {
  const data = validateCreateSubdomain(req.body);
  if (!data) { res.status(400).json({ error: "Invalid body: domainId, name, documentRoot required" }); return; }

  const [domain] = await db.select().from(domainsTable).where(eq(domainsTable.id, data.domainId));
  if (!domain) { res.status(404).json({ error: "Parent domain not found" }); return; }

  const [sub] = await db.insert(subdomainsTable).values(data).returning();
  await db.insert(activityTable).values({ action: "Created", resource: "Subdomain", detail: `${data.name}.${domain.name}` });
  res.status(201).json({ ...sub, createdAt: sub.createdAt.toISOString() });
});

router.delete("/subdomains/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(subdomainsTable).where(eq(subdomainsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Subdomain not found" }); return; }
  await db.insert(activityTable).values({ action: "Deleted", resource: "Subdomain", detail: deleted.name });
  res.sendStatus(204);
});

export default router;

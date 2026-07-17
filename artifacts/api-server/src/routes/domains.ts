import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, domainsTable, activityTable } from "@workspace/db";
import {
  ListDomainsResponse,
  CreateDomainBody,
  CreateDomainResponse,
  GetDomainParams,
  GetDomainResponse,
  DeleteDomainParams,
  GetDomainStatsParams,
  GetDomainStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/domains", async (_req, res): Promise<void> => {
  const domains = await db.select().from(domainsTable).orderBy(domainsTable.createdAt);
  res.json(ListDomainsResponse.parse(domains.map(d => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }))));
});

router.post("/domains", async (req, res): Promise<void> => {
  const parsed = CreateDomainBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [domain] = await db.insert(domainsTable).values(parsed.data).returning();
  await db.insert(activityTable).values({
    action: "Created",
    resource: "Domain",
    detail: domain.name,
  });

  res.status(201).json(CreateDomainResponse.parse({ ...domain, createdAt: domain.createdAt.toISOString() }));
});

router.get("/domains/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDomainParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [domain] = await db.select().from(domainsTable).where(eq(domainsTable.id, params.data.id));
  if (!domain) {
    res.status(404).json({ error: "Domain not found" });
    return;
  }

  res.json(GetDomainResponse.parse({ ...domain, createdAt: domain.createdAt.toISOString() }));
});

router.delete("/domains/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDomainParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [domain] = await db.delete(domainsTable).where(eq(domainsTable.id, params.data.id)).returning();
  if (!domain) {
    res.status(404).json({ error: "Domain not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "Domain",
    detail: domain.name,
  });

  res.sendStatus(204);
});

router.get("/domains/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDomainStatsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const stats = {
    domainId: params.data.id,
    requestsToday: Math.floor(Math.random() * 5000) + 100,
    bandwidthToday: parseFloat((Math.random() * 500).toFixed(2)),
    requestsMonth: Math.floor(Math.random() * 150000) + 5000,
    bandwidthMonth: parseFloat((Math.random() * 15000).toFixed(2)),
  };

  res.json(GetDomainStatsResponse.parse(stats));
});

export default router;

import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, dnsTable, activityTable } from "@workspace/db";
import {
  ListDnsParams,
  ListDnsResponse,
  CreateDnsParams,
  CreateDnsBody,
  CreateDnsResponse,
  DeleteDnsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dns/:domainId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.domainId) ? req.params.domainId[0] : req.params.domainId;
  const params = ListDnsParams.safeParse({ domainId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db.select().from(dnsTable).where(eq(dnsTable.domainId, params.data.domainId));
  res.json(ListDnsResponse.parse(records.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))));
});

router.post("/dns/:domainId", async (req, res): Promise<void> => {
  const rawDomain = Array.isArray(req.params.domainId) ? req.params.domainId[0] : req.params.domainId;
  const params = CreateDnsParams.safeParse({ domainId: parseInt(rawDomain, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateDnsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(dnsTable).values({
    domainId: params.data.domainId,
    ...parsed.data,
  }).returning();

  await db.insert(activityTable).values({
    action: "Created",
    resource: "DNS Record",
    detail: `${record.type} ${record.name}`,
  });

  res.status(201).json(CreateDnsResponse.parse({ ...record, createdAt: record.createdAt.toISOString() }));
});

router.delete("/dns/:domainId/:recordId", async (req, res): Promise<void> => {
  const rawDomain = Array.isArray(req.params.domainId) ? req.params.domainId[0] : req.params.domainId;
  const rawRecord = Array.isArray(req.params.recordId) ? req.params.recordId[0] : req.params.recordId;
  const params = DeleteDnsParams.safeParse({
    domainId: parseInt(rawDomain, 10),
    recordId: parseInt(rawRecord, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db.delete(dnsTable)
    .where(and(eq(dnsTable.id, params.data.recordId), eq(dnsTable.domainId, params.data.domainId)))
    .returning();
  if (!record) {
    res.status(404).json({ error: "DNS record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

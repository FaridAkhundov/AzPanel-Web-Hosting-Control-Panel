import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, cronjobsTable, activityTable } from "@workspace/db";

const router: IRouter = Router();

function validateCreate(body: any): { command: string; schedule: string; description: string } | null {
  if (typeof body?.command !== 'string' || body.command.trim().length < 1) return null;
  if (typeof body?.schedule !== 'string' || body.schedule.trim().length < 1) return null;
  return { command: body.command.trim(), schedule: body.schedule.trim(), description: body.description?.trim() || '' };
}

function validateUpdate(body: any): { status?: string; command?: string; schedule?: string; description?: string } {
  const patch: any = {};
  if (body?.status && ['active', 'paused'].includes(body.status)) patch.status = body.status;
  if (typeof body?.command === 'string') patch.command = body.command;
  if (typeof body?.schedule === 'string') patch.schedule = body.schedule;
  if (typeof body?.description === 'string') patch.description = body.description;
  return patch;
}

router.get("/cronjobs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(cronjobsTable).orderBy(cronjobsTable.createdAt);
  res.json(rows.map(r => ({
    ...r,
    lastRun: r.lastRun ? r.lastRun.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/cronjobs", async (req, res): Promise<void> => {
  const data = validateCreate(req.body);
  if (!data) { res.status(400).json({ error: "Invalid body: command and schedule required" }); return; }
  const [job] = await db.insert(cronjobsTable).values(data).returning();
  await db.insert(activityTable).values({ action: "Created", resource: "Cron Job", detail: data.command });
  res.status(201).json({ ...job, lastRun: null, createdAt: job.createdAt.toISOString() });
});

router.patch("/cronjobs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const patch = validateUpdate(req.body);
  if (Object.keys(patch).length === 0) { res.status(400).json({ error: "No valid fields to update" }); return; }
  const [job] = await db.update(cronjobsTable).set(patch).where(eq(cronjobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Cron job not found" }); return; }
  res.json({ ...job, lastRun: job.lastRun ? job.lastRun.toISOString() : null, createdAt: job.createdAt.toISOString() });
});

router.delete("/cronjobs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(cronjobsTable).where(eq(cronjobsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Cron job not found" }); return; }
  await db.insert(activityTable).values({ action: "Deleted", resource: "Cron Job", detail: deleted.command });
  res.sendStatus(204);
});

export default router;

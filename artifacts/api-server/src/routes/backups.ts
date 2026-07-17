import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, backupsTable, activityTable } from "@workspace/db";
import {
  ListBackupsResponse,
  CreateBackupBody,
  CreateBackupResponse,
  DeleteBackupParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/backups", async (_req, res): Promise<void> => {
  const backups = await db.select().from(backupsTable).orderBy(backupsTable.createdAt);
  res.json(ListBackupsResponse.parse(backups.map(b => ({
    ...b,
    size: parseFloat(String(b.size)),
    createdAt: b.createdAt.toISOString(),
  }))));
});

router.post("/backups", async (req, res): Promise<void> => {
  const parsed = CreateBackupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const size = (Math.random() * 500 + 50).toFixed(2);

  const [backup] = await db.insert(backupsTable).values({
    ...parsed.data,
    size,
    status: "completed",
  }).returning();

  await db.insert(activityTable).values({
    action: "Created",
    resource: "Backup",
    detail: backup.name,
  });

  res.status(201).json(CreateBackupResponse.parse({
    ...backup,
    size: parseFloat(String(backup.size)),
    createdAt: backup.createdAt.toISOString(),
  }));
});

router.delete("/backups/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBackupParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [backup] = await db.delete(backupsTable).where(eq(backupsTable.id, params.data.id)).returning();
  if (!backup) {
    res.status(404).json({ error: "Backup not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "Backup",
    detail: backup.name,
  });

  res.sendStatus(204);
});

export default router;

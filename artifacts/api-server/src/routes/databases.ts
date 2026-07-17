import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, databasesTable, activityTable } from "@workspace/db";
import {
  ListDatabasesResponse,
  CreateDatabaseBody,
  CreateDatabaseResponse,
  DeleteDatabaseParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/databases", async (_req, res): Promise<void> => {
  const databases = await db.select().from(databasesTable).orderBy(databasesTable.createdAt);
  res.json(ListDatabasesResponse.parse(databases.map(d => ({
    ...d,
    size: parseFloat(String(d.size)),
    createdAt: d.createdAt.toISOString(),
  }))));
});

router.post("/databases", async (req, res): Promise<void> => {
  const parsed = CreateDatabaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [database] = await db.insert(databasesTable).values(parsed.data).returning();
  await db.insert(activityTable).values({
    action: "Created",
    resource: "Database",
    detail: database.name,
  });

  res.status(201).json(CreateDatabaseResponse.parse({
    ...database,
    size: parseFloat(String(database.size)),
    createdAt: database.createdAt.toISOString(),
  }));
});

router.delete("/databases/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDatabaseParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [database] = await db.delete(databasesTable).where(eq(databasesTable.id, params.data.id)).returning();
  if (!database) {
    res.status(404).json({ error: "Database not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "Database",
    detail: database.name,
  });

  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ftpTable, activityTable } from "@workspace/db";
import {
  ListFtpResponse,
  CreateFtpBody,
  CreateFtpResponse,
  DeleteFtpParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ftp", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(ftpTable).orderBy(ftpTable.createdAt);
  res.json(ListFtpResponse.parse(accounts.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }))));
});

router.post("/ftp", async (req, res): Promise<void> => {
  const parsed = CreateFtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [account] = await db.insert(ftpTable).values(parsed.data).returning();
  await db.insert(activityTable).values({
    action: "Created",
    resource: "FTP Account",
    detail: account.username,
  });

  res.status(201).json(CreateFtpResponse.parse({ ...account, createdAt: account.createdAt.toISOString() }));
});

router.delete("/ftp/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFtpParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [account] = await db.delete(ftpTable).where(eq(ftpTable.id, params.data.id)).returning();
  if (!account) {
    res.status(404).json({ error: "FTP account not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "FTP Account",
    detail: account.username,
  });

  res.sendStatus(204);
});

export default router;

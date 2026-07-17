import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, emailsTable, activityTable } from "@workspace/db";
import {
  ListEmailsResponse,
  CreateEmailBody,
  CreateEmailResponse,
  DeleteEmailParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/emails", async (_req, res): Promise<void> => {
  const emails = await db.select().from(emailsTable).orderBy(emailsTable.createdAt);
  res.json(ListEmailsResponse.parse(emails.map(e => ({
    ...e,
    used: parseFloat(String(e.used)),
    createdAt: e.createdAt.toISOString(),
  }))));
});

router.post("/emails", async (req, res): Promise<void> => {
  const parsed = CreateEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [email] = await db.insert(emailsTable).values(parsed.data).returning();
  await db.insert(activityTable).values({
    action: "Created",
    resource: "Email Account",
    detail: email.address,
  });

  res.status(201).json(CreateEmailResponse.parse({
    ...email,
    used: parseFloat(String(email.used)),
    createdAt: email.createdAt.toISOString(),
  }));
});

router.delete("/emails/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteEmailParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [email] = await db.delete(emailsTable).where(eq(emailsTable.id, params.data.id)).returning();
  if (!email) {
    res.status(404).json({ error: "Email not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "Email Account",
    detail: email.address,
  });

  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sslTable, activityTable } from "@workspace/db";
import {
  ListSslResponse,
  CreateSslBody,
  CreateSslResponse,
  DeleteSslParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ssl", async (_req, res): Promise<void> => {
  const certs = await db.select().from(sslTable).orderBy(sslTable.createdAt);
  res.json(ListSslResponse.parse(certs.map(c => ({
    ...c,
    expiresAt: c.expiresAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }))));
});

router.post("/ssl", async (req, res): Promise<void> => {
  const parsed = CreateSslBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const [cert] = await db.insert(sslTable).values({
    domain: parsed.data.domain,
    type: parsed.data.type,
    issuer: parsed.data.type === "letsencrypt" ? "Let's Encrypt" : "Self-Signed",
    expiresAt,
    status: "active",
  }).returning();

  await db.insert(activityTable).values({
    action: "Created",
    resource: "SSL Certificate",
    detail: cert.domain,
  });

  res.status(201).json(CreateSslResponse.parse({
    ...cert,
    expiresAt: cert.expiresAt.toISOString(),
    createdAt: cert.createdAt.toISOString(),
  }));
});

router.delete("/ssl/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteSslParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cert] = await db.delete(sslTable).where(eq(sslTable.id, params.data.id)).returning();
  if (!cert) {
    res.status(404).json({ error: "SSL cert not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "SSL Certificate",
    detail: cert.domain,
  });

  res.sendStatus(204);
});

export default router;

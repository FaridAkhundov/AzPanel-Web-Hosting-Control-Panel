import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, panelUsersTable, activityTable } from "@workspace/db";
import {
  ListUsersResponse,
  CreateUserBody,
  CreateUserResponse,
  DeleteUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(panelUsersTable).orderBy(panelUsersTable.createdAt);
  res.json(ListUsersResponse.parse(users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.insert(panelUsersTable).values(parsed.data).returning();
  await db.insert(activityTable).values({
    action: "Created",
    resource: "Panel User",
    detail: user.username,
  });

  res.status(201).json(CreateUserResponse.parse({ ...user, createdAt: user.createdAt.toISOString() }));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.delete(panelUsersTable).where(eq(panelUsersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.insert(activityTable).values({
    action: "Deleted",
    resource: "Panel User",
    detail: user.username,
  });

  res.sendStatus(204);
});

export default router;

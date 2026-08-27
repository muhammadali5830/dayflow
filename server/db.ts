import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, routinePlans, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getRoutinePlan(userId: number, planDate: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(routinePlans).where(and(eq(routinePlans.userId, userId), eq(routinePlans.planDate, planDate))).orderBy(desc(routinePlans.updatedAt)).limit(1);
  const row = result[0];
  if (!row) return undefined;
  return { ...row, preferences: JSON.parse(row.preferences), blocks: JSON.parse(row.blocks) };
}

export async function saveRoutinePlan(userId: number, planDate: string, preferences: unknown, blocks: unknown) {
  const db = await getDb();
  if (!db) return { persisted: false };
  const existing = await db.select({ id: routinePlans.id }).from(routinePlans).where(and(eq(routinePlans.userId, userId), eq(routinePlans.planDate, planDate))).limit(1);
  const values = { userId, planDate, preferences: JSON.stringify(preferences), blocks: JSON.stringify(blocks) };
  if (existing[0]) await db.update(routinePlans).set(values).where(eq(routinePlans.id, existing[0].id));
  else await db.insert(routinePlans).values(values);
  return { persisted: true };
}

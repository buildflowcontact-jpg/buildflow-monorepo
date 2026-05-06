import { db, type ActionPriority, type QueuedAction, type QueueStatus } from "./db";

/** Priorité par type d'action */
const PRIORITY_MAP: Record<string, ActionPriority> = {
  incident_create: "high",
  incident_update: "high",
  photo_upload: "high",
  task_update: "medium",
  task_create: "medium",
  delivery_create: "medium",
  event_log: "low",
};

const getPriority = (type: string): ActionPriority =>
  PRIORITY_MAP[type] ?? "medium";

/** Génère une clé d'idempotence pour éviter les doublons lors du replay */
export const buildIdempotencyKey = (
  type: string,
  payload: Record<string, unknown>
): string => {
  const userId = (payload.user_id as string) ?? "anon";
  const entityId = (payload.id as string) ?? String(Date.now());
  return `${type}::${userId}::${entityId}`;
};

export const addToQueue = async (
  type: string,
  payload: Record<string, unknown>
): Promise<void> => {
  const idempotencyKey = buildIdempotencyKey(type, payload);

  // Évite les doublons exacts en file
  const existing = await db.queue
    .where("idempotencyKey")
    .equals(idempotencyKey)
    .and((item) => item.status === "pending")
    .first();

  if (existing) return;

  await db.queue.add({
    type,
    payload,
    status: "pending",
    priority: getPriority(type),
    idempotencyKey,
    retryCount: 0,
    nextRetryAt: 0,
    createdAt: Date.now(),
  });
};

export const getPendingCount = (): Promise<number> =>
  db.queue.where("status").equals("pending").count();

export const getFailedCount = (): Promise<number> =>
  db.queue.where("status").equals("failed").count();

export const getAllQueued = (): Promise<QueuedAction[]> =>
  db.queue.orderBy("createdAt").toArray();

export const clearCompleted = (): Promise<void> =>
  db.queue.where("status").equals("completed" as QueueStatus).delete().then(() => undefined);

export type { QueueStatus, ActionPriority, QueuedAction };

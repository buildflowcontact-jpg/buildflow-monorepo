import Dexie, { type Table } from "dexie";

export type QueueStatus = "pending" | "syncing" | "failed";
export type ActionPriority = "high" | "medium" | "low";

export interface QueuedAction {
  id?: number;
  type: string;
  payload: Record<string, unknown>;
  status: QueueStatus;
  priority: ActionPriority;
  idempotencyKey: string;
  retryCount: number;
  nextRetryAt: number;
  createdAt: number;
  errorMessage?: string;
}

export interface CacheEntry {
  key: string;
  value: unknown;
  expiresAt?: number;
}

class BuildFlowDB extends Dexie {
  queue!: Table<QueuedAction, number>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super("buildflow_offline");
    this.version(1).stores({
      queue: "++id, type, status, priority, idempotencyKey, createdAt, nextRetryAt",
      cache: "key, expiresAt",
    });
  }
}

export const db = new BuildFlowDB();

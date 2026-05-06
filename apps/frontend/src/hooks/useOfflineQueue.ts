import { useEffect, useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/services/offline/db";
import { syncQueue } from "@/services/offline/syncEngine";
import type { QueuedAction } from "@/services/offline/db";

export const useOfflineQueue = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const items = useLiveQuery(
    () => db.queue.orderBy("createdAt").reverse().toArray()
  ) as QueuedAction[] | undefined;

  const pendingCount =
    (items ?? []).filter((i: QueuedAction) => i.status === "pending").length;
  const failedCount =
    (items ?? []).filter((i: QueuedAction) => i.status === "failed").length;

  const forceSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    await syncQueue();
    setIsSyncing(false);
  }, []);

  const retryFailed = useCallback(async () => {
    await db.queue
      .where("status")
      .equals("failed")
      .modify({ status: "pending", retryCount: 0, nextRetryAt: 0 });
    await forceSync();
  }, [forceSync]);

  const clearFailed = useCallback(async () => {
    await db.queue.where("status").equals("failed").delete();
  }, []);

  useEffect(() => {
    if (navigator.onLine && pendingCount > 0) {
      void forceSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    items: items ?? [],
    pendingCount,
    failedCount,
    isSyncing,
    forceSync,
    retryFailed,
    clearFailed,
  };
};
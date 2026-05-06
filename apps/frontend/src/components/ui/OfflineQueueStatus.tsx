import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import type { QueuedAction } from "@/services/offline/db";

const STATUS_LABEL: Record<string, string> = {
  pending: "⏳ En attente",
  syncing: "🔄 Sync…",
  failed: "❌ Échec",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-neutral-400",
};

export const OfflineQueueStatus = () => {
  const { items, pendingCount, failedCount, isSyncing, forceSync, retryFailed, clearFailed } =
    useOfflineQueue();

  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-neutral-900 p-4 text-center text-sm text-neutral-500">
        ✔ File de synchronisation vide
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-neutral-900 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          File offline — {pendingCount} en attente, {failedCount} échec(s)
        </h3>
        <div className="flex gap-2">
          {failedCount > 0 && (
            <>
              <button
                onClick={retryFailed}
                className="rounded-lg bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-500"
              >
                Réessayer
              </button>
              <button
                onClick={clearFailed}
                className="rounded-lg bg-neutral-700 px-2 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-600"
              >
                Effacer
              </button>
            </>
          )}
          {pendingCount > 0 && (
            <button
              onClick={forceSync}
              disabled={isSyncing || !navigator.onLine}
              className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {isSyncing ? "Sync…" : "Forcer sync"}
            </button>
          )}
        </div>
      </div>

      {/* Liste */}
      <ul className="space-y-1 max-h-48 overflow-y-auto">
        {items.map((item: QueuedAction) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className={PRIORITY_COLOR[item.priority] ?? "text-neutral-400"}>●</span>
              <span className="font-mono text-neutral-300">{item.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neutral-500">
                {new Date(item.createdAt).toLocaleTimeString("fr-FR")}
              </span>
              <span className="text-neutral-400">
                {STATUS_LABEL[item.status] ?? item.status}
              </span>
              {item.retryCount > 0 && (
                <span className="text-orange-400">#{item.retryCount}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

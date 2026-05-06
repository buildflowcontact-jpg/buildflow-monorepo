import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export const OfflineBadge = () => {
  const { isOnline, isSyncing } = useOfflineStatus();
  const { pendingCount, failedCount } = useOfflineQueue();

  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null; // Rien à afficher quand tout va bien
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-red-900/80 px-3 py-1 text-xs font-semibold text-red-200 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
        Hors ligne
        {pendingCount > 0 && (
          <span className="ml-1 rounded-full bg-red-700 px-1.5 py-0.5 text-[10px]">
            {pendingCount} en attente
          </span>
        )}
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-yellow-900/80 px-3 py-1 text-xs font-semibold text-yellow-200 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-yellow-400 animate-spin" />
        Synchronisation…
      </div>
    );
  }

  if (failedCount > 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-orange-900/80 px-3 py-1 text-xs font-semibold text-orange-200 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-orange-400" />
        {failedCount} action{failedCount > 1 ? "s" : ""} échouée{failedCount > 1 ? "s" : ""}
      </div>
    );
  }

  return null;
};

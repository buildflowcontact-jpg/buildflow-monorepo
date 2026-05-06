// modules/terrain/components/StatusBar.tsx
import React from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import type { TerrainStats } from '../types';

interface StatusBarProps {
  stats: TerrainStats;
  syncing?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ stats }) => {
  const { isOnline, isSyncing } = useOfflineStatus();
  const { pendingCount, failedCount } = useOfflineQueue();

  return (
    <div className="flex justify-between items-center px-3 py-2 text-xs bg-neutral-900 border-b border-neutral-800">
      <span className={stats.incidentCount > 0 ? 'text-red-400 font-bold' : 'text-neutral-400'}>
        🔴 {stats.incidentCount} incident{stats.incidentCount !== 1 ? 's' : ''}
      </span>
      <span className={stats.lateDeliveryCount > 0 ? 'text-orange-400 font-bold' : 'text-neutral-400'}>
        📦 {stats.lateDeliveryCount} retard{stats.lateDeliveryCount !== 1 ? 's' : ''}
      </span>
      <span className="text-neutral-400">
        {!isOnline ? (
          <span className="text-red-400 font-bold animate-pulse">
            ● hors ligne{pendingCount > 0 ? ` · ${pendingCount} en attente` : ''}
          </span>
        ) : isSyncing ? (
          <span className="text-yellow-400 animate-pulse">⏳ sync…</span>
        ) : failedCount > 0 ? (
          <span className="text-orange-400">⚠ {failedCount} échec(s)</span>
        ) : (
          <span className="text-green-400">● en ligne</span>
        )}
      </span>
    </div>
  );
};

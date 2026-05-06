// modules/terrain/pages/TerrainPage.tsx
// Cockpit terrain — plein écran sombre, optimisé gants / soleil / une main
import React from 'react';
import { useTerrain } from '../hooks/useTerrain';
import { StatusBar } from '../components/StatusBar';
import { CriticalAlerts } from '../components/CriticalAlerts';
import { QuickActionButton } from '../components/QuickActionButton';
import { MissionNow } from '../components/MissionNow';
import { LiveFeed } from '../components/LiveFeed';
import { useIncidentsRealtime } from '../../incidents/hooks/useIncidentsRealtime';
import { useQueryClient } from '@tanstack/react-query';

interface TerrainPageProps {
  projectId: string;
}

export const TerrainPage: React.FC<TerrainPageProps> = ({ projectId }) => {
  const { data, isLoading, isFetching } = useTerrain(projectId);
  const queryClient = useQueryClient();

  // Realtime : invalide aussi le cache terrain quand un incident arrive
  useIncidentsRealtime(projectId);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-neutral-950 text-neutral-400 flex items-center justify-center text-sm">
        Chargement du terrain…
      </div>
    );
  }

  const alerts   = data?.alerts   ?? [];
  const tasks    = data?.tasks    ?? [];
  const feed     = data?.feed     ?? [];
  const stats    = data?.stats    ?? { incidentCount: 0, lateDeliveryCount: 0, progressPercent: 0 };

  return (
    // Plein écran sombre — pas de padding latéral excessif
    <div className="fixed inset-0 bg-neutral-950 text-white flex flex-col overflow-hidden z-40">

      {/* Barre d'état minimale */}
      <StatusBar stats={stats} syncing={isFetching} />

      {/* Alertes critiques */}
      <CriticalAlerts alerts={alerts} />

      {/* Bouton principal — centré, large */}
      <div className="py-5 flex justify-center">
        <QuickActionButton projectId={projectId} />
      </div>

      {/* Mission du moment — max 3 tâches */}
      <MissionNow tasks={tasks} />

      {/* Séparateur */}
      <div className="mx-3 border-t border-neutral-800 my-1" />

      {/* Live feed scrollable — prend l'espace restant */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <LiveFeed items={feed} />
      </div>

      {/* Lien retour discret en bas */}
      <div className="px-3 py-3 border-t border-neutral-800 flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="text-xs text-neutral-500 active:text-neutral-300 transition-colors"
        >
          ← Retour dashboard
        </button>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['terrain', projectId] })}
          className="text-xs text-neutral-500 active:text-neutral-300 transition-colors"
        >
          ↻ Actualiser
        </button>
      </div>
    </div>
  );
};

// modules/incidents/components/IncidentInbox.tsx
// Vue "inbox" pour le chef de chantier — liste les incidents à traiter.
import React, { useState } from 'react';
import { useIncidentsPaginated, INCIDENTS_PAGE_SIZE } from '../hooks/useIncidentsPaginated';
import { useUpdateIncident } from '../hooks/useUpdateIncident';
import { useIncidentWorkflow } from '../hooks/useIncidentWorkflow';
import { usePermissions } from '@/hooks/usePermissions';
import { IncidentCard } from './IncidentCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { downloadCsv } from '@/lib/export';
import type { IncidentRow, IncidentAction } from '../types';

const ACTION_LABELS: Record<IncidentAction, string> = {
  review:       'Mettre en révision',
  approve:      'Approuver',
  reject:       'Rejeter',
  request_info: 'Demander infos',
  start:        'Démarrer',
  resolve:      'Résoudre',
  close:        'Clôturer',
};

interface IncidentInboxProps {
  projectId: string;
}

export const IncidentInbox: React.FC<IncidentInboxProps> = ({ projectId }) => {
  const [page, setPage] = useState(0);
  const { data, isLoading, isError } = useIncidentsPaginated(projectId, page);
  const { mutate: updateIncident } = useUpdateIncident(projectId);
  const { availableActions, transition } = useIncidentWorkflow();
  const { can } = usePermissions(projectId);
  const [selected, setSelected] = useState<IncidentRow | null>(null);

  const incidents = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / INCIDENTS_PAGE_SIZE);
  const canUpdate = can('incidents:update');

  if (isLoading) return (
    <div className="space-y-3 p-4">
      <SkeletonCard /><SkeletonCard />
    </div>
  );
  if (isError) return <p className="text-red-600 text-sm p-4">Erreur de chargement.</p>;
  if (!incidents.length) return <p className="text-gray-400 text-sm p-4">Aucun incident.</p>;

  const handleAction = (incident: IncidentRow, action: IncidentAction) => {
    const nextStatus = transition(incident.status as any, action);
    if (!nextStatus) return;
    updateIncident({ id: incident.id, status: nextStatus });
  };

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['ID', 'Titre', 'Sévérité', 'Statut', 'Créé le'],
      ...incidents.map((inc) => [
        inc.id,
        inc.title ?? '',
        inc.severity ?? '',
        inc.status ?? '',
        inc.created_at ? new Date(inc.created_at).toLocaleDateString('fr-FR') : '',
      ]),
    ];
    downloadCsv(`incidents-${projectId}-p${page + 1}.csv`, rows);
  };

  return (
    <div className="space-y-3 p-4">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <span className="text-xs bf-text-muted">
          {totalCount} incident{totalCount !== 1 ? 's' : ''} au total
        </span>
        <button
          onClick={handleExportCsv}
          className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
          aria-label="Exporter CSV"
        >
          ↓ CSV
        </button>
      </div>

      {/* Liste */}
      {incidents.map((incident) => (
        <div key={incident.id}>
          <IncidentCard incident={incident} onSelect={setSelected} />
          {canUpdate && (
            <div className="flex gap-2 mt-1 px-1 flex-wrap">
              {availableActions(incident.status as any).map((action) => (
                <button
                  key={action}
                  onClick={() => handleAction(incident, action)}
                  className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Précédent
          </button>
          <span className="text-xs bf-text-muted">
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

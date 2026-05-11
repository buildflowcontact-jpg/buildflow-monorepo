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
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data, isLoading, isError } = useIncidentsPaginated(projectId, page);
  const { mutate: updateIncident } = useUpdateIncident(projectId);
  const { availableActions, transition } = useIncidentWorkflow();
  const { can } = usePermissions(projectId);
  const [selected, setSelected] = useState<IncidentRow | null>(null);

  const incidents = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / INCIDENTS_PAGE_SIZE);
  const canUpdate = can('incidents:update');
  const canApprove = can('incidents:approve');

  const periodFiltered = incidents.filter((incident) => {
    const created = new Date(incident.created_at);
    const min = new Date();
    min.setDate(min.getDate() - period);
    return created >= min;
  });

  const severityStats = periodFiltered.reduce<Record<string, number>>((acc, incident) => {
    const key = incident.severity ?? 'non_renseignee';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const workflowStats = periodFiltered.reduce<Record<string, number>>((acc, incident) => {
    const key = incident.status ?? 'non_renseigne';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

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
      <div className="bf-card-soft p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase font-semibold bf-text-muted">Statistiques incidents</p>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-xs"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as 7 | 30 | 90)}
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold mb-1">Par sévérité</p>
            {Object.keys(severityStats).length === 0 ? (
              <p className="text-gray-400">Aucune donnée.</p>
            ) : (
              Object.entries(severityStats).map(([severity, count]) => (
                <p key={severity} className="text-gray-600">{severity}: {count}</p>
              ))
            )}
          </div>
          <div>
            <p className="font-semibold mb-1">Workflow validation</p>
            {Object.keys(workflowStats).length === 0 ? (
              <p className="text-gray-400">Aucune donnée.</p>
            ) : (
              Object.entries(workflowStats).map(([status, count]) => (
                <p key={status} className="text-gray-600">{status}: {count}</p>
              ))
            )}
          </div>
        </div>
      </div>

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
              {availableActions(incident.status as any)
                .filter((action) => action !== 'approve' || canApprove)
                .map((action) => (
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

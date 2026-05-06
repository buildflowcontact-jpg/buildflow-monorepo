// modules/incidents/components/IncidentInbox.tsx
// Vue "inbox" pour le chef de chantier — liste les incidents à traiter.
import React, { useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useUpdateIncident } from '../hooks/useUpdateIncident';
import { useIncidentWorkflow } from '../hooks/useIncidentWorkflow';
import { IncidentCard } from './IncidentCard';
import type { IncidentRow, IncidentAction } from '../types';

const ACTION_LABELS: Record<IncidentAction, string> = {
  review:       'Mettre en révision',
  approve:      'Approuver',
  reject:       'Rejeter',
  request_info: 'Demander infos',
  start:        'Démarrer',
  resolve:      'Résoudre',
};

interface IncidentInboxProps {
  projectId: string;
}

export const IncidentInbox: React.FC<IncidentInboxProps> = ({ projectId }) => {
  const { data: incidents, isLoading, isError } = useIncidents(projectId);
  const { mutate: updateIncident } = useUpdateIncident(projectId);
  const { availableActions, transition } = useIncidentWorkflow();
  const [selected, setSelected] = useState<IncidentRow | null>(null);

  if (isLoading) return <p className="text-gray-500 text-sm p-4">Chargement...</p>;
  if (isError)   return <p className="text-red-600 text-sm p-4">Erreur de chargement.</p>;
  if (!incidents?.length) return <p className="text-gray-400 text-sm p-4">Aucun incident.</p>;

  const handleAction = (incident: IncidentRow, action: IncidentAction) => {
    const nextStatus = transition(incident.status as any, action);
    if (!nextStatus) return;
    updateIncident({ id: incident.id, status: nextStatus });
  };

  return (
    <div className="space-y-3 p-4">
      {incidents.map((incident) => (
        <div key={incident.id}>
          <IncidentCard incident={incident} onSelect={setSelected} />
          <div className="flex gap-2 mt-1 px-1">
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
        </div>
      ))}
    </div>
  );
};

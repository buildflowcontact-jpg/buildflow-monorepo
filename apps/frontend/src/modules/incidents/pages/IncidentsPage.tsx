// modules/incidents/pages/IncidentsPage.tsx
import React, { useState } from 'react';
import { useIncidentsRealtime } from '../hooks/useIncidentsRealtime';
import { usePermissions } from '@/hooks/usePermissions';
import { IncidentInbox } from '../components/IncidentInbox';
import { IncidentForm } from '../components/IncidentForm';

interface IncidentsPageProps {
  projectId: string;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ projectId }) => {
  const [showForm, setShowForm] = useState(true);
  const { can } = usePermissions(projectId);

  // Active le realtime pour cette page
  useIncidentsRealtime(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bf-text-primary text-2xl font-black tracking-tight">Incidents</h1>
          <p className="bf-text-muted text-sm">Remonter, filtrer et escalader les incidents critiques du chantier.</p>
        </div>
        {can('incidents:create') ? (
          <button
            onClick={() => setShowForm((value) => !value)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {showForm ? 'Masquer formulaire' : 'Signaler un incident'}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className="xl:col-span-4 bf-card-soft p-4">
          <h2 className="bf-text-primary font-black tracking-tight mb-3">Formulaire incident</h2>
          {can('incidents:create') && showForm ? (
            <IncidentForm projectId={projectId} onSuccess={() => setShowForm(false)} />
          ) : (
            <p className="text-sm bf-text-muted">Activez le formulaire pour créer un nouvel incident.</p>
          )}
        </section>

        <section className="xl:col-span-8 bf-card-soft p-4">
          <h2 className="bf-text-primary font-black tracking-tight mb-3">Liste des incidents</h2>
          <IncidentInbox projectId={projectId} />
        </section>
      </div>
    </div>
  );
};

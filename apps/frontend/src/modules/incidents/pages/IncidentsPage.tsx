// modules/incidents/pages/IncidentsPage.tsx
import React, { useState } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useIncidentsRealtime } from '../hooks/useIncidentsRealtime';
import { usePermissions } from '@/hooks/usePermissions';
import { IncidentInbox } from '../components/IncidentInbox';
import { IncidentForm } from '../components/IncidentForm';

interface IncidentsPageProps {
  projectId: string;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ projectId }) => {
  const [showForm, setShowForm] = useState(false);
  const { can } = usePermissions(projectId);

  // Active le realtime pour cette page
  useIncidentsRealtime(projectId);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Incidents</h1>
        {can('incidents:create') && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {showForm ? 'Fermer' : '+ Signaler'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Nouvel incident</h2>
          <IncidentForm projectId={projectId} onSuccess={() => setShowForm(false)} />
        </div>
      )}

      <IncidentInbox projectId={projectId} />
    </div>
  );
};

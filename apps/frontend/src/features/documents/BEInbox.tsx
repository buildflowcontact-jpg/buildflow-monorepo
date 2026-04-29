import React, { useState } from 'react';
import { useInboxIncidents, useCreateDocumentVersion } from './beInboxHooks';
import { IncidentRevisionModal } from './IncidentRevisionModal';
import { useToast } from '../../ui/ToastProvider';

export function BEInbox({ projectId, documentId, userId }: { projectId: string; documentId: string; userId: string }) {
  const { data: incidents, isLoading } = useInboxIncidents(projectId);
  const createVersion = useCreateDocumentVersion();
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  if (isLoading) return <div>Chargement des incidents...</div>;
  if (!incidents || incidents.length === 0) return <div>Aucun incident à traiter.</div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Inbox Bureau d'Études</h3>
      <ul className="space-y-2">
        {incidents.map((incident: any) => (
          <li key={incident.id} className="bg-white rounded p-3 shadow flex flex-col gap-1">
            <div className="text-xs text-gray-400">{new Date(incident.created_at).toLocaleString()}</div>
            <div className="font-bold text-red-700">{incident.description}</div>
            <button
              className="mt-2 w-full py-3 bg-blue-700 text-white rounded-lg font-bold text-lg shadow-md active:scale-95 transition"
              style={{ minHeight: 48 }}
              onClick={() => { setSelectedIncident(incident); setModalOpen(true); }}
            >
              Répondre par une révision
            </button>
          </li>
        ))}
      </ul>
      <IncidentRevisionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedIncident(null); }}
        incident={selectedIncident}
        onSubmit={({ file }) => {
          if (selectedIncident) {
            createVersion.mutate(
              { document_id: documentId, file, created_by: userId },
              {
                onSuccess: () => showToast('Révision uploadée', 'success'),
                onError: () => showToast('Erreur lors de l’upload', 'error'),
              }
            );
            setModalOpen(false);
            setSelectedIncident(null);
          }
        }}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { useDocumentVersions, useCreateDocumentVersion, useDeleteDocumentVersion } from './useDocumentVersions';
import { DocumentVersionModal } from './DocumentVersionModal';

export function DocumentVersionList({ documentId, userId }: { documentId: string; userId: string }) {
  const { data: versions, isLoading } = useDocumentVersions(documentId);
  const createVersion = useCreateDocumentVersion(documentId);
  const deleteVersion = useDeleteDocumentVersion(documentId);
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <div>Chargement des versions...</div>;

  return (
    <div>
      <button
        className="mb-4 px-4 py-2 bg-blue-700 text-white rounded font-bold"
        onClick={() => setModalOpen(true)}
      >
        Nouvelle version
      </button>
      {(!versions || versions.length === 0) ? (
        <div>Aucune version pour ce document.</div>
      ) : (
        <ul className="space-y-2">
          {versions.map((ver: any) => (
            <li key={ver.id} className="flex items-center gap-2 bg-white rounded p-2">
              <span className="font-bold">v{ver.version_number}</span>
              <a
                href={ver.file_url ? `https://YOUR_SUPABASE_URL/storage/v1/object/public/project-media/${ver.file_url}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                Voir le fichier
              </a>
              {ver.is_bpe && <span className="text-xs text-green-600 ml-2">Plan BPE</span>}
              <button
                className="text-xs text-red-600 underline ml-auto"
                onClick={() => { if (window.confirm('Supprimer cette version ?')) deleteVersion.mutate(ver.id); }}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
      <DocumentVersionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={data => {
          createVersion.mutate({ ...data, created_by: userId });
          setModalOpen(false);
        }}
      />
    </div>
  );
}

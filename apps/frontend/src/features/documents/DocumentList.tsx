import React, { useState } from 'react';
import { useProjectDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from './useProjectDocuments';
import { DocumentModal } from './DocumentModal';
import { useToast } from '../../ui/ToastProvider';
import { Spinner } from '../../ui/Spinner';

export function DocumentList({ projectId, onSelect }: { projectId: string; onSelect: (docId: string) => void }) {
  const { data: docs, isLoading } = useProjectDocuments(projectId);
  const createDoc = useCreateDocument(projectId);
  const updateDoc = useUpdateDocument(projectId);
  const deleteDoc = useDeleteDocument(projectId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupNote, setGroupNote] = useState('');
  const { showToast } = useToast();

  if (isLoading) return <div className="flex justify-center items-center py-8"><Spinner size={40} /> <span className="ml-2">Chargement des documents...</span></div>;

  const toggleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };
  const allSelected = docs && selected.length === docs.length;
  const toggleSelectAll = () => {
    if (!docs) return;
    setSelected(allSelected ? [] : docs.map((d: any) => d.id));
  };
  const handleGroupDelete = () => {
    if (selected.length === 0) return;
    if (window.confirm('Supprimer les documents sélectionnés ?')) {
      selected.forEach(id => {
        deleteDoc.mutate(id, {
          onSuccess: () => showToast('Document supprimé', 'success'),
          onError: () => showToast('Erreur lors de la suppression', 'error'),
        });
      });
      setSelected([]);
    }
  };
  const handleGroupAnnotate = () => {
    if (selected.length === 0 || !groupNote) return;
    selected.forEach(id => {
      updateDoc.mutate({ id, note: groupNote }, {
        onSuccess: () => showToast('Note ajoutée', 'success'),
        onError: () => showToast('Erreur lors de l\'annotation', 'error'),
      });
    });
    setGroupNote('');
    setSelected([]);
  };

  return (
    <div>
      <button
        className="mb-4 w-full px-4 py-4 bg-blue-700 text-white rounded-lg font-bold text-lg shadow-md active:scale-95 transition"
        onClick={() => { setEditDoc(null); setModalOpen(true); }}
        style={{ minHeight: 56 }}
        aria-label="Créer un nouveau document"
      >
        Nouveau document
      </button>
      {docs && docs.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} aria-label="Tout sélectionner" />
          <span className="text-xs">Tout sélectionner</span>
          <button
            className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs"
            disabled={selected.length === 0}
            onClick={handleGroupDelete}
          >
            Supprimer sélection
          </button>
          <input
            type="text"
            placeholder="Note groupée..."
            className="ml-2 px-2 py-1 border rounded text-xs"
            value={groupNote}
            onChange={e => setGroupNote(e.target.value)}
          />
          <button
            className="ml-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"
            disabled={selected.length === 0 || !groupNote}
            onClick={handleGroupAnnotate}
          >
            Annoter sélection
          </button>
        </div>
      )}
      {(!docs || docs.length === 0) ? (
        <div>Aucun document pour ce projet.</div>
      ) : (
        <ul className="space-y-2" role="listbox" aria-label="Liste des documents">
          {docs.map((doc: any, idx: number) => (
            <li key={doc.id} className="flex items-center gap-2" role="option" aria-selected={selected.includes(doc.id)}>
              <input
                type="checkbox"
                checked={selected.includes(doc.id)}
                onChange={() => toggleSelect(doc.id)}
                aria-label={`Sélectionner ${doc.title}`}
                tabIndex={0}
              />
              <button
                onClick={() => onSelect(doc.id)}
                className="flex-1 text-left p-4 bg-white rounded-lg hover:bg-blue-50 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ minHeight: 56 }}
                aria-label={`Ouvrir ${doc.title}`}
                tabIndex={0}
              >
                <span className="font-bold text-blue-900">{doc.title}</span>{' '}
                <span className="text-xs text-gray-600">({doc.category})</span>
              </button>
              <button
                className="text-xs text-blue-800 underline px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ fontSize: 16 }}
                onClick={() => { setEditDoc(doc); setModalOpen(true); }}
                aria-label={`Éditer ${doc.title}`}
                tabIndex={0}
              >
                Éditer
              </button>
              <button
                className="text-xs text-red-700 underline px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                style={{ fontSize: 16 }}
                onClick={() => {
                  if (window.confirm('Supprimer ce document ?')) {
                    deleteDoc.mutate(doc.id, {
                      onSuccess: () => showToast('Document supprimé', 'success'),
                      onError: () => showToast('Erreur lors de la suppression', 'error'),
                    });
                  }
                }}
                aria-label={`Supprimer ${doc.title}`}
                tabIndex={0}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
      <DocumentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editDoc ? { title: editDoc.title, category: editDoc.category } : undefined}
        onSubmit={data => {
          if (editDoc) {
            updateDoc.mutate(
              { id: editDoc.id, ...data },
              {
                onSuccess: () => showToast('Document modifié', 'success'),
                onError: () => showToast('Erreur lors de la modification', 'error'),
              }
            );
          } else {
            createDoc.mutate(
              data,
              {
                onSuccess: () => showToast('Document créé', 'success'),
                onError: () => showToast('Erreur lors de la création', 'error'),
              }
            );
          }
          setModalOpen(false);
        }}
      />
    </div>
  );
}

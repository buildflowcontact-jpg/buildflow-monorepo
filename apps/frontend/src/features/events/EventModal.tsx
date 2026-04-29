import React, { useState } from 'react';

export function EventModal({
  open,
  onClose,
  onSubmit,
  initialData
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; description?: string; metadata?: any }) => void;
  initialData?: { type: string; description?: string; metadata?: any };
}) {
  const [type, setType] = useState(initialData?.type || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [metadata, setMetadata] = useState(initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '');

  React.useEffect(() => {
    setType(initialData?.type || '');
    setDescription(initialData?.description || '');
    setMetadata(initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '');
  }, [initialData, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-bold text-lg mb-4">{initialData ? 'Éditer l’événement' : 'Nouvel événement'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            let meta = undefined;
            try { meta = metadata ? JSON.parse(metadata) : undefined; } catch { meta = undefined; }
            onSubmit({ type, description, metadata: meta });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Type</label>
            <input
              type="text"
              required
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <textarea
              value={metadata}
              onChange={e => setMetadata(e.target.value)}
              className="w-full p-2 border rounded font-mono text-xs"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded font-bold">
              {initialData ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

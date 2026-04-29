import React, { useState } from 'react';

export function DocumentModal({
  open,
  onClose,
  onSubmit,
  initialData
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; category?: string }) => void;
  initialData?: { title: string; category?: string };
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || '');

  React.useEffect(() => {
    setTitle(initialData?.title || '');
    setCategory(initialData?.category || '');
  }, [initialData, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-bold text-lg mb-4">{initialData ? 'Éditer le document' : 'Nouveau document'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit({ title, category });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Titre</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Catégorie</label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2 border rounded"
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

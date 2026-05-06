import React, { useState } from 'react';
import { useSuppliers, useCreateSupplier, useDeleteSupplier } from '../hooks/useSuppliers';
import type { SupplierRow } from '../hooks/useSuppliers';

interface Props {
  projectId: string;
}

export function SupplierList({ projectId }: Props) {
  const { data: suppliers = [], isLoading } = useSuppliers(projectId);
  const createSupplier = useCreateSupplier(projectId);
  const deleteSupplier = useDeleteSupplier(projectId);
  const [form, setForm] = useState({ name: '', type: '' });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createSupplier.mutateAsync({ name: form.name.trim(), type: form.type.trim() || undefined });
    setForm({ name: '', type: '' });
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement fournisseurs...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Fournisseurs ({suppliers.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded border space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Nom du fournisseur"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Matériaux, Équipement, Sous-traitant..."
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createSupplier.isPending}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createSupplier.isPending ? 'Ajout...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-600 px-3 py-1 rounded border hover:bg-gray-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="divide-y">
        {suppliers.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucun fournisseur enregistré.</p>
        ) : (
          suppliers.map((s: SupplierRow) => (
            <div key={s.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-sm">{s.name}</span>
                {s.type && (
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {s.type}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteSupplier.mutate(s.id)}
                disabled={deleteSupplier.isPending}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

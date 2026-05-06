import React, { useState } from 'react';
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker, useLogSecurityEvent } from '../hooks/useRHSecurity';
import { useToast } from '@/ui/ToastProvider';

interface WorkerListProps {
  projectId: string;
}

export const WorkerList: React.FC<WorkerListProps> = ({ projectId }) => {
  const { data: workers, isLoading, error } = useWorkers(projectId);
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();
  const logSecurityEvent = useLogSecurityEvent();
  const { showToast } = useToast() || {};

  const [formData, setFormData] = useState({ fullName: '', role: '', company: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    if (editingId) {
      try {
        await updateWorker.mutateAsync({
          workerId: editingId,
          projectId,
          fullName: formData.fullName,
          role: formData.role || undefined,
          company: formData.company || undefined,
        });
        await logSecurityEvent.mutateAsync({
          projectId,
          action: 'update',
          resourceType: 'worker',
          resourceId: editingId,
          details: { full_name: formData.fullName, role: formData.role || null, company: formData.company || null },
        });
        setEditingId(null);
        showToast?.('Collaborateur modifié', 'success');
      } catch {
        showToast?.('Impossible de modifier le collaborateur', 'error');
      }
    } else {
      try {
        const worker = await createWorker.mutateAsync({
          projectId,
          fullName: formData.fullName,
          role: formData.role || undefined,
          company: formData.company || undefined,
        });
        await logSecurityEvent.mutateAsync({
          projectId,
          action: 'create',
          resourceType: 'worker',
          resourceId: worker.id,
          details: { full_name: formData.fullName, role: formData.role || null, company: formData.company || null },
        });
        showToast?.('Collaborateur ajouté', 'success');
      } catch {
        showToast?.('Impossible d’ajouter le collaborateur', 'error');
      }
    }
    setFormData({ fullName: '', role: '', company: '' });
  };

  const handleEdit = (worker: NonNullable<typeof workers>[0]) => {
    setEditingId(worker.id);
    setFormData({
      fullName: worker.full_name,
      role: worker.role || '',
      company: worker.company || '',
    });
  };

  const handleDelete = async (workerId: string) => {
    if (confirm('Supprimer ce collaborateur ?')) {
      try {
        await deleteWorker.mutateAsync({ workerId, projectId });
        await logSecurityEvent.mutateAsync({
          projectId,
          action: 'delete',
          resourceType: 'worker',
          resourceId: workerId,
        });
        showToast?.('Collaborateur supprimé', 'success');
      } catch {
        showToast?.('Impossible de supprimer le collaborateur', 'error');
      }
    }
  };

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Modifier collaborateur' : 'Ajouter collaborateur'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Chef de projet"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entreprise
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: BuildFlow"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createWorker.isPending || updateWorker.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ fullName: '', role: '', company: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Collaborateurs ({workers?.length || 0})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workers?.map((worker) => (
            <div key={worker.id} className="px-6 py-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{worker.full_name}</p>
                {worker.role && <p className="text-sm text-gray-600">{worker.role}</p>}
                {worker.company && <p className="text-xs text-gray-500">{worker.company}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(worker)}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(worker.id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
          {!workers?.length && (
            <div className="px-6 py-8 text-center text-gray-500">
              Aucun collaborateur pour ce projet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

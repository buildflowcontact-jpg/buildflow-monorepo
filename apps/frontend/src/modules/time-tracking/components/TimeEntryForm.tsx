import React, { useState } from 'react';
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry } from '../hooks/useTimeTracking';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface TimeEntryFormProps {
  projectId: string;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ projectId }) => {
  const { data: entries, isLoading, error } = useTimeEntries(projectId);
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const { data: workers } = useQuery({
    queryKey: ['workers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('id, full_name')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const [formData, setFormData] = useState({
    workerId: '',
    taskId: '',
    hours: '',
    description: '',
    workDate: new Date().toISOString().split('T')[0],
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hours || !formData.workDate) return;

    if (editingId) {
      await updateEntry.mutateAsync({
        entryId: editingId,
        projectId,
        hours: parseFloat(formData.hours),
        description: formData.description || undefined,
        workDate: formData.workDate,
      });
      setEditingId(null);
    } else {
      await createEntry.mutateAsync({
        projectId,
        workerId: formData.workerId || undefined,
        taskId: formData.taskId || undefined,
        hours: parseFloat(formData.hours),
        description: formData.description || undefined,
        workDate: formData.workDate,
      });
    }
    setFormData({
      workerId: '',
      taskId: '',
      hours: '',
      description: '',
      workDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (entry: NonNullable<typeof entries>[0]) => {
    setEditingId(entry.id);
    setFormData({
      workerId: entry.worker_id || '',
      taskId: entry.task_id || '',
      hours: entry.hours.toString(),
      description: entry.description || '',
      workDate: entry.work_date,
    });
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('Supprimer cette entrée de temps ?')) {
      await deleteEntry.mutateAsync({ entryId, projectId });
    }
  };

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Modifier entrée de temps' : 'Enregistrer temps'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collaborateur</label>
              <select
                value={formData.workerId}
                onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {workers?.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tâche</label>
              <select
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {tasks?.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Détails du travail effectué"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createEntry.isPending || updateEntry.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? 'Modifier' : 'Enregistrer'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    workerId: '',
                    taskId: '',
                    hours: '',
                    description: '',
                    workDate: new Date().toISOString().split('T')[0],
                  });
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
          <h3 className="text-lg font-semibold text-gray-900">Entrées de temps ({entries?.length || 0})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {entries?.map((entry) => {
            const worker = workers?.find((w: { id: string; full_name: string }) => w.id === entry.worker_id);
            const task = tasks?.find((t: { id: string; title: string }) => t.id === entry.task_id);
            const date = new Date(entry.work_date).toLocaleDateString('fr-FR');
            return (
              <div key={entry.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-gray-900">{date}</span>
                      <span className="text-2xl font-bold text-blue-600">{entry.hours}h</span>
                    </div>
                    {worker && <p className="text-sm text-gray-600">{worker.full_name}</p>}
                    {task && <p className="text-sm text-gray-600">{task.title}</p>}
                    {entry.description && <p className="text-xs text-gray-500 mt-1">{entry.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!entries?.length && (
            <div className="px-6 py-8 text-center text-gray-500">Aucune entrée de temps</div>
          )}
        </div>
      </div>
    </div>
  );
};

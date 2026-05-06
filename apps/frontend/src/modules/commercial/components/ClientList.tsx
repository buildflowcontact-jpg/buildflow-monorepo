import React, { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useCommercial';
import { useToast } from '@/ui/ToastProvider';

interface ClientListProps {
  projectId: string;
}

const CLIENT_STATUSES = ['prospect', 'contacted', 'qualified', 'customer', 'inactive'];

export const ClientList: React.FC<ClientListProps> = ({ projectId }) => {
  const { data: clients, isLoading, error } = useClients(projectId);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { showToast } = useToast() || {};

  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    company: '',
    status: 'prospect',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingId) {
      try {
        await updateClient.mutateAsync({
          clientId: editingId,
          projectId,
          name: formData.name,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
          company: formData.company || undefined,
          status: formData.status,
        });
        setEditingId(null);
        showToast?.('Client modifié', 'success');
      } catch {
        showToast?.('Impossible de modifier le client', 'error');
      }
    } else {
      try {
        await createClient.mutateAsync({
          projectId,
          name: formData.name,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
          company: formData.company || undefined,
          status: formData.status,
        });
        showToast?.('Client ajouté', 'success');
      } catch {
        showToast?.('Impossible d’ajouter le client', 'error');
      }
    }
    setFormData({
      name: '',
      contactEmail: '',
      contactPhone: '',
      company: '',
      status: 'prospect',
    });
  };

  const handleEdit = (client: NonNullable<typeof clients>[0]) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      contactEmail: client.contact_email || '',
      contactPhone: client.contact_phone || '',
      company: client.company || '',
      status: client.status || 'prospect',
    });
  };

  const handleDelete = async (clientId: string) => {
    if (confirm('Supprimer ce client ?')) {
      try {
        await deleteClient.mutateAsync({ clientId, projectId });
        showToast?.('Client supprimé', 'success');
      } catch {
        showToast?.('Impossible de supprimer le client', 'error');
      }
    }
  };

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  const statusColors: Record<string, string> = {
    prospect: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    qualified: 'bg-green-100 text-green-700',
    customer: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Modifier client' : 'Ajouter client'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createClient.isPending || updateClient.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {editingId ? 'Modifier' : 'Ajouter'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    contactEmail: '',
                    contactPhone: '',
                    company: '',
                    status: 'prospect',
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
          <h3 className="text-lg font-semibold text-gray-900">Clients ({clients?.length || 0})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {clients?.map((client) => (
            <div key={client.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
                        statusColors[client.status || 'prospect']
                      }`}
                    >
                      {(client.status || 'prospect').toUpperCase()}
                    </span>
                  </div>
                  {client.company && <p className="text-sm text-gray-600">{client.company}</p>}
                  <div className="text-xs text-gray-500 mt-1">
                    {client.contact_email && <span>{client.contact_email}</span>}
                    {client.contact_email && client.contact_phone && <span> • </span>}
                    {client.contact_phone && <span>{client.contact_phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(client)}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!clients?.length && (
            <div className="px-6 py-8 text-center text-gray-500">Aucun client</div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useSalesLeads, useCreateSalesLead, useUpdateSalesLead, useDeleteSalesLead, useClients } from '../hooks/useCommercial';
import { useToast } from '@/ui/ToastProvider';
import { useCreateProject } from '@/hooks/useCreateProject';

interface SalesLeadPipelineProps {
  projectId: string;
}

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const SalesLeadPipeline: React.FC<SalesLeadPipelineProps> = ({ projectId }) => {
  const { data: leads, isLoading, error } = useSalesLeads(projectId);
  const { data: clients } = useClients(projectId);
  const createLead = useCreateSalesLead();
  const updateLead = useUpdateSalesLead();
  const deleteLead = useDeleteSalesLead();
  const createProject = useCreateProject();
  const { showToast } = useToast() || {};

  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    status: 'new',
    valueHt: '',
  });
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeadId) {
        await updateLead.mutateAsync({
          leadId: editingLeadId,
          projectId,
          status: formData.status,
          description: formData.description || undefined,
          valueHt: formData.valueHt ? parseFloat(formData.valueHt) : undefined,
        });
        setEditingLeadId(null);
        showToast?.('Opportunité modifiée', 'success');
      } else {
        await createLead.mutateAsync({
          projectId,
          clientId: formData.clientId || undefined,
          description: formData.description || undefined,
          status: formData.status,
          valueHt: formData.valueHt ? parseFloat(formData.valueHt) : undefined,
        });
        showToast?.('Opportunité ajoutée', 'success');
      }
      setFormData({
        clientId: '',
        description: '',
        status: 'new',
        valueHt: '',
      });
    } catch {
      showToast?.('Impossible d’enregistrer l’opportunité', 'error');
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const lead = leads?.find((l) => l.id === leadId);
    if (lead) {
      try {
        await updateLead.mutateAsync({
          leadId,
          projectId,
          status: newStatus,
        });
        showToast?.('Statut de l’opportunité mis à jour', 'success');
      } catch {
        showToast?.('Impossible de mettre à jour le statut', 'error');
      }
    }
  };

  const handleDelete = async (leadId: string) => {
    if (confirm('Supprimer cette opportunité ?')) {
      try {
        await deleteLead.mutateAsync({ leadId, projectId });
        showToast?.('Opportunité supprimée', 'success');
      } catch {
        showToast?.('Impossible de supprimer l’opportunité', 'error');
      }
    }
  };

  const handleEditLead = (leadId: string) => {
    const lead = leads?.find((item) => item.id === leadId);
    if (!lead) return;

    setEditingLeadId(lead.id);
    setFormData({
      clientId: lead.client_id || '',
      description: lead.description || '',
      status: lead.status || 'new',
      valueHt: lead.value_ht != null ? String(lead.value_ht) : '',
    });
  };

  const handleConvertToProject = async (leadId: string) => {
    const lead = leads?.find((l) => l.id === leadId);
    if (!lead) return;
    const client = clients?.find((c) => c.id === lead.client_id);
    const projectName = client?.name
      ? `Projet ${client.name}`
      : lead.description
      ? `Projet ${lead.description.slice(0, 40)}`
      : `Projet lead ${leadId.slice(0, 8)}`;
    const code = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20);
    try {
      await createProject.mutateAsync({ name: projectName, code });
      showToast?.(`Projet "${projectName}" créé`, 'success');
    } catch {
      showToast?.('Impossible de créer le projet', 'error');
    }
  };

  const pipelineStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    LEAD_STATUSES.forEach((status) => {
      stats[status] = { count: 0, total: 0 };
    });
    leads?.forEach((lead) => {
      const status = lead.status || 'new';
      stats[status].count += 1;
      stats[status].total += lead.value_ht || 0;
    });
    return stats;
  }, [leads]);

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur lors du chargement</div>;

  return (
    <div className="space-y-6">
      {/* Pipeline Stats */}
      <div className="grid grid-cols-6 gap-3">
        {LEAD_STATUSES.map((status) => (
          <div key={status} className="bg-white rounded-lg shadow p-4">
            <p className="text-xs font-medium text-gray-600 uppercase">{status}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{pipelineStats[status].count}</p>
            <p className="text-xs text-gray-500 mt-1">
              {pipelineStats[status].total > 0
                ? `€ ${(pipelineStats[status].total / 1000).toFixed(1)}k`
                : '-'}
            </p>
          </div>
        ))}
      </div>

      {/* Add Lead Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingLeadId ? 'Modifier opportunité' : 'Ajouter opportunité'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner...</option>
                {clients?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant HT</label>
              <input
                type="number"
                value={formData.valueHt}
                onChange={(e) => setFormData({ ...formData, valueHt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {LEAD_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createLead.isPending || updateLead.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingLeadId ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
          {editingLeadId && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingLeadId(null);
                  setFormData({
                    clientId: '',
                    description: '',
                    status: 'new',
                    valueHt: '',
                  });
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Annuler l’édition
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Leads by Status */}
      <div className="grid grid-cols-2 gap-4">
        {LEAD_STATUSES.map((status) => {
          const statusLeads = leads?.filter((l) => (l.status || 'new') === status) || [];
          return (
            <div key={status} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 text-sm capitalize">{status}</h4>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {statusLeads.map((lead) => {
                  const client = clients?.find((c) => c.id === lead.client_id);
                  return (
                    <div key={lead.id} className="p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {client?.name || lead.description || 'Sans client'}
                          </p>
                          {lead.description && client?.name && (
                            <p className="text-xs text-gray-500 mt-1">{lead.description}</p>
                          )}
                          {lead.value_ht && (
                            <p className="text-xs text-gray-600 mt-1">€ {lead.value_ht.toLocaleString('fr-FR')}</p>
                          )}
                        </div>
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-200 rounded"
                        >
                          {LEAD_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEditLead(lead.id)}
                          className="w-full px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="w-full px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Supprimer
                        </button>
                        {status === 'won' && (
                          <button
                            onClick={() => handleConvertToProject(lead.id)}
                            disabled={createProject.isPending}
                            className="col-span-2 w-full px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 disabled:opacity-50 font-semibold"
                          >
                            Convertir en projet
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {!statusLeads.length && (
                  <div className="p-4 text-center text-gray-400 text-sm">Vide</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

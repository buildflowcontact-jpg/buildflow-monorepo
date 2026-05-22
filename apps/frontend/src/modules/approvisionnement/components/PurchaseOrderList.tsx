import React, { useState } from 'react';
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrderStatus,
  useUpdatePurchaseOrder,
  useCreateDelivery,
} from '../hooks/useProcurement';
import type { PurchaseOrderRow } from '../hooks/useProcurement';
import { useSuppliers } from '../hooks/useSuppliers';
import { uploadAttachmentToSupabase } from '../services/uploadAttachmentToSupabase';
import { supabase } from '@/lib/supabase';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-600' },
  sent: { label: 'Envoyée', className: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmée', className: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Livrée', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-600' },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

interface Props {
  projectId: string;
  view?: 'to_order' | 'in_progress' | 'delivered';
}

export function PurchaseOrderList({ projectId, view = 'to_order' }: Props) {
  const fieldClassName = 'bf-input w-full';
  const selectClassName = 'bf-select w-full rounded-xl px-3 py-2';
  const areaClassName = 'bf-textarea w-full rounded-xl px-3 py-2';
  const { data: orders = [], isLoading } = usePurchaseOrders(projectId);
  const { data: suppliers = [] } = useSuppliers(projectId);
  const [existingOrderDocs, setExistingOrderDocs] = useState<Record<string, string[]>>({});
  const createOrder = useCreatePurchaseOrder(projectId);
  const updateStatus = useUpdatePurchaseOrderStatus(projectId);
  const updateOrder = useUpdatePurchaseOrder(projectId);
  const createDelivery = useCreateDelivery(projectId);
  const [showForm, setShowForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    reference: '',
    supplier_id: '',
    total_ht: '',
    ordered_at: '',
    expected_delivery_at: '',
    notes: '',
  });
  const [editForm, setEditForm] = useState({
    reference: '',
    supplier_id: '',
    total_ht: '',
    ordered_at: '',
    expected_delivery_at: '',
    notes: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  React.useEffect(() => {
    let mounted = true;
    async function loadDocuments() {
      const references = orders.map((order) => order.reference).filter(Boolean);
      if (references.length === 0) {
        if (mounted) setExistingOrderDocs({});
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('id, title, category')
        .eq('project_id', projectId)
        .eq('category', 'purchase_order_attachment');
      if (error || !data) return;

      const { data: versions } = await supabase
        .from('document_versions')
        .select('document_id, file_url');

      const byDocId = new Map<string, string[]>();
      (versions || []).forEach((version) => {
        const urls = byDocId.get(version.document_id) ?? [];
        urls.push(version.file_url);
        byDocId.set(version.document_id, urls);
      });

      const byRef: Record<string, string[]> = {};
      data.forEach((doc) => {
        const ref = doc.title.split('::')[0]?.trim();
        if (!ref) return;
        byRef[ref] = [...(byRef[ref] ?? []), ...(byDocId.get(doc.id) ?? [])];
      });

      if (mounted) setExistingOrderDocs(byRef);
    }

    loadDocuments();
    return () => {
      mounted = false;
    };
  }, [orders, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reference.trim()) return;
    const createdOrder = await createOrder.mutateAsync({
      reference: form.reference.trim(),
      supplier_id: form.supplier_id || null,
      total_ht: form.total_ht ? parseFloat(form.total_ht) : null,
      ordered_at: form.ordered_at || null,
      expected_delivery_at: form.expected_delivery_at || null,
      notes: form.notes.trim() || null,
    });

    if (attachments.length > 0) {
      for (const file of attachments) {
        const path = await uploadAttachmentToSupabase(file, projectId, 'order');
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            title: `${createdOrder.reference} :: ${file.name}`,
            category: 'purchase_order_attachment',
          })
          .select('id')
          .single();
        if (docError || !doc) continue;

        await supabase.from('document_versions').insert({
          document_id: doc.id,
          file_url: path,
          is_bpe: false,
          version_label: 'v1',
        });
      }
    }

    setForm({ reference: '', supplier_id: '', total_ht: '', ordered_at: '', expected_delivery_at: '', notes: '' });
    setAttachments([]);
    setShowForm(false);
  };

  const startEdit = (order: PurchaseOrderRow) => {
    setEditingOrderId(order.id);
    setEditForm({
      reference: order.reference ?? '',
      supplier_id: order.supplier_id ?? '',
      total_ht: order.total_ht != null ? String(order.total_ht) : '',
      ordered_at: order.ordered_at ? String(order.ordered_at).slice(0, 10) : '',
      expected_delivery_at: order.expected_delivery_at ? String(order.expected_delivery_at).slice(0, 10) : '',
      notes: order.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editingOrderId || !editForm.reference.trim()) return;
    await updateOrder.mutateAsync({
      id: editingOrderId,
      reference: editForm.reference.trim(),
      supplier_id: editForm.supplier_id || null,
      total_ht: editForm.total_ht ? parseFloat(editForm.total_ht) : null,
      ordered_at: editForm.ordered_at || null,
      expected_delivery_at: editForm.expected_delivery_at || null,
      notes: editForm.notes.trim() || null,
    });
    setEditingOrderId(null);
  };

  const createPlannedDeliveryFromOrder = async (order: PurchaseOrderRow) => {
    if (!order.expected_delivery_at) return;
    await createDelivery.mutateAsync({
      order_id: order.id,
      supplier_id: order.supplier_id,
      delivered_at: String(order.expected_delivery_at).slice(0, 10),
      status: 'partial',
      notes: `Livraison prevue creee automatiquement depuis ${order.reference}`,
      markOrderDelivered: false,
    });
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement commandes...</div>;
  }

  const filteredOrders = orders.filter((order) => {
    const status = order.status ?? 'draft';
    if (view === 'to_order') return status === 'draft';
    if (view === 'in_progress') return status === 'sent' || status === 'confirmed';
    return status === 'delivered';
  });

  const viewLabel = view === 'to_order' ? 'Commandes a passer' : view === 'in_progress' ? 'Commandes en cours' : 'Commandes livrees';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">{viewLabel} ({filteredOrders.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bf-primary-btn px-3 py-1.5 rounded-lg"
        >
          + Nouvelle commande
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bf-card-soft p-4 rounded-xl border space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Référence *</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className={fieldClassName}
                placeholder="BC-2026-001"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fournisseur</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className={selectClassName}
              >
                <option value="">— Sélectionner —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant HT (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.total_ht}
                onChange={(e) => setForm({ ...form, total_ht: e.target.value })}
                className={fieldClassName}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date commande</label>
              <input
                type="date"
                value={form.ordered_at}
                onChange={(e) => setForm({ ...form, ordered_at: e.target.value })}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Livraison prévue</label>
              <input
                type="date"
                value={form.expected_delivery_at}
                onChange={(e) => setForm({ ...form, expected_delivery_at: e.target.value })}
                className={fieldClassName}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={areaClassName}
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Documents commande</label>
            <input
              type="file"
              multiple
              accept=".pdf,application/pdf,image/*"
              onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
              className={fieldClassName}
            />
            {attachments.length > 0 ? (
              <p className="text-xs text-gray-500 mt-1">{attachments.length} document(s) prêt(s) à l'envoi</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="text-sm bf-primary-btn px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              {createOrder.isPending ? 'Création...' : 'Créer'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="divide-y">
        {filteredOrders.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune commande enregistrée.</p>
        ) : (
          filteredOrders.map((order: PurchaseOrderRow) => {
            const supplierName = suppliers.find((s) => s.id === order.supplier_id)?.name;
            const statusInfo = STATUS_LABELS[order.status ?? ''] ?? { label: order.status, className: 'bg-gray-100 text-gray-600' };
            const transitions = STATUS_TRANSITIONS[order.status ?? ''] ?? [];
            const attachmentUrls = existingOrderDocs[order.reference] ?? [];
            const isLate = Boolean(order.expected_delivery_at && new Date(order.expected_delivery_at) < new Date() && order.status !== 'delivered');

            return (
              <div key={order.id} className="py-3 space-y-1">
                {editingOrderId === order.id ? (
                  <div className="bf-card-soft border rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input className={fieldClassName} value={editForm.reference} onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })} placeholder="Reference" />
                      <select className={selectClassName} value={editForm.supplier_id} onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })}>
                        <option value="">— Fournisseur —</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <input className={fieldClassName} type="number" step="0.01" value={editForm.total_ht} onChange={(e) => setEditForm({ ...editForm, total_ht: e.target.value })} placeholder="Montant HT" />
                      <input className={fieldClassName} type="date" value={editForm.ordered_at} onChange={(e) => setEditForm({ ...editForm, ordered_at: e.target.value })} />
                      <input className={`${fieldClassName} col-span-2`} type="date" value={editForm.expected_delivery_at} onChange={(e) => setEditForm({ ...editForm, expected_delivery_at: e.target.value })} />
                    </div>
                    <textarea className={areaClassName} rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} className="text-xs bf-primary-btn px-2.5 py-1.5 rounded-lg">Enregistrer</button>
                      <button type="button" onClick={() => setEditingOrderId(null)} className="text-xs border border-slate-300 px-2.5 py-1.5 rounded-lg">Annuler</button>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-sm">{order.reference}</span>
                    {supplierName && (
                      <span className="ml-2 text-xs text-gray-500">{supplierName}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {order.total_ht != null && (
                    <span>{order.total_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                  )}
                  {order.ordered_at && (
                    <span>Commande : {new Date(order.ordered_at).toLocaleDateString('fr-FR')}</span>
                  )}
                  {order.expected_delivery_at && (
                    <span>Livraison : {new Date(order.expected_delivery_at).toLocaleDateString('fr-FR')}</span>
                  )}
                  {isLate ? <span className="text-red-600 font-semibold">En retard</span> : null}
                  {order.status === 'delivered' ? <span className="text-green-700 font-semibold">Livrée</span> : null}
                </div>
                {order.notes && (
                  <p className="text-xs text-gray-400 italic">{order.notes}</p>
                )}
                {attachmentUrls.length > 0 ? (
                  <div className="text-xs text-gray-500">
                    Documents ({attachmentUrls.length}) :
                    <div className="flex flex-wrap gap-2 mt-1">
                      {attachmentUrls.map((url, idx) => {
                        const publicUrl = supabase.storage.from('project-media').getPublicUrl(url).data.publicUrl;
                        return (
                          <a key={`${order.id}-${idx}`} href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            Fichier {idx + 1}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {transitions.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => startEdit(order)}
                      className="text-xs border border-slate-300 px-2 py-0.5 rounded hover:bg-slate-50 transition-colors"
                    >
                      Modifier
                    </button>
                    {order.expected_delivery_at ? (
                      <button
                        onClick={() => createPlannedDeliveryFromOrder(order)}
                        disabled={createDelivery.isPending}
                        className="text-xs border border-indigo-300 px-2 py-0.5 rounded hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        + Livraison prevue
                      </button>
                    ) : null}
                    {transitions.map((next: string) => (
                      <button
                        key={next}
                        onClick={() => updateStatus.mutate({ id: order.id, status: next })}
                        disabled={updateStatus.isPending}
                        className="text-xs border border-gray-300 px-2 py-0.5 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        → {STATUS_LABELS[next]?.label ?? next}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

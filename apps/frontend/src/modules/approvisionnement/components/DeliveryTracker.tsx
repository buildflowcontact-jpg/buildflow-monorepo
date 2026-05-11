import React, { useState } from 'react';
import { useDeliveries, useCreateDelivery } from '../hooks/useProcurement';
import type { DeliveryRow } from '../hooks/useProcurement';
import { useSuppliers } from '../hooks/useSuppliers';
import { usePurchaseOrders } from '../hooks/useProcurement';
import { uploadAttachmentToSupabase } from '../services/uploadAttachmentToSupabase';
import { supabase } from '@/lib/supabase';

const DELIVERY_STATUS: Record<string, { label: string; className: string }> = {
  received: { label: 'Reçu', className: 'bg-green-100 text-green-700' },
  partial: { label: 'Partiel', className: 'bg-yellow-100 text-yellow-700' },
  refused: { label: 'Refusé', className: 'bg-red-100 text-red-600' },
};

interface Props {
  projectId: string;
  view?: 'pending' | 'done';
}

export function DeliveryTracker({ projectId, view = 'pending' }: Props) {
  const { data: deliveries = [], isLoading } = useDeliveries(projectId);
  const { data: suppliers = [] } = useSuppliers(projectId);
  const { data: orders = [] } = usePurchaseOrders(projectId);
  const createDelivery = useCreateDelivery(projectId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    order_id: '',
    supplier_id: '',
    delivered_at: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingDeliveryDocs, setExistingDeliveryDocs] = useState<Record<string, string[]>>({});

  React.useEffect(() => {
    let mounted = true;

    async function loadDeliveryDocs() {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, category')
        .eq('project_id', projectId)
        .eq('category', 'delivery_attachment');

      if (!docs || docs.length === 0) {
        if (mounted) setExistingDeliveryDocs({});
        return;
      }

      const { data: versions } = await supabase
        .from('document_versions')
        .select('document_id, file_url');

      const byDocId = new Map<string, string[]>();
      (versions || []).forEach((version) => {
        const urls = byDocId.get(version.document_id) ?? [];
        urls.push(version.file_url);
        byDocId.set(version.document_id, urls);
      });

      const byDeliveryId: Record<string, string[]> = {};
      docs.forEach((doc) => {
        const deliveryId = doc.title.split('::')[0]?.replace('DEL-', '').trim();
        if (!deliveryId) return;
        byDeliveryId[deliveryId] = [...(byDeliveryId[deliveryId] ?? []), ...(byDocId.get(doc.id) ?? [])];
      });

      if (mounted) setExistingDeliveryDocs(byDeliveryId);
    }

    loadDeliveryDocs();
    return () => {
      mounted = false;
    };
  }, [deliveries, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.delivered_at) return;
    const createdDelivery = await createDelivery.mutateAsync({
      order_id: form.order_id || null,
      supplier_id: form.supplier_id || null,
      delivered_at: form.delivered_at,
      notes: form.notes.trim() || null,
    });

    if (attachments.length > 0) {
      for (const file of attachments) {
        const path = await uploadAttachmentToSupabase(file, projectId, 'delivery');
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            project_id: projectId,
            title: `DEL-${createdDelivery.id} :: ${file.name}`,
            category: 'delivery_attachment',
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

    setForm({ order_id: '', supplier_id: '', delivered_at: new Date().toISOString().slice(0, 10), notes: '' });
    setAttachments([]);
    setShowForm(false);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement livraisons...</div>;
  }

  const pendingRows = orders
    .filter((order) => order.status !== 'delivered')
    .map((order) => ({
      id: order.id,
      reference: order.reference,
      expected_delivery_at: order.expected_delivery_at,
      supplierName: suppliers.find((supplier) => supplier.id === order.supplier_id)?.name,
    }));

  const doneRows = deliveries;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">
          {view === 'pending' ? `Livraisons en attente (${pendingRows.length})` : `Livraisons effectuees (${doneRows.length})`}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Enregistrer livraison
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input
                type="date"
                value={form.delivered_at}
                onChange={(e) => setForm({ ...form, delivered_at: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fournisseur</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="">— Sélectionner —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Commande associée</label>
              <select
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="">— Aucune —</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.reference}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Documents livraison</label>
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files ?? []))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
            {attachments.length > 0 ? (
              <p className="text-xs text-gray-500 mt-1">{attachments.length} document(s) prêt(s) à l'envoi</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createDelivery.isPending}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createDelivery.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
        {view === 'pending' ? (
          pendingRows.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">Aucune livraison en attente.</p>
          ) : (
            pendingRows.map((pending) => (
              <div key={pending.id} className="py-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{pending.reference}</span>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-700">En attente</span>
                </div>
                {pending.supplierName ? <p className="text-xs text-gray-400">Fournisseur: {pending.supplierName}</p> : null}
                {pending.expected_delivery_at ? (
                  <p className="text-xs text-gray-400">Prevue le {new Date(pending.expected_delivery_at).toLocaleDateString('fr-FR')}</p>
                ) : (
                  <p className="text-xs text-gray-400">Date de livraison non renseignee</p>
                )}
              </div>
            ))
          )
        ) : doneRows.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune livraison enregistree.</p>
        ) : (
          doneRows.map((d: DeliveryRow) => {
            const supplierName = suppliers.find((s) => s.id === d.supplier_id)?.name;
            const orderRef = orders.find((o) => o.id === d.order_id)?.reference;
            const statusInfo = DELIVERY_STATUS[d.status ?? ''] ?? { label: d.status, className: 'bg-gray-100 text-gray-600' };
            const attachmentUrls = existingDeliveryDocs[d.id] ?? [];
            const linkedOrder = orders.find((o) => o.id === d.order_id);
            const isLate = Boolean(linkedOrder?.expected_delivery_at && new Date(d.delivered_at) > new Date(linkedOrder.expected_delivery_at));

            return (
              <div key={d.id} className="py-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(d.delivered_at).toLocaleDateString('fr-FR')}
                    {supplierName && <span className="font-normal text-gray-500 ml-2">— {supplierName}</span>}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {orderRef && <p className="text-xs text-gray-400">Commande : {orderRef}</p>}
                {isLate ? <p className="text-xs text-red-600">Livraison enregistrée en retard</p> : null}
                {d.notes && <p className="text-xs text-gray-400 italic">{d.notes}</p>}
                {attachmentUrls.length > 0 ? (
                  <div className="text-xs text-gray-500">
                    Documents ({attachmentUrls.length}) :
                    <div className="flex flex-wrap gap-2 mt-1">
                      {attachmentUrls.map((url, idx) => {
                        const publicUrl = supabase.storage.from('project-media').getPublicUrl(url).data.publicUrl;
                        return (
                          <a key={`${d.id}-${idx}`} href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            Fichier {idx + 1}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

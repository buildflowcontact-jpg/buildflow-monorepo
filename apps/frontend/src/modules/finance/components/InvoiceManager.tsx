import React, { useState } from 'react';
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus } from '../hooks/useFinance';
import type { InvoiceRow } from '../hooks/useFinance';
import { useSuppliers } from '@/modules/approvisionnement/hooks/useSuppliers';
import { useToast } from '@/ui/ToastProvider';
import { downloadExcel } from '@/lib/export';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Payée', className: 'bg-green-100 text-green-700' },
  partially_paid: { label: 'Partiellement payée', className: 'bg-blue-100 text-blue-700' },
  overdue: { label: 'Échue', className: 'bg-red-100 text-red-600' },
  cancelled: { label: 'Annulée', className: 'bg-gray-100 text-gray-600' },
};

interface Props {
  projectId: string;
}

export function InvoiceManager({ projectId }: Props) {
  const { data: invoices = [], isLoading } = useInvoices(projectId);
  const { data: suppliers = [] } = useSuppliers(projectId);
  const createInvoice = useCreateInvoice(projectId);
  const updateStatus = useUpdateInvoiceStatus(projectId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    reference: '',
    supplier_id: '',
    amount_ht: '',
    amount_ttc: '',
    invoice_date: '',
    due_date: '',
    notes: '',
  });
  const { showToast } = useToast() || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reference) return;
    try {
      await createInvoice.mutateAsync({
        reference: form.reference.trim(),
        supplier_id: form.supplier_id || null,
        amount_ht: form.amount_ht ? parseFloat(form.amount_ht) : null,
        amount_ttc: form.amount_ttc ? parseFloat(form.amount_ttc) : null,
        invoice_date: form.invoice_date || null,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
      });
      setForm({ reference: '', supplier_id: '', amount_ht: '', amount_ttc: '', invoice_date: '', due_date: '', notes: '' });
      setShowForm(false);
      showToast?.('Facture créée', 'success');
    } catch {
      showToast?.('Impossible de créer la facture', 'error');
    }
  };

  const totalAmount = invoices.reduce((sum: number, inv: InvoiceRow) => sum + (inv.amount_ht ?? 0), 0);
  const paidAmount = invoices
    .filter((inv: InvoiceRow) => inv.status === 'paid')
    .reduce((sum: number, inv: InvoiceRow) => sum + (inv.amount_ht ?? 0), 0);

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement factures...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Factures fournisseurs</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const rows: Array<Array<string | number>> = [
                ['Référence', 'Fournisseur', 'Montant HT (€)', 'Montant TTC (€)', 'Date facture', 'Statut'],
                ...invoices.map((inv: InvoiceRow) => [
                  inv.reference ?? '',
                  inv.supplier_id ?? '',
                  inv.amount_ht ?? 0,
                  inv.amount_ttc ?? 0,
                  inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('fr-FR') : '',
                  STATUS_LABELS[inv.status ?? '']?.label ?? inv.status ?? '',
                ]),
              ];
              downloadExcel(`factures-${projectId}.xls`, 'Factures', rows);
            }}
            className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition-colors"
          >
            ↓ Excel
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            + Nouvelle facture
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Total factures</span>
          <span className="font-medium">{totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payé</span>
          <span className="font-medium text-green-600">{paidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">À payer</span>
          <span className="font-medium text-red-600">{(totalAmount - paidAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Référence *</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="FAC-2026-001"
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
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant HT (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount_ht}
                onChange={(e) => setForm({ ...form, amount_ht: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant TTC (€)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount_ttc}
                onChange={(e) => setForm({ ...form, amount_ttc: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date facture</label>
              <input
                type="date"
                value={form.invoice_date}
                onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date d'échéance</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
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
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createInvoice.isPending}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createInvoice.isPending ? 'Création...' : 'Créer'}
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
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune facture enregistrée.</p>
        ) : (
          invoices.map((inv: InvoiceRow) => {
            const supplierName = suppliers.find((s) => s.id === inv.supplier_id)?.name;
            const computedStatus = inv.status === 'pending' && inv.due_date && new Date(inv.due_date) < new Date()
              ? 'overdue'
              : (inv.status ?? 'unknown');
            const statusInfo = STATUS_LABELS[computedStatus] ?? { label: computedStatus, className: 'bg-gray-100 text-gray-600' };

            return (
              <div key={inv.id} className="py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{inv.reference}</span>
                    {supplierName && <span className="text-xs text-gray-500 ml-2">{supplierName}</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {inv.amount_ht != null && (
                    <span>{inv.amount_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT</span>
                  )}
                  {inv.invoice_date && (
                    <span>Facture : {new Date(inv.invoice_date).toLocaleDateString('fr-FR')}</span>
                  )}
                  {inv.due_date && (
                    <span>Échéance : {new Date(inv.due_date).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                {inv.notes && <p className="text-xs text-gray-400 italic">{inv.notes}</p>}
                {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                  <div className="flex gap-1 pt-1">
                    {inv.status !== 'paid' && (
                      <button
                        onClick={async () => {
                          try {
                            await updateStatus.mutateAsync({ id: inv.id, status: 'paid' });
                            showToast?.('Facture marquée payée', 'success');
                          } catch {
                            showToast?.('Impossible de mettre à jour la facture', 'error');
                          }
                        }}
                        className="text-xs border border-green-300 text-green-600 px-2 py-0.5 rounded hover:bg-green-50 transition-colors"
                      >
                        Marquer payée
                      </button>
                    )}
                    {inv.status === 'pending' && (
                      <button
                        onClick={async () => {
                          try {
                            await updateStatus.mutateAsync({ id: inv.id, status: 'cancelled' });
                            showToast?.('Facture annulée', 'success');
                          } catch {
                            showToast?.('Impossible d’annuler la facture', 'error');
                          }
                        }}
                        className="text-xs border border-red-300 text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
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

import React, { useState } from 'react';
import { useExpenses, useCreateExpense } from '../hooks/useFinance';
import type { ExpenseRow } from '../hooks/useFinance';
import { useToast } from '@/ui/ToastProvider';

const CATEGORIES = [
  'Matériaux',
  'Main d\'œuvre',
  'Équipement',
  'Sous-traitance',
  'Transport',
  'Divers',
];

interface Props {
  projectId: string;
}

export function ExpenseTracker({ projectId }: Props) {
  const { data: expenses = [], isLoading } = useExpenses(projectId);
  const createExpense = useCreateExpense(projectId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount_ht: '',
    amount_ttc: '',
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const { showToast } = useToast() || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.amount_ht) return;
    try {
      await createExpense.mutateAsync({
        category: form.category,
        description: form.description.trim(),
        amount_ht: parseFloat(form.amount_ht),
        amount_ttc: form.amount_ttc ? parseFloat(form.amount_ttc) : null,
        expense_date: form.expense_date,
      });
      setForm({ category: '', description: '', amount_ht: '', amount_ttc: '', expense_date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      showToast?.('Dépense enregistrée', 'success');
    } catch {
      showToast?.('Impossible d’enregistrer la dépense', 'error');
    }
  };

  const totalExpenses = expenses.reduce((sum: number, e: ExpenseRow) => sum + (e.amount_ht ?? 0), 0);
  const byCategory = CATEGORIES.reduce((acc: Record<string, number>, cat) => {
    acc[cat] = expenses
      .filter((e: ExpenseRow) => e.category === cat)
      .reduce((sum: number, e: ExpenseRow) => sum + (e.amount_ht ?? 0), 0);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement dépenses...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Suivi des dépenses</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Enregistrer dépense
        </button>
      </div>

      {/* Summary by category */}
      <div className="bg-gray-50 rounded p-3 space-y-1 text-xs">
        <div className="font-medium text-gray-700 mb-2">Total : {totalExpenses.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            byCategory[cat] > 0 && (
              <div key={cat} className="flex justify-between text-gray-600">
                <span>{cat}</span>
                <span className="font-medium">{byCategory[cat].toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                required
              >
                <option value="">— Sélectionner —</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Détail de la dépense"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant HT (€) *</label>
              <input
                type="number"
                step="0.01"
                value={form.amount_ht}
                onChange={(e) => setForm({ ...form, amount_ht: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
                required
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
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createExpense.isPending}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createExpense.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucune dépense enregistrée.</p>
        ) : (
          expenses.map((exp: ExpenseRow) => (
            <div key={exp.id} className="py-2 space-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{exp.description}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-2">
                    {exp.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {(exp.amount_ht ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{new Date(exp.expense_date).toLocaleDateString('fr-FR')}</span>
                {exp.amount_ttc && (
                  <span>{(exp.amount_ttc).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} TTC</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

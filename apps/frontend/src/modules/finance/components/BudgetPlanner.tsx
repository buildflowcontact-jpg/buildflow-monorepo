import React, { useState } from 'react';
import { useBudgets, useCreateBudget, useUpdateBudget } from '../hooks/useFinance';
import type { BudgetRow } from '../hooks/useFinance';
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

export function BudgetPlanner({ projectId }: Props) {
  const { data: budgets = [], isLoading } = useBudgets(projectId);
  const createBudget = useCreateBudget(projectId);
  const updateBudget = useUpdateBudget(projectId);
  const [showForm, setShowForm] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [form, setForm] = useState({ category: '', amount_ht: '' });
  const { showToast } = useToast() || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount_ht) return;
    try {
      await createBudget.mutateAsync({ category: form.category, amount_ht: parseFloat(form.amount_ht) });
      setForm({ category: '', amount_ht: '' });
      setShowForm(false);
      showToast?.('Ligne budget ajoutée', 'success');
    } catch {
      showToast?.('Impossible d’ajouter la ligne budget', 'error');
    }
  };

  const handleUpdateBudget = async (budgetId: string) => {
    if (!editingAmount) return;
    try {
      await updateBudget.mutateAsync({ id: budgetId, amount_ht: parseFloat(editingAmount) });
      setEditingBudgetId(null);
      setEditingAmount('');
      showToast?.('Budget mis à jour', 'success');
    } catch {
      showToast?.('Impossible de mettre à jour le budget', 'error');
    }
  };

  const totalBudget = budgets.reduce((sum: number, b: BudgetRow) => sum + (b.amount_ht || 0), 0);
  const totalSpent = budgets.reduce((sum: number, b: BudgetRow) => sum + (b.spent_amount || 0), 0);
  const remaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Chargement budgets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">Budget prévisionnel</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          + Ajouter ligne
        </button>
      </div>

      {/* Progress summary */}
      <div className="bg-gray-50 rounded p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dépensé</span>
          <span className="font-medium">{totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Budget total</span>
          <span className="font-medium">{totalBudget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Restant</span>
          <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Utilisation</span>
            <span>{percentUsed}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>
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
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createBudget.isPending}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {createBudget.isPending ? 'Ajout...' : 'Ajouter'}
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
        {budgets.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Aucun budget défini.</p>
        ) : (
          budgets.map((budget: BudgetRow) => {
            const spent = budget.spent_amount ?? 0;
            const remaining = (budget.amount_ht ?? 0) - spent;
            const percentUsed = (budget.amount_ht ?? 1) > 0 ? Math.round((spent / (budget.amount_ht ?? 1)) * 100) : 0;

            return (
              <div key={budget.id} className="py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{budget.category}</span>
                  <div className="flex items-center gap-2">
                    {editingBudgetId === budget.id ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          value={editingAmount}
                          onChange={(e) => setEditingAmount(e.target.value)}
                          className="w-28 border rounded px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => void handleUpdateBudget(budget.id)}
                          disabled={updateBudget.isPending}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBudgetId(null);
                            setEditingAmount('');
                          }}
                          className="text-xs text-gray-600 px-2 py-1 rounded border hover:bg-gray-100 transition-colors"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold text-gray-700">
                          {spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / {(budget.amount_ht ?? 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBudgetId(budget.id);
                            setEditingAmount(String(budget.amount_ht ?? 0));
                          }}
                          className="text-xs border px-2 py-0.5 rounded hover:bg-gray-50 transition-colors"
                        >
                          Éditer
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${percentUsed > 100 ? 'bg-red-500' : percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentUsed}% utilisé</span>
                  <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {remaining >= 0 ? '+' : ''}{remaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

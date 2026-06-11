import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BudgetPlanner } from './BudgetPlanner';
import { InvoiceManager } from './InvoiceManager';
import { ExpenseTracker } from './ExpenseTracker';
import { useBudgets, useExpenses, useInvoices } from '../hooks/useFinance';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { SkeletonKpiGrid } from '@/components/ui/Skeleton';
import { usePermission } from '@/app/providers/PermissionProvider';

type Tab = 'budget' | 'invoices' | 'expenses';

const ALL_TABS: { key: Tab; label: string }[] = [
  { key: 'budget', label: 'Budget prévisionnel' },
  { key: 'invoices', label: 'Factures' },
  { key: 'expenses', label: 'Dépenses' },
];

interface Props {
  projectId: string;
}

export function FinanceDashboard({ projectId }: Props) {
  const { can } = usePermission();
  const fullAccess = can('finance:full');
  // Les rôles sans finance:full (ex. commercial) voient seulement le budget global
  const TABS = fullAccess ? ALL_TABS : ALL_TABS.filter((t) => t.key === 'budget');
  const [tab, setTab] = useState<Tab>('budget');
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(projectId);
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(projectId);
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses(projectId);

  const dashboard = useMemo(() => {
    const totalBudget = budgets.reduce((sum, row) => sum + (row.amount_ht ?? 0), 0);
    const totalSpentBudget = budgets.reduce((sum, row) => sum + (row.spent_amount ?? 0), 0);
    const budgetRemaining = totalBudget - totalSpentBudget;
    const budgetUsagePercent = totalBudget > 0 ? Math.round((totalSpentBudget / totalBudget) * 100) : 0;

    const totalInvoiced = invoices.reduce((sum, row) => sum + (row.amount_ht ?? 0), 0);
    const totalPaid = invoices.filter((row) => row.status === 'paid').reduce((sum, row) => sum + (row.amount_ht ?? 0), 0);
    const toPay = totalInvoiced - totalPaid;
    const overdueCount = invoices.filter((row) => row.status === 'pending' && !!row.due_date && new Date(row.due_date) < new Date()).length;

    const totalExpenses = expenses.reduce((sum, row) => sum + (row.amount_ht ?? 0), 0);
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const expensesCurrentMonth = expenses
      .filter((row) => typeof row.expense_date === 'string' && row.expense_date.slice(0, 7) === currentMonthKey)
      .reduce((sum, row) => sum + (row.amount_ht ?? 0), 0);

    const monthlyExpenseMap: Record<string, number> = {};
    expenses.forEach((row) => {
      if (!row.expense_date) return;
      const monthKey = row.expense_date.slice(0, 7);
      monthlyExpenseMap[monthKey] = (monthlyExpenseMap[monthKey] ?? 0) + (row.amount_ht ?? 0);
    });

    const monthlyExpenseTrend = Object.entries(monthlyExpenseMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));

    const expenseByCategoryMap: Record<string, number> = {};
    expenses.forEach((row) => {
      const key = row.category || 'Non classé';
      expenseByCategoryMap[key] = (expenseByCategoryMap[key] ?? 0) + (row.amount_ht ?? 0);
    });

    const budgetByCategoryMap: Record<string, number> = {};
    budgets.forEach((row) => {
      const key = row.category || 'Non classé';
      budgetByCategoryMap[key] = (budgetByCategoryMap[key] ?? 0) + (row.amount_ht ?? 0);
    });

    const expenseByCategory = Object.entries(expenseByCategoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const budgetByCategory = Object.entries(budgetByCategoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const tensionLevel = totalBudget > 0 ? Math.round(((totalExpenses + toPay) / totalBudget) * 100) : 0;

    return {
      totalBudget,
      budgetRemaining,
      budgetUsagePercent,
      toPay,
      overdueCount,
      totalExpenses,
      expensesCurrentMonth,
      monthlyExpenseTrend,
      expenseByCategory,
      budgetByCategory,
      tensionLevel,
    };
  }, [budgets, expenses, invoices]);

  const maxMonthlyExpense = Math.max(...dashboard.monthlyExpenseTrend.map((row) => row.amount), 1);
  const isLoading = budgetsLoading || invoicesLoading || expensesLoading;
  const hasAnyData = budgets.length > 0 || invoices.length > 0 || expenses.length > 0;

  const alerts = [
    dashboard.budgetUsagePercent >= 90 ? `Alerte budget: ${dashboard.budgetUsagePercent}% du budget consommé.` : null,
    dashboard.overdueCount > 0 ? `Alerte factures: ${dashboard.overdueCount} facture(s) en retard.` : null,
    dashboard.tensionLevel > 100 ? `Alerte trésorerie: tension à ${dashboard.tensionLevel}%.` : null,
  ].filter(Boolean) as string[];

  return (
    <ModuleLayout
      title="Finance"
      description="Budget, dépenses et factures dans une vue opérationnelle unifiée."
      leftClassName="bf-card-soft p-4 space-y-2"
      left={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Navigation donnees</h3>
          {TABS.map((t) => (
            <Button
              key={t.key}
              type="button"
              variant={tab === t.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTab(t.key)}
              className="w-full justify-start"
            >
              {t.label}
            </Button>
          ))}
          <div className="rounded-xl border border-slate-200 p-3 text-xs bf-text-muted">
            Tension financiere: {dashboard.tensionLevel}%
          </div>
        </>
      }
      right={
        <>
          <h3 className="bf-text-primary font-black tracking-tight">Actions rapides</h3>
          {fullAccess && <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setTab('invoices')}>Creer facture</Button>}
          {fullAccess && <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => setTab('expenses')}>Saisir depense</Button>}
          <Button type="button" size="sm" className="w-full justify-start" onClick={() => setTab('budget')}>Revue budget</Button>
          {alerts.length ? (
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
              <p className="text-xs font-semibold text-red-700">Alertes</p>
              <ul className="mt-1 space-y-1 text-xs text-red-700">
                {alerts.map((alert) => <li key={alert}>• {alert}</li>)}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-emerald-700">Aucune alerte critique.</p>
          )}
        </>
      }
    >
      <div className="space-y-3">
        {!isLoading && !hasAnyData ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm bf-text-muted">
            Aucune donnee financiere disponible pour ce projet. Commencez par ajouter un budget, une facture ou une depense.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bf-card-soft p-3">
            <p className="text-xs uppercase bf-text-muted">Budget total</p>
            <p className="text-2xl font-black bf-text-primary">{dashboard.totalBudget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            <p className="text-xs bf-text-muted">Restant: {dashboard.budgetRemaining.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
          </div>
          {fullAccess && (
            <div className="bf-card-soft p-3">
              <p className="text-xs uppercase bf-text-muted">A payer</p>
              <p className="text-2xl font-black bf-text-primary">{dashboard.toPay.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              <p className="text-xs bf-text-muted">Retards: {dashboard.overdueCount}</p>
            </div>
          )}
        </div>

        <div className="bf-card-soft p-4">
          <p className="text-sm font-semibold bf-text-primary">Tendance dépenses (6 derniers mois)</p>
          <div className="mt-3 grid grid-cols-6 gap-2 items-end min-h-[120px]">
            {dashboard.monthlyExpenseTrend.length ? dashboard.monthlyExpenseTrend.map((point) => {
              const height = Math.max(8, Math.round((point.amount / maxMonthlyExpense) * 110));
              return (
                <div key={point.month} className="flex flex-col items-center gap-1">
                  <div className="w-full max-w-[36px] rounded-t bg-cyan-500/80" style={{ height: `${height}px` }} />
                  <span className="text-[10px] bf-text-muted">{point.month.slice(5)}</span>
                </div>
              );
            }) : <p className="text-xs bf-text-muted col-span-6">Pas assez de données pour la tendance.</p>}
          </div>
        </div>

        <div className="bf-card-soft p-4">
          {tab === 'budget' && <BudgetPlanner projectId={projectId} />}
          {tab === 'invoices' && <InvoiceManager projectId={projectId} />}
          {tab === 'expenses' && <ExpenseTracker projectId={projectId} />}
        </div>
      </div>

      {isLoading ? <SkeletonKpiGrid count={4} /> : null}
    </ModuleLayout>
  );
}

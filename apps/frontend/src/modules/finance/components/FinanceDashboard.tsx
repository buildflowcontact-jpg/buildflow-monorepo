import React, { useState } from 'react';
import { BudgetPlanner } from './BudgetPlanner';
import { InvoiceManager } from './InvoiceManager';
import { ExpenseTracker } from './ExpenseTracker';

type Tab = 'budget' | 'invoices' | 'expenses';

const TABS: { key: Tab; label: string }[] = [
  { key: 'budget', label: 'Budget prévisionnel' },
  { key: 'invoices', label: 'Factures' },
  { key: 'expenses', label: 'Dépenses' },
];

interface Props {
  projectId: string;
}

export function FinanceDashboard({ projectId }: Props) {
  const [tab, setTab] = useState<Tab>('budget');

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="bf-module-header p-5">
        <h2 className="bf-text-primary text-lg font-bold">Finance & Budgétisation</h2>
        <p className="bf-text-muted mt-1 text-sm">Pilotez budget prévisionnel, factures et dépenses avec une lecture claire par module.</p>
      </div>

      <div className="bf-tabs-shell overflow-hidden">
      <div className="bf-tabs-bar flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`bf-tab px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'bf-tab-active'
                : 'bf-tab-inactive'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'budget' && <BudgetPlanner projectId={projectId} />}
        {tab === 'invoices' && <InvoiceManager projectId={projectId} />}
        {tab === 'expenses' && <ExpenseTracker projectId={projectId} />}
      </div>
      </div>
    </div>
  );
}

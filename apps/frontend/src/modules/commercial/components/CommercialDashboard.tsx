import React, { useState } from 'react';
import { ClientList } from './ClientList';
import { SalesLeadPipeline } from './SalesLeadPipeline';
import { usePortfolioDashboard } from '@/modules/kpi/hooks/usePortfolioDashboard';

interface CommercialDashboardProps {
  projectId: string;
}

type Tab = 'clients' | 'pipeline';

export const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('clients');
  const { data: portfolio } = usePortfolioDashboard();

  const soldAmount = portfolio?.revenueInFlight ?? 0;
  const estimatedMargin = portfolio?.estimatedMargin ?? 0;
  const delayedProjects = portfolio?.delayedProjects ?? 0;
  const criticalIncidents = portfolio?.criticalIncidents ?? 0;
  const gapBudget = soldAmount - estimatedMargin;

  const tabs = [
    { id: 'clients' as Tab, label: 'Clients', icon: '👥' },
    { id: 'pipeline' as Tab, label: 'Pipeline commercial', icon: '📈' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bf-module-header p-6">
        <h1 className="bf-text-primary text-3xl font-bold">Gestion Commercial CRM</h1>
        <p className="bf-text-muted mt-1">
          Gérez vos clients et suivez votre pipeline de ventes
        </p>
      </div>

      {/* Tabs */}
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4 bf-card-soft p-5">
          <h2 className="bf-text-primary text-lg font-black tracking-tight">Portefeuille projets</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="bf-text-muted">Vendu (encours)</span>
              <span className="font-semibold bf-text-primary">{soldAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="bf-text-muted">Marge estimée</span>
              <span className={`font-semibold ${estimatedMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {estimatedMargin.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="bf-text-muted">Projets en dérive</span>
              <span className="font-semibold text-amber-600">{delayedProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="bf-text-muted">Incidents critiques</span>
              <span className="font-semibold text-red-600">{criticalIncidents}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 bf-card-soft p-5">
          <h2 className="bf-text-primary text-lg font-black tracking-tight">Vendu vs Réalisé</h2>
          <p className="bf-text-muted mt-1 text-sm">Lecture directe des dérives scope / budget / délai.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase bf-text-muted">Dérive budget</p>
              <p className={`mt-2 text-xl font-black ${gapBudget >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {gapBudget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase bf-text-muted">Dérive délai</p>
              <p className={`mt-2 text-xl font-black ${delayedProjects > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {delayedProjects > 0 ? `${delayedProjects} projet(s)` : 'Aucune'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs uppercase bf-text-muted">Risque scope</p>
              <p className={`mt-2 text-xl font-black ${criticalIncidents > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {criticalIncidents > 0 ? 'Elevé' : 'Maîtrisé'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bf-tabs-shell">
        <div className="bf-tabs-bar flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`bf-tab flex-1 px-4 py-3 font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'bf-tab-active'
                  : 'bf-tab-inactive'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'clients' && <ClientList projectId={projectId} />}
          {activeTab === 'pipeline' && <SalesLeadPipeline projectId={projectId} />}
        </div>
      </div>
    </div>
  );
};

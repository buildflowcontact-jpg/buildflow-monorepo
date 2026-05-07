import React, { useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { usePortfolioDashboard } from '../hooks/usePortfolioDashboard';
import { useActivityTimeline } from '@/modules/audit/hooks/useActivityTimeline';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { usePermission } from '@/app/providers/PermissionProvider';

interface KPIDashboardProps {
  projectId: string;
}

export const KPIDashboard: React.FC<KPIDashboardProps> = ({ projectId }) => {
  const { can } = usePermission();
  const showFull = can('dashboard:full');          // admin, chef_projet, bureau_etudes, commercial
  const showFinance = can('finance:read');          // tous sauf technicien, sous_traitant, viewer
  const { data: portfolio } = usePortfolioDashboard();
  const { data: portfolioActivity = [] } = useActivityTimeline(undefined, 12);
  const { data: project } = useQuery({
    queryKey: ['project-full', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, code, status, completion_pct')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-kpi', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, status, created_at')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['incidents-kpi', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select('id, title')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets-kpi', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, amount_ht, spent_amount')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-kpi', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, amount_ht, status')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['purchase-orders-kpi', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, status, total_ht')
        .eq('project_id', projectId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const kpis = useMemo(() => {
    return {
      // Progression
      projectCompletion: project?.completion_pct ?? 0,
      
      // Tasks KPI
      tasksCompleted: tasks.filter((t) => t.status === 'completed').length,
      tasksTotal: tasks.length,
      tasksCompletionRate: tasks.length > 0 
        ? Math.round(((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)) 
        : 0,

      // Quality KPI (based on incidents)
      incidentsTotal: incidents.length,
      qualityScore: Math.max(100 - (incidents.length * 5), 0),

      // Budget KPI
      budgetTotal: budgets.reduce((sum, b) => sum + (b.amount_ht || 0), 0),
      budgetSpent: budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0),
      budgetRate: budgets.length > 0
        ? Math.min(Math.round((budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0) / 
                      budgets.reduce((sum, b) => sum + (b.amount_ht || 0), 0)) * 100), 100) || 0
        : 0,

      // Invoice KPI
      invoicesTotal: invoices.length,
      invoicesPaid: invoices.filter((i) => i.status === 'paid').length,
      invoicesAmount: invoices.reduce((sum, i) => sum + (i.amount_ht || 0), 0),

      // Supply Chain KPI
      purchaseOrdersTotal: purchaseOrders.length,
      purchaseOrdersDelivered: purchaseOrders.filter((po) => po.status === 'delivered').length,
      purchaseOrdersRate: purchaseOrders.length > 0
        ? Math.round((purchaseOrders.filter((po) => po.status === 'delivered').length / purchaseOrders.length) * 100)
        : 0,
    };
  }, [project, tasks, incidents, budgets, invoices, purchaseOrders]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {showFull && portfolio ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="bg-slate-900 text-white rounded-lg shadow p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">CA en cours</p>
            <p className="mt-3 text-3xl font-black">€{(portfolio.revenueInFlight / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Marge estimée</p>
            <p className="mt-3 text-3xl font-black text-emerald-600">€{(portfolio.estimatedMargin / 1000).toFixed(1)}k</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Projets en dérive</p>
            <p className="mt-3 text-3xl font-black text-amber-600">{portfolio.delayedProjects}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Incidents critiques</p>
            <p className="mt-3 text-3xl font-black text-red-600">{portfolio.criticalIncidents}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Charge équipes</p>
            <p className="mt-3 text-3xl font-black text-blue-600">{portfolio.teamWorkload}h</p>
          </div>
        </div>
      ) : null}

      {showFull && portfolio?.projects?.length ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Portefeuille multi-projets</h2>
              <p className="text-sm text-gray-600 mt-1">Vue direction consolidée des risques, budgets et incidents</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {portfolio.projects.map((portfolioProject) => (
              <div key={portfolioProject.id} className="rounded-2xl border border-slate-200 p-4 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{portfolioProject.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{portfolioProject.code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${portfolioProject.delayedLabel === 'critique' ? 'bg-red-100 text-red-700' : portfolioProject.delayedLabel === 'derive' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {portfolioProject.delayedLabel}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Avancement</p>
                    <p className="font-semibold text-slate-900">{portfolioProject.completionPct}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Budget</p>
                    <p className="font-semibold text-slate-900">{portfolioProject.budgetRate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Incidents</p>
                    <p className="font-semibold text-slate-900">{portfolioProject.incidentCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Critiques ouverts</p>
                    <p className="font-semibold text-red-600">{portfolioProject.openCriticalIncidents}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showFull && (
        <ActivityTimeline
          items={portfolioActivity}
          title="Timeline portefeuille"
          emptyLabel="Aucune activité consolidée pour le moment."
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord KPI</h1>
        <p className="text-gray-600 mt-1">
          Suivi des indicateurs clés de performance du projet
        </p>
      </div>

      {/* Main KPIs Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Project Completion */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Avancement projet</p>
          <div className="mt-4 relative">
            <div className="text-3xl font-bold text-gray-900">{kpis.projectCompletion}%</div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(kpis.projectCompletion)}`}
                style={{ width: `${kpis.projectCompletion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Score qualité</p>
          <div className="mt-4">
            <div className={`text-3xl font-bold ${getScoreColor(kpis.qualityScore)}`}>
              {kpis.qualityScore}%
            </div>
            <p className="text-xs text-gray-500 mt-2">{kpis.incidentsTotal} incidents</p>
          </div>
        </div>

        {/* Budget Consumption — visible seulement si lecture finance autorisée */}
        {showFinance && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Budget consommé</p>
            <div className="mt-4">
              <div className={`text-3xl font-bold ${getProgressColor(kpis.budgetRate)}`}>
                {kpis.budgetRate}%
              </div>
              <p className="text-xs text-gray-500 mt-2">
                €{(kpis.budgetSpent / 1000).toFixed(1)}k / €{(kpis.budgetTotal / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        )}

        {/* Supply Chain */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Approvisionnement</p>
          <div className="mt-4">
            <div className="text-3xl font-bold text-blue-600">{kpis.purchaseOrdersRate}%</div>
            <p className="text-xs text-gray-500 mt-2">
              {kpis.purchaseOrdersDelivered}/{kpis.purchaseOrdersTotal} commandes
            </p>
          </div>
        </div>
      </div>

      {/* Detailed KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâches</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taux complétude</span>
              <span className="font-semibold text-gray-900">{kpis.tasksCompletionRate}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${kpis.tasksCompletionRate}%` }}
              />
            </div>
            <div className="pt-2 text-xs text-gray-500">
              {kpis.tasksCompleted} / {kpis.tasksTotal} tâches complétées
            </div>
          </div>
        </div>

        {/* Finance — masqué pour technicien / sous_traitant / viewer */}
        {showFinance && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Finance</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Factures payées</span>
                <span className="font-semibold text-gray-900">{kpis.invoicesPaid}/{kpis.invoicesTotal}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${kpis.invoicesTotal > 0 ? (kpis.invoicesPaid / kpis.invoicesTotal) * 100 : 0}%` }}
                />
              </div>
              <div className="pt-2 text-xs text-gray-500">
                Total: €{(kpis.invoicesAmount / 1000).toFixed(1)}k
              </div>
            </div>
          </div>
        )}

        {/* Quality Issues */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Problèmes qualité</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-600">Incidents</p>
                <p className={`text-2xl font-bold ${kpis.incidentsTotal > 3 ? 'text-red-600' : 'text-green-600'}`}>
                  {kpis.incidentsTotal}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">État</p>
                <p className={`text-sm font-bold ${getScoreColor(kpis.qualityScore)}`}>
                  {kpis.qualityScore >= 80 ? 'Bon' : kpis.qualityScore >= 60 ? 'Correct' : 'Préoccupant'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des domaines</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className={`p-3 rounded-lg border-2 ${kpis.qualityScore >= 80 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
            <p className={`text-sm font-medium ${kpis.qualityScore >= 80 ? 'text-green-900' : 'text-yellow-900'}`}>Qualité</p>
            <p className={`text-xs ${kpis.qualityScore >= 80 ? 'text-green-700' : 'text-yellow-700'} mt-1`}>
              {kpis.qualityScore >= 80 ? '✓ Bon' : '⚠ À surveiller'}
            </p>
          </div>
          {showFinance && (
            <div className={`p-3 rounded-lg border-2 ${kpis.budgetRate <= 100 ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <p className={`text-sm font-medium ${kpis.budgetRate <= 100 ? 'text-green-900' : 'text-red-900'}`}>
                Budget
              </p>
              <p className={`text-xs ${kpis.budgetRate <= 100 ? 'text-green-700' : 'text-red-700'} mt-1`}>
                {kpis.budgetRate <= 100 ? '✓ Maîtrisé' : '⚠ Dépassement'}
              </p>
            </div>
          )}
          <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
            <p className="text-sm font-medium text-blue-900">Tâches</p>
            <p className="text-xs text-blue-700 mt-1">{kpis.tasksCompletionRate}% complétées</p>
          </div>
          <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
            <p className="text-sm font-medium text-blue-900">Appro</p>
            <p className="text-xs text-blue-700 mt-1">{kpis.purchaseOrdersRate}% livrées</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { usePortfolioDashboard } from '@/modules/kpi/hooks/usePortfolioDashboard';
import { useProjectStore } from '@/store/projectStore';
import { SkeletonKpiGrid, SkeletonCard } from '@/components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  on_hold: 'En pause',
  completed: 'Terminé',
  draft: 'Brouillon',
};

function KpiCard({
  label,
  children,
  accent = 'default',
}: {
  label: string;
  children: React.ReactNode;
  accent?: 'default' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const border = {
    default: 'border-slate-200',
    green: 'border-emerald-200',
    red: 'border-red-200',
    amber: 'border-amber-200',
    blue: 'border-cyan-200',
  }[accent];
  return (
    <div className={`bf-card-soft p-5 rounded-xl border ${border} space-y-3`}>
      <p className="text-xs bf-text-muted uppercase tracking-wide font-semibold">{label}</p>
      {children}
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function GlobalDashboard() {
  const { data, isLoading } = usePortfolioDashboard();
  const { setCurrentProjectId } = useProjectStore();
  const navigate = useNavigate();

  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    navigate('/executer');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonKpiGrid count={6} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <div className="bf-card-soft p-12 text-center rounded-xl">
        <p className="text-3xl mb-3">🏗️</p>
        <p className="bf-text-primary font-semibold">Aucun projet disponible</p>
        <p className="bf-text-muted text-sm mt-1">Créez votre premier projet pour commencer.</p>
      </div>
    );
  }

  const budgetPct = data.totalBudgetSold > 0
    ? Math.round((data.totalBudgetSpent / data.totalBudgetSold) * 100)
    : 0;
  const budgetAccent = budgetPct >= 100 ? 'red' : budgetPct >= 80 ? 'amber' : 'green';

  const totalEstimatedHours = data.workloadByMember.reduce((s, m) => s + m.estimatedHours, 0);
  const totalActualHours = data.workloadByMember.reduce((s, m) => s + m.actualHours, 0);
  const workloadPct = totalEstimatedHours > 0
    ? Math.round((totalActualHours / totalEstimatedHours) * 100)
    : null;

  return (
    <div className="space-y-6">

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* 1. Budget vendu vs budget réel */}
        <KpiCard label="Budget vendu vs budget réel" accent={budgetAccent}>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs bf-text-muted">Vendu</p>
              <p className="text-xl font-black bf-text-primary">{(data.totalBudgetSold / 1000).toFixed(0)} k€</p>
            </div>
            <div className="text-right">
              <p className="text-xs bf-text-muted">Consommé</p>
              <p className={`text-xl font-black ${budgetPct >= 100 ? 'text-red-600' : budgetPct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {(data.totalBudgetSpent / 1000).toFixed(0)} k€
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs bf-text-muted">Taux</p>
              <p className={`text-xl font-black ${budgetPct >= 100 ? 'text-red-600' : budgetPct >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{budgetPct}%</p>
            </div>
          </div>
          <Bar value={data.totalBudgetSpent} max={data.totalBudgetSold} color={budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500'} />
        </KpiCard>

        {/* 2. Deadlines projets */}
        <KpiCard label="Deadlines projets" accent={data.delayedProjects > 0 ? 'amber' : 'green'}>
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <span className="bf-text-primary font-medium truncate max-w-[120px]">{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.plannedEndDate ? (
                    <span className="bf-text-muted">{new Date(p.plannedEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                  ) : (
                    <span className="text-slate-400 italic">Non définie</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${
                    p.delayedLabel === 'critique' ? 'bg-red-100 text-red-700' :
                    p.delayedLabel === 'derive' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.completionPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </KpiCard>

        {/* 3. Charge par membre */}
        <KpiCard label="Charge équipe — estimée vs réalisée" accent={workloadPct !== null && workloadPct > 90 ? 'amber' : 'blue'}>
          {data.workloadByMember.length === 0 ? (
            <p className="text-sm bf-text-muted italic">Aucune saisie de temps</p>
          ) : (
            <div className="space-y-2">
              {data.workloadByMember.slice(0, 4).map((m) => {
                const pct = m.estimatedHours > 0 ? Math.min(Math.round((m.actualHours / m.estimatedHours) * 100), 100) : 0;
                const shortId = m.workerId.slice(0, 8);
                return (
                  <div key={m.workerId} className="text-xs space-y-0.5">
                    <div className="flex justify-between bf-text-muted">
                      <span className="font-mono">{shortId}…</span>
                      <span>{m.actualHours}h / {m.estimatedHours > 0 ? `${m.estimatedHours}h est.` : 'non estimé'}</span>
                    </div>
                    <Bar value={m.actualHours} max={m.estimatedHours || m.actualHours} color={pct > 90 ? 'bg-amber-400' : 'bg-cyan-500'} />
                  </div>
                );
              })}
              {data.workloadByMember.length > 4 && (
                <p className="text-xs bf-text-muted">+{data.workloadByMember.length - 4} autres membres</p>
              )}
            </div>
          )}
          <p className="text-xs bf-text-muted pt-1 border-t">
            Total : <span className="font-semibold">{totalActualHours}h</span> réalisées
            {totalEstimatedHours > 0 && <> / <span className="font-semibold">{totalEstimatedHours}h</span> estimées</>}
          </p>
        </KpiCard>

        {/* 4. Incidents à traiter */}
        <KpiCard label="Incidents de chantier à traiter" accent={data.openIncidents > 0 ? (data.criticalIncidents > 0 ? 'red' : 'amber') : 'green'}>
          <div className="flex items-end gap-4">
            <div>
              <p className={`text-3xl font-black ${data.openIncidents > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{data.openIncidents}</p>
              <p className="text-xs bf-text-muted">ouverts</p>
            </div>
            {data.criticalIncidents > 0 && (
              <div>
                <p className="text-3xl font-black text-red-600">{data.criticalIncidents}</p>
                <p className="text-xs bf-text-muted">critiques</p>
              </div>
            )}
            {data.openIncidents === 0 && (
              <p className="text-sm text-emerald-600 font-semibold">✓ Tout traité</p>
            )}
          </div>
        </KpiCard>

        {/* 5. Commandes en retard à réceptionner */}
        <KpiCard label="Commandes en retard à réceptionner" accent={data.lateOrdersToPend > 0 ? 'red' : 'green'}>
          <div className="flex items-end gap-4">
            <div>
              <p className={`text-3xl font-black ${data.lateOrdersToPend > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{data.lateOrdersToPend}</p>
              <p className="text-xs bf-text-muted">commande{data.lateOrdersToPend !== 1 ? 's' : ''} en retard</p>
            </div>
            {data.lateOrdersToPend === 0 && (
              <p className="text-sm text-emerald-600 font-semibold">✓ Aucun retard</p>
            )}
          </div>
        </KpiCard>

        {/* 6. Commandes livrées en retard */}
        <KpiCard label="Commandes livrées en retard" accent={data.lateDeliveries > 0 ? 'amber' : 'green'}>
          <div className="flex items-end gap-4">
            <div>
              <p className={`text-3xl font-black ${data.lateDeliveries > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{data.lateDeliveries}</p>
              <p className="text-xs bf-text-muted">livraison{data.lateDeliveries !== 1 ? 's' : ''} hors délai</p>
            </div>
            {data.lateDeliveries === 0 && (
              <p className="text-sm text-emerald-600 font-semibold">✓ Aucun retard</p>
            )}
          </div>
        </KpiCard>

      </div>

      {/* Grille projets */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {data.projects.map((project) => (
          <button
            key={project.id}
            onClick={() => handleOpenProject(project.id)}
            className="bf-card-soft p-5 rounded-xl text-left hover:shadow-md transition-all w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold bf-text-primary text-base">{project.name}</p>
                <p className="text-xs bf-text-muted font-mono mt-0.5">{project.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bf-text-muted">{STATUS_LABELS[project.status] ?? project.status}</span>
                {project.plannedEndDate && (
                  <span className="text-xs bf-text-muted">
                    🗓 {new Date(project.plannedEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs bf-text-muted mb-1">
                <span>Avancement</span>
                <span className="font-semibold">{project.completionPct}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(project.completionPct, 100)}%` }} />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs bf-text-muted mb-1">
                <span>Budget consommé</span>
                <span className={`font-semibold ${project.budgetRate > 90 ? 'text-red-600' : project.budgetRate > 70 ? 'text-amber-600' : 'bf-text-muted'}`}>
                  {project.budgetRate}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${project.budgetRate > 90 ? 'bg-red-500' : project.budgetRate > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(project.budgetRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 text-xs bf-text-muted border-t pt-3">
              <span>{project.incidentCount} incident{project.incidentCount !== 1 ? 's' : ''}</span>
              {project.openCriticalIncidents > 0 && (
                <span className="text-red-600 font-semibold">{project.openCriticalIncidents} critique{project.openCriticalIncidents !== 1 ? 's' : ''}</span>
              )}
              <span className="ml-auto text-cyan-600 font-medium">Ouvrir →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

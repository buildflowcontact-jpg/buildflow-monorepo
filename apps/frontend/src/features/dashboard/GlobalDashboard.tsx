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

const DELAY_COLORS: Record<string, string> = {
  ok: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  derive: 'text-amber-700 bg-amber-50 border-amber-200',
  critique: 'text-red-700 bg-red-50 border-red-200',
};

const DELAY_LABELS: Record<string, string> = {
  ok: 'Dans les temps',
  derive: 'Dérive',
  critique: 'Critique',
};

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
        <SkeletonKpiGrid count={4} />
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

  const kpis = [
    { label: 'Chiffre en cours', value: `${(data.revenueInFlight / 1000).toFixed(0)} k€`, color: 'text-cyan-700' },
    { label: 'Marge estimée', value: `${(data.estimatedMargin / 1000).toFixed(0)} k€`, color: 'text-emerald-700' },
    { label: 'Projets en dérive', value: String(data.delayedProjects), color: data.delayedProjects > 0 ? 'text-amber-600' : 'text-slate-700' },
    { label: 'Incidents critiques', value: String(data.criticalIncidents), color: data.criticalIncidents > 0 ? 'text-red-600' : 'text-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs globaux */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bf-card-soft p-5 rounded-xl">
            <p className="text-xs bf-text-muted uppercase tracking-wide font-medium">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
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
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DELAY_COLORS[project.delayedLabel]}`}>
                  {DELAY_LABELS[project.delayedLabel]}
                </span>
              </div>
            </div>

            {/* Avancement */}
            <div className="mb-3">
              <div className="flex justify-between text-xs bf-text-muted mb-1">
                <span>Avancement</span>
                <span className="font-semibold">{project.completionPct}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(project.completionPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Budget */}
            <div className="mb-4">
              <div className="flex justify-between text-xs bf-text-muted mb-1">
                <span>Budget consommé</span>
                <span className={`font-semibold ${project.budgetRate > 90 ? 'text-red-600' : project.budgetRate > 70 ? 'text-amber-600' : 'bf-text-muted'}`}>
                  {project.budgetRate}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.budgetRate > 90 ? 'bg-red-500' : project.budgetRate > 70 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(project.budgetRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 text-xs bf-text-muted border-t pt-3">
              <span>{project.incidentCount} incident{project.incidentCount !== 1 ? 's' : ''}</span>
              {project.openCriticalIncidents > 0 && (
                <span className="text-red-600 font-semibold">
                  {project.openCriticalIncidents} critique{project.openCriticalIncidents !== 1 ? 's' : ''}
                </span>
              )}
              <span className="ml-auto text-cyan-600 font-medium">Ouvrir →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

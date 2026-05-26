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

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MiniTrend({ values, colors }: { values: number[]; colors: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-12 pt-2" aria-hidden="true">
      {values.map((value, index) => {
        const height = `${Math.max(10, Math.round((value / max) * 100))}%`;
        return (
          <div
            key={`chart-${index}`}
            className={`w-4 rounded-t ${colors[index % colors.length]}`}
            style={{ height }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatDateShort(value: string | null) {
  if (!value) return 'Date non definie';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getProjectTone(project: { delayedLabel: 'ok' | 'derive' | 'critique'; openCriticalIncidents: number; status: string }) {
  if (project.status === 'completed') {
    return {
      shell: 'border-slate-200 bg-slate-50/80',
      badge: 'bg-slate-200 text-slate-700',
      label: 'Cloture',
      accent: 'bg-slate-400',
    };
  }
  if (project.openCriticalIncidents > 0 || project.delayedLabel === 'critique') {
    return {
      shell: 'border-red-200 bg-red-50/80 shadow-[0_8px_24px_rgba(239,68,68,0.08)]',
      badge: 'bg-red-100 text-red-700',
      label: 'Sous tension',
      accent: 'bg-red-500',
    };
  }
  if (project.delayedLabel === 'derive') {
    return {
      shell: 'border-amber-200 bg-amber-50/80 shadow-[0_8px_24px_rgba(245,158,11,0.08)]',
      badge: 'bg-amber-100 text-amber-700',
      label: 'A surveiller',
      accent: 'bg-amber-400',
    };
  }
  return {
    shell: 'border-emerald-200 bg-emerald-50/70 shadow-[0_8px_24px_rgba(16,185,129,0.06)]',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Maîtrise',
    accent: 'bg-emerald-500',
  };
}

function getProjectPhase(project: { status: string; completionPct: number }) {
  if (project.status === 'completed') return 'Reception';
  if (project.status === 'draft') return 'Preparation';
  if (project.completionPct < 20) return 'Lancement';
  if (project.completionPct < 70) return 'Execution';
  return 'Finalisation';
}

function getProjectActionLabel(project: { delayedLabel: 'ok' | 'derive' | 'critique'; openCriticalIncidents: number; budgetRate: number; status: string }) {
  if (project.status === 'completed') return 'Verifier les derniers livrables';
  if (project.openCriticalIncidents > 0) return 'Declencher une revue terrain';
  if (project.delayedLabel === 'critique') return 'Arbitrer budget et planning';
  if (project.delayedLabel === 'derive') return 'Recadrer les priorites chantier';
  if (project.budgetRate > 70) return 'Suivre les postes d engagement';
  return 'Poursuivre le rythme d execution';
}

function getMilestoneState(completionPct: number, threshold: number) {
  if (completionPct >= threshold) return 'done';
  if (completionPct >= threshold - 20) return 'active';
  return 'upcoming';
}

function MetricTile({
  label,
  value,
  hint,
  tone,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'amber' | 'red' | 'green';
  trend: number[];
}) {
  const toneStyles = {
    blue: 'border-cyan-200 bg-cyan-50/80 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50/80 text-amber-700',
    red: 'border-red-200 bg-red-50/80 text-red-700',
    green: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  }[tone];
  const trendColors = {
    blue: ['bg-cyan-500', 'bg-sky-400', 'bg-indigo-500'],
    amber: ['bg-amber-400', 'bg-orange-400', 'bg-yellow-500'],
    red: ['bg-red-500', 'bg-rose-400', 'bg-amber-400'],
    green: ['bg-emerald-500', 'bg-lime-400', 'bg-cyan-500'],
  }[tone];

  return (
    <div className={`rounded-[24px] border p-5 ${toneStyles}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em]">{label}</p>
      <p className="mt-4 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
      <MiniTrend values={trend} colors={trendColors} />
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
  const projectCount = data.projects.length;
  const averageCompletion = projectCount > 0
    ? Math.round(data.projects.reduce((sum, project) => sum + project.completionPct, 0) / projectCount)
    : 0;
  const topPriorityProjects = [...data.projects].sort((left, right) => {
    const leftScore = (left.openCriticalIncidents * 100) + (left.delayedLabel === 'critique' ? 50 : left.delayedLabel === 'derive' ? 20 : 0) + left.budgetRate;
    const rightScore = (right.openCriticalIncidents * 100) + (right.delayedLabel === 'critique' ? 50 : right.delayedLabel === 'derive' ? 20 : 0) + right.budgetRate;
    return rightScore - leftScore;
  });
  const leadProject = topPriorityProjects[0] ?? data.projects[0];
  const healthyProjects = data.projects.filter((project) => project.delayedLabel === 'ok' && project.openCriticalIncidents === 0).length;
  const signalFeed = [
    {
      id: 'incidents',
      title: data.criticalIncidents > 0 ? 'Incidents terrain critiques a traiter' : 'Aucun incident critique en attente',
      detail: data.criticalIncidents > 0
        ? `${data.criticalIncidents} incident${data.criticalIncidents > 1 ? 's' : ''} critique${data.criticalIncidents > 1 ? 's' : ''} et ${data.openIncidents} ouvert${data.openIncidents > 1 ? 's' : ''}.`
        : 'Le front terrain est stable pour le moment.',
      tone: data.criticalIncidents > 0 ? 'red' : 'green',
    },
    {
      id: 'planning',
      title: data.delayedProjects > 0 ? 'Planning sous surveillance' : 'Planning global aligne',
      detail: data.delayedProjects > 0
        ? `${data.delayedProjects} projet${data.delayedProjects > 1 ? 's' : ''} avec derive budget/delai.`
        : 'Aucune derive majeure detectee sur le portefeuille.',
      tone: data.delayedProjects > 0 ? 'amber' : 'green',
    },
    {
      id: 'supply',
      title: data.lateOrdersToPend > 0 ? 'Approvisionnements a relancer' : 'Approvisionnements sous controle',
      detail: data.lateOrdersToPend > 0
        ? `${data.lateOrdersToPend} commande${data.lateOrdersToPend > 1 ? 's' : ''} attendue${data.lateOrdersToPend > 1 ? 's' : ''} et ${data.lateDeliveries} livraison${data.lateDeliveries > 1 ? 's' : ''} hors delai.`
        : 'Aucun retard fournisseur actif a ce stade.',
      tone: data.lateOrdersToPend > 0 ? 'red' : data.lateDeliveries > 0 ? 'amber' : 'green',
    },
    {
      id: 'team',
      title: workloadPct !== null && workloadPct > 90 ? 'Charge equipe a arbitrer' : 'Charge equipe exploitable',
      detail: totalEstimatedHours > 0
        ? `${totalActualHours}h realisees pour ${totalEstimatedHours}h estimees.`
        : `${totalActualHours}h remontees terrain, sans estimation consolidee.`,
      tone: workloadPct !== null && workloadPct > 90 ? 'amber' : 'blue',
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#0f172a_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.35),transparent_55%)]" />
          <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">
                  Mission control chantier
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {projectCount} projet{projectCount > 1 ? 's' : ''} pilotes
                </span>
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Vision portefeuille</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-4xl">
                  {data.criticalIncidents > 0 || data.delayedProjects > 0
                    ? 'Le chantier demande une lecture plus operationnelle, pas une simple grille de KPIs.'
                    : 'Le portefeuille est stable, avec une marge et un planning sous controle.'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Avancement moyen {averageCompletion}% · budget consomme a {budgetPct}% · {healthyProjects} projet{healthyProjects > 1 ? 's' : ''} en maitrise nette.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Budget vendu</p>
                  <p className="mt-2 text-2xl font-black">{formatCurrencyCompact(data.totalBudgetSold)}</p>
                  <p className="mt-1 text-xs text-slate-300">Encours chantier consolide</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Budget consomme</p>
                  <p className={`mt-2 text-2xl font-black ${budgetPct >= 100 ? 'text-red-300' : budgetPct >= 80 ? 'text-amber-300' : 'text-emerald-300'}`}>{formatCurrencyCompact(data.totalBudgetSpent)}</p>
                  <p className="mt-1 text-xs text-slate-300">Taux d engagement {budgetPct}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Marge estimee</p>
                  <p className={`mt-2 text-2xl font-black ${data.estimatedMargin >= 0 ? 'text-cyan-200' : 'text-red-300'}`}>{formatCurrencyCompact(data.estimatedMargin)}</p>
                  <p className="mt-1 text-xs text-slate-300">Lecture brute vendu vs consomme</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Projet prioritaire</p>
                  <h3 className="mt-2 text-xl font-black text-white">{leadProject.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{leadProject.code} · {STATUS_LABELS[leadProject.status] ?? leadProject.status}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${getProjectTone(leadProject).badge}`}>
                  {getProjectTone(leadProject).label}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Avancement terrain</span>
                    <span className="font-bold text-white">{leadProject.completionPct}%</span>
                  </div>
                  <Bar value={leadProject.completionPct} max={100} color="bg-cyan-400" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Budget engage</span>
                    <span className={`font-bold ${leadProject.budgetRate >= 90 ? 'text-red-300' : leadProject.budgetRate >= 70 ? 'text-amber-300' : 'text-emerald-300'}`}>{leadProject.budgetRate}%</span>
                  </div>
                  <Bar value={leadProject.budgetRate} max={100} color={leadProject.budgetRate >= 90 ? 'bg-red-400' : leadProject.budgetRate >= 70 ? 'bg-amber-300' : 'bg-emerald-400'} />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <p className="text-xs text-slate-400">Incidents ouverts</p>
                  <p className="mt-1 text-lg font-black text-white">{leadProject.incidentCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3">
                  <p className="text-xs text-slate-400">Critiques</p>
                  <p className={`mt-1 text-lg font-black ${leadProject.openCriticalIncidents > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{leadProject.openCriticalIncidents}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-3 sm:col-span-2">
                  <p className="text-xs text-slate-400">Jalon vise</p>
                  <p className="mt-1 text-sm font-bold text-white">{formatDateShort(leadProject.plannedEndDate)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenProject(leadProject.id)}
                className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-cyan-50"
              >
                Ouvrir le projet prioritaire
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricTile
            label="Pilotage budget"
            value={`${budgetPct}%`}
            hint={`${formatCurrencyCompact(data.totalBudgetSpent)} consommes sur ${formatCurrencyCompact(data.totalBudgetSold)}`}
            tone={budgetAccent === 'red' ? 'red' : budgetAccent === 'amber' ? 'amber' : 'green'}
            trend={[data.totalBudgetSold, data.totalBudgetSpent, Math.max(data.totalBudgetSold - data.totalBudgetSpent, 0)]}
          />
          <MetricTile
            label="Incidents terrain"
            value={`${data.openIncidents}`}
            hint={data.criticalIncidents > 0 ? `${data.criticalIncidents} critique(s) a traiter` : 'Aucune alerte critique'}
            tone={data.criticalIncidents > 0 ? 'red' : data.openIncidents > 0 ? 'amber' : 'green'}
            trend={[data.openIncidents, data.criticalIncidents, Math.max(data.openIncidents - data.criticalIncidents, 0)]}
          />
          <MetricTile
            label="Approvisionnements"
            value={`${data.lateOrdersToPend + data.lateDeliveries}`}
            hint={`${data.lateOrdersToPend} commande(s) en retard, ${data.lateDeliveries} livraison(s) hors delai`}
            tone={data.lateOrdersToPend > 0 ? 'red' : data.lateDeliveries > 0 ? 'amber' : 'green'}
            trend={[data.lateOrdersToPend, data.lateDeliveries, projectCount]}
          />
          <MetricTile
            label="Charge equipe"
            value={workloadPct !== null ? `${workloadPct}%` : `${totalActualHours}h`}
            hint={totalEstimatedHours > 0 ? `${totalActualHours}h realisees pour ${totalEstimatedHours}h estimees` : 'Temps saisi sans base estimee'}
            tone={workloadPct !== null && workloadPct > 90 ? 'amber' : 'blue'}
            trend={data.workloadByMember.slice(0, 3).map((member) => member.actualHours).concat(totalActualHours).slice(0, 4)}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="bf-card-soft rounded-[28px] border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Signal operationnel</p>
              <h3 className="mt-2 text-xl font-black bf-text-primary">Lecture directe du terrain</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Temps reel consolide</span>
          </div>

          <div className="mt-6 space-y-4">
            {signalFeed.map((signal, index) => {
              const tone = signal.tone === 'red'
                ? 'border-red-200 bg-red-50/80'
                : signal.tone === 'amber'
                  ? 'border-amber-200 bg-amber-50/80'
                  : signal.tone === 'green'
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-cyan-200 bg-cyan-50/70';
              const dot = signal.tone === 'red'
                ? 'bg-red-500'
                : signal.tone === 'amber'
                  ? 'bg-amber-400'
                  : signal.tone === 'green'
                    ? 'bg-emerald-500'
                    : 'bg-cyan-500';

              return (
                <div key={signal.id} className={`rounded-[22px] border p-4 ${tone}`}>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-3 w-3 rounded-full ${dot}`} />
                      {index < signalFeed.length - 1 ? <span className="mt-2 h-full w-px bg-slate-300/80" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black bf-text-primary">{signal.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{signal.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bf-card-soft rounded-[28px] border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Priorites portefeuille</p>
              <h3 className="mt-2 text-xl font-black bf-text-primary">Projets qui demandent une action</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Top {Math.min(topPriorityProjects.length, 4)}</span>
          </div>

          <div className="mt-6 space-y-4">
            {topPriorityProjects.slice(0, 4).map((project) => {
              const tone = getProjectTone(project);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleOpenProject(project.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${tone.shell}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black bf-text-primary">{project.name}</p>
                      <p className="mt-1 text-xs font-mono bf-text-muted">{project.code} · {formatDateShort(project.plannedEndDate)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${tone.badge}`}>{tone.label}</span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs bf-text-muted">
                        <span>Avancement</span>
                        <span className="font-semibold bf-text-primary">{project.completionPct}%</span>
                      </div>
                      <Bar value={project.completionPct} max={100} color="bg-cyan-500" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs bf-text-muted">
                        <span>Budget engage</span>
                        <span className={`font-semibold ${project.budgetRate > 90 ? 'text-red-600' : project.budgetRate > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{project.budgetRate}%</span>
                      </div>
                      <Bar value={project.budgetRate} max={100} color={tone.accent} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>{STATUS_LABELS[project.status] ?? project.status}</span>
                    <span>{project.incidentCount} incident{project.incidentCount > 1 ? 's' : ''}</span>
                    {project.openCriticalIncidents > 0 ? <span className="font-bold text-red-600">{project.openCriticalIncidents} critique(s)</span> : null}
                    <span className="ml-auto font-semibold text-cyan-700">Ouvrir le pilotage</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Carte portefeuille</p>
            <h3 className="mt-2 text-xl font-black bf-text-primary">Tous les chantiers, avec une lecture de risque plus nette</h3>
          </div>
          <p className="text-sm text-slate-500">Cliquez sur un chantier pour basculer dans l execution.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {data.projects.map((project) => {
            const tone = getProjectTone(project);
            const phase = getProjectPhase(project);
            const actionLabel = getProjectActionLabel(project);
            const milestoneStates = [
              { label: 'Etudes', state: getMilestoneState(project.completionPct, 15) },
              { label: 'Execution', state: getMilestoneState(project.completionPct, 55) },
              { label: 'Reception', state: getMilestoneState(project.completionPct, 90) },
            ];
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => handleOpenProject(project.id)}
                className={`w-full rounded-[28px] border p-5 text-left transition hover:-translate-y-0.5 ${tone.shell}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black bf-text-primary">{project.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 font-black uppercase tracking-[0.16em] text-white">{phase}</span>
                      <span className="font-mono bf-text-muted">{project.code}</span>
                      <span className="text-slate-500">Jalon cible {formatDateShort(project.plannedEndDate)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${tone.badge}`}>{tone.label}</span>
                    <p className="mt-2 text-xs text-slate-500">{STATUS_LABELS[project.status] ?? project.status}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-slate-200/80 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Action recommandee</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{actionLabel}</p>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">Pilotage chantier</span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {milestoneStates.map((milestone) => {
                      const toneClass = milestone.state === 'done'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : milestone.state === 'active'
                          ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500';
                      return (
                        <div key={milestone.label} className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em]">{milestone.label}</p>
                          <p className="mt-2 text-xs font-semibold">
                            {milestone.state === 'done' ? 'Valide' : milestone.state === 'active' ? 'En cours' : 'A venir'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white/70 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs bf-text-muted">
                      <span>Avancement chantier</span>
                      <span className="font-bold bf-text-primary">{project.completionPct}%</span>
                    </div>
                    <Bar value={project.completionPct} max={100} color="bg-cyan-500" />
                    <p className="mt-3 text-xs text-slate-500">Jalon vise: {formatDateShort(project.plannedEndDate)}</p>
                  </div>

                  <div className="rounded-2xl bg-white/70 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs bf-text-muted">
                      <span>Budget consomme</span>
                      <span className={`font-bold ${project.budgetRate > 90 ? 'text-red-600' : project.budgetRate > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>{project.budgetRate}%</span>
                    </div>
                    <Bar value={project.budgetRate} max={100} color={tone.accent} />
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">{project.incidentCount} incident{project.incidentCount > 1 ? 's' : ''}</span>
                      {project.openCriticalIncidents > 0 ? <span className="rounded-full bg-red-100 px-2.5 py-1 font-bold text-red-600">{project.openCriticalIncidents} critique(s)</span> : <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-600">Aucun critique</span>}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1">{project.delayedLabel === 'ok' ? 'Cadence OK' : project.delayedLabel === 'derive' ? 'Derive a contenir' : 'Recadrage urgent'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-4 text-sm">
                  <span className="text-slate-500">Pilotage terrain, jalons, incidents et budget</span>
                  <span className="font-black text-slate-900">Ouvrir</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

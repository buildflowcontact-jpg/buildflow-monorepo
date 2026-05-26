import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarCheck2, Clock3, Droplets, Info, PackageX, Sun, ThermometerSun, Users, Wallet, Wind } from 'lucide-react';
import { usePortfolioDashboard } from '@/modules/kpi/hooks/usePortfolioDashboard';
import { useAuth } from '@/modules/chantier/hooks/useAuth';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency, normalizeCurrency, resolveUserCurrency } from '@/utils/currency';
import { formatTemperature, resolveUserTemperatureUnit } from '@/utils/temperature';
import { SkeletonCard, SkeletonKpiGrid } from '@/components/ui/Skeleton';

function RingProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative grid h-40 w-40 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#2563eb ${clamped * 3.6}deg, #dbe5f5 ${clamped * 3.6}deg)`,
      }}
    >
      <div className="grid h-[152px] w-[152px] place-items-center rounded-full bg-white text-center">
        <p className="text-4xl font-black text-slate-900">{clamped}%</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Avancement</p>
      </div>
    </div>
  );
}

function MicroBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusDot({ tone }: { tone: 'done' | 'active' | 'upcoming' }) {
  const classes = tone === 'done'
    ? 'bg-emerald-500'
    : tone === 'active'
      ? 'bg-blue-500'
      : 'bg-slate-300';
  return <span className={`h-2.5 w-2.5 rounded-full ${classes}`} />;
}

function kCurrency(value: number, currency: ReturnType<typeof normalizeCurrency>) {
  return formatCurrency(value / 1000, currency, { notation: 'compact' });
}

function dateShort(value: string | null) {
  if (!value) return 'Date a definir';
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function GlobalDashboard() {
  const { user } = useAuth();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const { data, isLoading } = usePortfolioDashboard();
  const navigate = useNavigate();

  const sortedProjects = useMemo(() => {
    if (!data) return [];
    return [...data.projects].sort((left, right) => {
      const leftScore = left.openCriticalIncidents * 100 + left.budgetRate;
      const rightScore = right.openCriticalIncidents * 100 + right.budgetRate;
      return rightScore - leftScore;
    });
  }, [data]);

  const leadProject = sortedProjects[0] ?? null;
  const userMetadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const effectiveCurrency = resolveUserCurrency(userMetadata, currentProjectId ?? leadProject?.id ?? null);
  const effectiveTemperatureUnit = resolveUserTemperatureUnit(userMetadata, currentProjectId ?? leadProject?.id ?? null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonKpiGrid count={3} />
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data || data.projects.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-3xl">🏗️</p>
        <p className="mt-2 text-lg font-black text-slate-900">Aucun projet disponible</p>
        <p className="mt-1 text-sm text-slate-500">Creez un projet pour afficher le tableau de bord.</p>
      </div>
    );
  }

  const completion = leadProject?.completionPct ?? 0;
  const budgetPct = data.totalBudgetSold > 0 ? Math.round((data.totalBudgetSpent / data.totalBudgetSold) * 100) : 0;
  const budgetRemaining = Math.max(data.totalBudgetSold - data.totalBudgetSpent, 0);
  const totalMembers = data.workloadByMember.length;
  const onSiteMembers = Math.max(0, Math.round(totalMembers * 0.55));
  const officeMembers = Math.max(0, Math.round(totalMembers * 0.3));
  const unavailableMembers = Math.max(0, totalMembers - onSiteMembers - officeMembers);

  const alerts = [
    {
      id: 'orders',
      icon: PackageX,
      title: `${data.lateOrdersToPend} commande${data.lateOrdersToPend > 1 ? 's' : ''} en retard`,
      link: 'Voir les commandes',
      tone: data.lateOrdersToPend > 0 ? 'red' : 'slate',
      to: '/approvisionner',
    },
    {
      id: 'incidents',
      icon: AlertTriangle,
      title: `${data.openIncidents} incident${data.openIncidents > 1 ? 's' : ''} ouvert${data.openIncidents > 1 ? 's' : ''}`,
      link: 'Voir les incidents',
      tone: data.criticalIncidents > 0 ? 'amber' : 'slate',
      to: '/incidents',
    },
    {
      id: 'validations',
      icon: Info,
      title: `${Math.max(1, data.delayedProjects)} validation${data.delayedProjects > 1 ? 's' : ''} en attente`,
      link: 'Voir les validations',
      tone: 'blue',
      to: '/documents',
    },
  ] as const;

  const recentActivity = [
    `${leadProject?.name ?? 'Projet'}: commande verifiee`,
    `${leadProject?.name ?? 'Projet'}: incident declare`,
    `${leadProject?.name ?? 'Projet'}: document ajoute`,
    `${leadProject?.name ?? 'Projet'}: point chantier valide`,
  ];

  const forecast = [
    { day: 'Mar.', max: 18, min: 10 },
    { day: 'Mer.', max: 20, min: 11 },
    { day: 'Jeu.', max: 19, min: 9 },
    { day: 'Ven.', max: 17, min: 8 },
  ];

  const displayedTemperature = formatTemperature(18, effectiveTemperatureUnit);
  const plannedProgress = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 90, 100];
  const actualBase = [8, 12, 22, 25, 32, 35, 44, 51, 58, 64, 72, 84];
  const scale = completion > 0 ? completion / actualBase[actualBase.length - 1] : 0;
  const actualProgress = actualBase.map((value, index) => {
    if (index === actualBase.length - 1) {
      return Math.max(0, Math.min(100, completion));
    }
    return Math.max(0, Math.min(100, Math.round(value * scale)));
  });

  const chartWidth = 640;
  const chartHeight = 220;
  const chartPaddingX = 16;
  const chartPaddingTop = 14;
  const chartPaddingBottom = 28;
  const chartPlotHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
  const toX = (index: number) => chartPaddingX + (index * (chartWidth - chartPaddingX * 2)) / (plannedProgress.length - 1);
  const toY = (value: number) => chartPaddingTop + ((100 - value) / 100) * chartPlotHeight;
  const plannedPolyline = plannedProgress.map((value, index) => `${toX(index)},${toY(value)}`).join(' ');

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900">{leadProject?.name ?? 'Projet'}</h2>
            <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">En cours</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-black text-slate-900">Avancement global du projet</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <div className="grid place-items-center">
              <RingProgress value={completion} />
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Budget consomme</p>
                  <p className="text-3xl font-black text-slate-900">{kCurrency(data.totalBudgetSpent, effectiveCurrency)}</p>
                  <p className="text-xs text-slate-500">sur {kCurrency(data.totalBudgetSold, effectiveCurrency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Budget restant</p>
                  <p className="text-3xl font-black text-emerald-600">{kCurrency(budgetRemaining, effectiveCurrency)}</p>
                  <p className="text-xs text-slate-500">{budgetPct}% deja engage</p>
                </div>
              </div>
              <MicroBar value={data.totalBudgetSpent} max={data.totalBudgetSold} color={budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-400' : 'bg-emerald-500'} />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">Jalons cles</p>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="done" />
                    <span className="font-medium text-slate-700">Demarrage projet</span>
                  </div>
                  <span className="text-xs text-slate-500">12 fev. 2024</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="done" />
                    <span className="font-medium text-slate-700">Gros oeuvre termine</span>
                  </div>
                  <span className="text-xs text-slate-500">18 avr. 2024</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="active" />
                    <span className="font-medium text-slate-700">Clos couvert</span>
                  </div>
                  <span className="text-xs text-slate-500">15 juil. 2024</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="upcoming" />
                    <span className="font-medium text-slate-700">Livraison</span>
                  </div>
                  <span className="text-xs text-slate-500">{dateShort(leadProject?.plannedEndDate ?? null)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Alertes prioritaires</h3>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const toneClass = alert.tone === 'red'
                ? 'bg-red-50 text-red-700 border-red-100'
                : alert.tone === 'amber'
                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                  : alert.tone === 'blue'
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200';
              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => navigate(alert.to)}
                  className={`w-full rounded-xl border p-3 text-left ${toneClass}`}
                >
                  <div className="flex items-start gap-3">
                    <alert.icon size={16} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-bold">{alert.title}</p>
                      <p className="text-xs opacity-90">{alert.link}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Budget</p>
            <Wallet size={16} className="text-violet-600" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-500">Consomme</p>
              <p className="font-black text-slate-900">{kCurrency(data.totalBudgetSpent, effectiveCurrency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Restant</p>
              <p className="font-black text-emerald-600">{kCurrency(budgetRemaining, effectiveCurrency)}</p>
            </div>
          </div>
          <div className="mt-3">
            <MicroBar value={data.totalBudgetSpent} max={data.totalBudgetSold} color="bg-violet-500" />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Charge equipe</p>
            <Users size={16} className="text-emerald-600" />
          </div>
          <p className="mt-3 text-4xl font-black text-slate-900">{totalMembers}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <p>Sur site: {onSiteMembers}</p>
            <p>En bureau: {officeMembers}</p>
            <p>Indisponibles: {unavailableMembers}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Commandes</p>
            <PackageX size={16} className="text-blue-600" />
          </div>
          <p className="mt-3 text-4xl font-black text-slate-900">{data.lateOrdersToPend + data.lateDeliveries + 14}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div>
              <p className="font-bold text-emerald-600">14</p>
              <p>Livrees</p>
            </div>
            <div>
              <p className="font-bold text-red-600">{data.lateOrdersToPend}</p>
              <p>En retard</p>
            </div>
            <div>
              <p className="font-bold text-amber-600">{data.lateDeliveries}</p>
              <p>En attente</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-slate-900">Incidents</p>
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <p className="mt-3 text-4xl font-black text-slate-900">{data.openIncidents}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
            <div>
              <p className="font-bold text-red-600">{data.criticalIncidents}</p>
              <p>Ouverts</p>
            </div>
            <div>
              <p className="font-bold text-amber-600">{Math.max(0, data.openIncidents - data.criticalIncidents)}</p>
              <p>En cours</p>
            </div>
            <div>
              <p className="font-bold text-emerald-600">{Math.max(0, 8 - data.openIncidents)}</p>
              <p>Resolus</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Avancement dans le temps</h3>
            <span className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">12 derniers mois</span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-6 rounded-full bg-slate-400" />
              <span>Prevu</span>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-6 rounded-full bg-emerald-500" />
              <span>Reel en adequation</span>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-6 rounded-full bg-red-500" />
              <span>Reel en retard</span>
            </div>
          </div>
          <div className="mt-4 h-56 w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
              {[0, 25, 50, 75, 100].map((tick) => (
                <line
                  key={`grid-${tick}`}
                  x1={chartPaddingX}
                  x2={chartWidth - chartPaddingX}
                  y1={toY(tick)}
                  y2={toY(tick)}
                  stroke="#e5e7eb"
                  strokeDasharray="3 6"
                  strokeWidth="1"
                />
              ))}

              <polyline
                points={plannedPolyline}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {actualProgress.slice(0, -1).map((value, index) => {
                const nextValue = actualProgress[index + 1];
                const plannedValue = plannedProgress[index];
                const nextPlannedValue = plannedProgress[index + 1];
                const isOnTrack = value >= plannedValue && nextValue >= nextPlannedValue;
                const stroke = isOnTrack ? '#10b981' : '#ef4444';

                return (
                  <line
                    key={`actual-segment-${index}`}
                    x1={toX(index)}
                    y1={toY(value)}
                    x2={toX(index + 1)}
                    y2={toY(nextValue)}
                    stroke={stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}

              {actualProgress.map((value, index) => {
                const plannedValue = plannedProgress[index];
                const dotColor = value >= plannedValue ? '#10b981' : '#ef4444';
                return (
                  <circle
                    key={`actual-dot-${index}`}
                    cx={toX(index)}
                    cy={toY(value)}
                    r="3.5"
                    fill={dotColor}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Activite recente</h3>
            <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Voir toute l'activite</button>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivity.map((item, index) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item}</p>
                  <p className="text-xs text-slate-500">il y a {index + 1} heure{index > 0 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-cyan-200/40 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Meteo sur site</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-sky-700/80">Unite active: °{effectiveTemperatureUnit}</p>
            </div>
            <span className="rounded-full border border-sky-200 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-sky-700">Conditions stables</span>
          </div>

          <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 backdrop-blur-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-600">
              <Sun size={22} />
            </div>
            <div>
              <p className="text-4xl font-black leading-none text-slate-900">{displayedTemperature}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Ensoleille</p>
            </div>
          </div>

          <div className="relative mt-4 grid grid-cols-3 gap-2.5 text-xs">
            <div className="rounded-xl border border-white/60 bg-white/75 px-2 py-2">
              <div className="flex items-center gap-1 text-slate-500">
                <Wind size={12} />
                <span>Vent</span>
              </div>
              <p className="mt-1 text-sm font-black text-slate-800">15 km/h</p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/75 px-2 py-2">
              <div className="flex items-center gap-1 text-slate-500">
                <Droplets size={12} />
                <span>Humidite</span>
              </div>
              <p className="mt-1 text-sm font-black text-slate-800">45%</p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/75 px-2 py-2">
              <div className="flex items-center gap-1 text-slate-500">
                <ThermometerSun size={12} />
                <span>Ressenti</span>
              </div>
              <p className="mt-1 text-sm font-black text-slate-800">{formatTemperature(19, effectiveTemperatureUnit)}</p>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-4 gap-2 text-center">
            {forecast.map((day) => (
              <div key={day.day} className="rounded-xl border border-white/60 bg-white/80 px-1 py-2 shadow-[0_4px_14px_rgba(125,211,252,0.16)]">
                <p className="text-[10px] font-bold text-slate-500">{day.day}</p>
                <CalendarCheck2 size={14} className="mx-auto my-1 text-sky-500" />
                <p className="text-[10px] font-semibold text-slate-700">{formatTemperature(day.max, effectiveTemperatureUnit)}</p>
                <p className="text-[10px] text-slate-400">{formatTemperature(day.min, effectiveTemperatureUnit)}</p>
              </div>
            ))}
          </div>

          <button type="button" className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-colors hover:bg-white">
            <Clock3 size={12} />
            Voir la meteo detaillee
          </button>
        </article>
      </section>
    </div>
  );
}

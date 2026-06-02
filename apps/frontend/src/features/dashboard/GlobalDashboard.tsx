import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, Check, Cloud, CloudRain, Info, MoreVertical, PackageX, Users, Wallet } from 'lucide-react';
import { usePortfolioDashboard } from '@/modules/kpi/hooks/usePortfolioDashboard';
import { useAuth } from '@/modules/chantier/hooks/useAuth';
import { useProjectStore } from '@/store/projectStore';
import { formatCurrency, normalizeCurrency, resolveUserCurrency } from '@/utils/currency';

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

function MiniTrend({ value, total, color }: { value: number; total: number; color: string }) {
  const safeTotal = Math.max(total, 1);
  const width = Math.max(12, Math.round((value / safeTotal) * 100));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
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
  const chartHeight = 280;
  const chartPaddingX = 16;
  const chartPaddingTop = 14;
  const chartPaddingBottom = 28;
  const chartPlotHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
  const toX = (index: number) => chartPaddingX + (index * (chartWidth - chartPaddingX * 2)) / (plannedProgress.length - 1);
  const toY = (value: number) => chartPaddingTop + ((100 - value) / 100) * chartPlotHeight;
  const plannedPolyline = plannedProgress.map((value, index) => `${toX(index)},${toY(value)}`).join(' ');
  const dashboardTabs = [
    { label: "Vue d'ensemble", to: '/dashboard', active: true },
    { label: 'Avancement', to: '/planifier', active: false },
    { label: 'Planning', to: '/planifier', active: false },
    { label: 'Equipe', to: '/equipe', active: false },
    { label: 'Documents', to: '/documents', active: false },
    { label: 'Incidents', to: '/incidents', active: false },
  ] as const;

  const dashboardCards = [
    {
      title: 'Budget',
      accent: 'from-violet-500 to-indigo-500',
      icon: Wallet,
      primaryLabel: 'Consomme',
      primaryValue: kCurrency(data.totalBudgetSpent, effectiveCurrency),
      secondaryLabel: 'Restant',
      secondaryValue: kCurrency(budgetRemaining, effectiveCurrency),
      footer: 'Voir le detail du budget',
      progressColor: 'bg-violet-500',
      progressValue: data.totalBudgetSpent,
      progressMax: data.totalBudgetSold,
      stats: [
        `${budgetPct}% engage`,
        `${100 - Math.min(100, budgetPct)}% marge`,
      ],
    },
    {
      title: 'Charge equipe',
      accent: 'from-emerald-500 to-teal-500',
      icon: Users,
      primaryLabel: 'Personnes affectees',
      primaryValue: String(totalMembers),
      secondaryLabel: 'Disponibilite',
      secondaryValue: `${Math.max(0, 100 - unavailableMembers * 10)}%`,
      footer: "Voir l'equipe",
      progressColor: 'bg-emerald-500',
      progressValue: onSiteMembers + officeMembers,
      progressMax: totalMembers,
      stats: [
        `Sur site ${onSiteMembers}`,
        `Bureau ${officeMembers}`,
        `Indisponibles ${unavailableMembers}`,
      ],
    },
    {
      title: 'Commandes',
      accent: 'from-blue-500 to-cyan-500',
      icon: PackageX,
      primaryLabel: 'Commandes au total',
      primaryValue: String(data.lateOrdersToPend + data.lateDeliveries + 14),
      secondaryLabel: 'Livrees',
      secondaryValue: '14',
      footer: 'Voir toutes les commandes',
      progressColor: 'bg-blue-500',
      progressValue: 14,
      progressMax: data.lateOrdersToPend + data.lateDeliveries + 14,
      stats: [
        `En retard ${data.lateOrdersToPend}`,
        `En attente ${data.lateDeliveries}`,
      ],
    },
    {
      title: 'Incidents',
      accent: 'from-rose-500 to-orange-500',
      icon: AlertTriangle,
      primaryLabel: 'Incidents au total',
      primaryValue: String(data.openIncidents),
      secondaryLabel: 'Critiques',
      secondaryValue: String(data.criticalIncidents),
      footer: 'Voir tous les incidents',
      progressColor: 'bg-rose-500',
      progressValue: data.criticalIncidents,
      progressMax: Math.max(data.openIncidents, 1),
      stats: [
        `En cours ${Math.max(0, data.openIncidents - data.criticalIncidents)}`,
        `Resolus ${Math.max(0, 8 - data.openIncidents)}`,
      ],
    },
  ] as const;

  const recentFeed = [
    {
      id: 'a1',
      initials: 'JM',
      title: 'Julien Martin a valide la commande CMD-045',
      time: 'il y a 2 heures',
      tone: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'a2',
      initials: 'SB',
      title: 'Sophie Bernard a cree un incident INC-128',
      time: 'il y a 4 heures',
      tone: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'a3',
      initials: 'OK',
      title: 'La commande CMD-039 a ete livree',
      time: 'il y a 1 jour',
      tone: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'a4',
      initials: 'TP',
      title: 'Thomas Petit a ajoute un document',
      time: 'il y a 2 jours',
      tone: 'bg-sky-100 text-sky-700',
    },
  ] as const;

  const weather = [
    { day: 'Mar.', max: 18, min: 10, icon: Cloud, tone: 'text-amber-500' },
    { day: 'Mer.', max: 20, min: 11, icon: Cloud, tone: 'text-amber-500' },
    { day: 'Jeu.', max: 19, min: 9, icon: CloudRain, tone: 'text-sky-500' },
    { day: 'Ven.', max: 17, min: 8, icon: Cloud, tone: 'text-slate-400' },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_64px_-50px_rgba(15,23,42,0.48)]">
        <div className="border-b border-slate-100 px-7 pb-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[2.2rem] font-black tracking-[-0.015em] text-slate-950">{leadProject?.name ?? 'Projet'}</h2>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">En cours</span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-5 border-b border-slate-100/80 pb-[-1px]">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => navigate(tab.to)}
                className={`relative pb-4 text-[13px] font-semibold tracking-[0.01em] transition-colors ${tab.active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab.label}
                {tab.active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 px-7 py-6">
          <section className="grid gap-4 xl:grid-cols-[1.65fr_0.85fr]">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-[1.05rem] font-black tracking-[-0.01em] text-slate-900">Avancement global du projet</h3>
              <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1fr_0.9fr]">
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

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Alertes prioritaires</h3>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">{alerts.length}</span>
              </div>
              <div className="space-y-3">
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
                  className={`w-full rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 ${toneClass}`}
                >
                  <div className="flex items-start gap-3">
                    <alert.icon size={16} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{alert.title}</p>
                      <p className="text-xs opacity-90">{alert.link}</p>
                    </div>
                    <ArrowRight size={14} className="mt-1 opacity-70" />
                  </div>
                </button>
              );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map((card) => (
              <article key={card.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-sm`}>
                      <card.icon size={16} />
                    </span>
                    <p className="text-sm font-black text-slate-900">{card.title}</p>
                  </div>
                  <button type="button" className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">{card.primaryLabel}</p>
                    <p className="mt-1 text-[2rem] font-black leading-none text-slate-950">{card.primaryValue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{card.secondaryLabel}</p>
                    <p className="mt-1 text-[1.6rem] font-black leading-none text-emerald-600">{card.secondaryValue}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <MiniTrend value={card.progressValue} total={card.progressMax} color={card.progressColor} />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                  {card.stats.map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                </div>

                <button type="button" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700">
                  {card.footer}
                  <ArrowRight size={12} />
                </button>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr_0.7fr]">
            <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Avancement dans le temps</h3>
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">12 derniers mois</span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-6 rounded-full border border-dashed border-sky-400 bg-sky-50" />
              <span>Prevu</span>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-2 w-6 rounded-full bg-blue-500" />
              <span>Avancement reel</span>
            </div>
          </div>
          <div className="mt-4 h-72 w-full">
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
                stroke="#93c5fd"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="7 7"
              />

              {actualProgress.slice(0, -1).map((value, index) => {
                const nextValue = actualProgress[index + 1];

                return (
                  <line
                    key={`actual-segment-${index}`}
                    x1={toX(index)}
                    y1={toY(value)}
                    x2={toX(index + 1)}
                    y2={toY(nextValue)}
                    stroke="#2563eb"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                );
              })}

              {actualProgress.map((value, index) => {
                return (
                  <circle
                    key={`actual-dot-${index}`}
                    cx={toX(index)}
                    cy={toY(value)}
                    r="3.5"
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>
            </article>

            <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Activite recente</h3>
            <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Voir toute l'activite</button>
          </div>
          <div className="mt-4 space-y-3">
            {recentFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <span className={`mt-0.5 grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${item.tone}`}>{item.initials}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
            </article>

            <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Cloud size={18} className="text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Meteo sur site</h3>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  <Cloud size={28} className="text-amber-500" />
                  <div>
                    <p className="text-4xl font-black text-slate-900">18°C</p>
                    <p className="text-sm font-semibold text-slate-600">Ensoleille</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    <p>Vent</p>
                    <p className="mt-1 font-bold text-slate-800">15 km/h</p>
                  </div>
                  <div>
                    <p>Humidite</p>
                    <p className="mt-1 font-bold text-slate-800">45%</p>
                  </div>
                  <div>
                    <p>Precipitations</p>
                    <p className="mt-1 font-bold text-slate-800">0%</p>
                  </div>
                  <div>
                    <p>Indice</p>
                    <p className="mt-1 font-bold text-emerald-600">Stable</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {weather.map((day) => (
                  <div key={day.day} className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center">
                    <p className="text-xs font-semibold text-slate-500">{day.day}</p>
                    <day.icon size={18} className={`mx-auto mt-2 ${day.tone}`} />
                    <p className="mt-2 text-sm font-black text-slate-900">{day.max}°</p>
                    <p className="text-xs text-slate-400">{day.min}°</p>
                  </div>
                ))}
              </div>

              <button type="button" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                Voir la meteo detaillee
                <ArrowRight size={12} />
              </button>
            </article>
          </section>

          {(data.lateOrdersToPend > 0 || data.criticalIncidents > 0) ? (
            <div className="flex items-center gap-3 rounded-[24px] border border-red-200 bg-red-50 px-5 py-3">
              <AlertTriangle size={18} className="shrink-0 text-red-600" />
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {data.lateOrdersToPend > 0 ? (
                  <span className="font-semibold text-red-700">
                    {data.lateOrdersToPend} commande{data.lateOrdersToPend > 1 ? 's' : ''} en retard
                  </span>
                ) : null}
                {data.criticalIncidents > 0 ? (
                  <span className="font-semibold text-amber-700">
                    {data.criticalIncidents} incident{data.criticalIncidents > 1 ? 's' : ''} critique{data.criticalIncidents > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800"
                onClick={() => navigate('/incidents')}
              >
                Voir les alertes
                <ArrowRight size={12} />
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

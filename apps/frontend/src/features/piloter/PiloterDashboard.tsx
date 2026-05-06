import React, { useMemo, useState } from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/components/ui/ToastProvider"
import { downloadCsv, downloadExcel, openPrintPreview } from "@/lib/export"

const statsInit = {
  budget: { prevu: 100000, reel: 112000 },
  incidents: 7,
  retards: 2,
  performance: 92,
}

const incidentSchema = z.object({
  description: z.string().min(2, "Description requise")
})
type IncidentForm = z.infer<typeof incidentSchema>

const budgetTrendInit = [
  { month: "Jan", prevu: 9000, reel: 8800 },
  { month: "Fev", prevu: 9300, reel: 9700 },
  { month: "Mar", prevu: 9800, reel: 10100 },
  { month: "Avr", prevu: 10200, reel: 10900 },
  { month: "Mai", prevu: 10800, reel: 11800 },
  { month: "Jun", prevu: 11200, reel: 12400 },
]

const incidentBySeverityInit = [
  { label: "Critique", value: 2, color: "bg-red-500" },
  { label: "Majeur", value: 3, color: "bg-orange-500" },
  { label: "Mineur", value: 2, color: "bg-yellow-500" },
]

const incidentByZoneInit = [
  { zone: "Zone A", value: 3 },
  { zone: "Zone B", value: 2 },
  { zone: "Atelier", value: 2 },
]

const delayByLotInit = [
  { lot: "Gros oeuvre", days: 4 },
  { lot: "Elec", days: 2 },
  { lot: "Plomberie", days: 1 },
  { lot: "Finition", days: 3 },
]

const teamPerfInit = [
  { team: "Equipe Alpha", productivite: 95, qualite: 88, securite: 92, charge: 84 },
  { team: "Equipe Beta", productivite: 89, qualite: 91, securite: 96, charge: 79 },
  { team: "Equipe Gamma", productivite: 83, qualite: 85, securite: 90, charge: 93 },
]

export function PiloterDashboard({ projectName = 'Projet actif' }: { projectName?: string }) {
  const [stats, setStats] = useState(statsInit)
  const [budgetTrend, setBudgetTrend] = useState(budgetTrendInit)
  const [incidentBySeverity, setIncidentBySeverity] = useState(incidentBySeverityInit)
  const [incidentByZone, setIncidentByZone] = useState(incidentByZoneInit)
  const [delayByLot, setDelayByLot] = useState(delayByLotInit)
  const [teamPerf, setTeamPerf] = useState(teamPerfInit)
  const form = useZodForm(incidentSchema, {
    defaultValues: { description: "" }
  })
  const [feedback, setFeedback] = useState<string | null>(null)
  const { showToast } = useToast() || {}

  const exportRows = useMemo(() => ([
    ['Indicateur', 'Valeur'],
    ['Projet', projectName],
    ['Budget prevu', `${stats.budget.prevu}`],
    ['Budget reel', `${stats.budget.reel}`],
    ['Incidents en cours', `${stats.incidents}`],
    ['Retards', `${stats.retards}`],
    ['Performance equipes', `${stats.performance}%`],
    ['Genere le', new Date().toLocaleString()],
  ]), [projectName, stats.budget.prevu, stats.budget.reel, stats.incidents, stats.performance, stats.retards])

  const maxBudgetPoint = useMemo(
    () => Math.max(...budgetTrend.flatMap((point) => [point.prevu, point.reel]), 1),
    [budgetTrend]
  )

  const maxIncidentZone = useMemo(
    () => Math.max(...incidentByZone.map((item) => item.value), 1),
    [incidentByZone]
  )

  const maxDelayDays = useMemo(
    () => Math.max(...delayByLot.map((item) => item.days), 1),
    [delayByLot]
  )

  const budgetEcartPct = Math.round(((stats.budget.reel - stats.budget.prevu) / Math.max(stats.budget.prevu, 1)) * 100)
  const budgetConsoPct = Math.round((stats.budget.reel / Math.max(stats.budget.prevu, 1)) * 100)

  const totalIncidents = incidentBySeverity.reduce((sum, item) => sum + item.value, 0)
  const incidentsTrend = useMemo(
    () => [3, 4, 5, 4, stats.incidents, totalIncidents],
    [stats.incidents, totalIncidents]
  )

  const teamGlobalPerf = Math.round(
    teamPerf.reduce((sum, team) => sum + Math.round((team.productivite + team.qualite + team.securite) / 3), 0) /
      Math.max(teamPerf.length, 1)
  )

  const onSubmit = (values: IncidentForm) => {
    setStats(s => ({ ...s, incidents: s.incidents + 1, performance: Math.max(70, s.performance - 1) }))

    setIncidentBySeverity((prev) => {
      const next = [...prev]
      next[1] = { ...next[1], value: next[1].value + 1 }
      return next
    })

    setIncidentByZone((prev) => {
      const next = [...prev]
      next[0] = { ...next[0], value: next[0].value + 1 }
      return next
    })

    setDelayByLot((prev) => {
      const next = [...prev]
      next[0] = { ...next[0], days: next[0].days + 1 }
      return next
    })

    setBudgetTrend((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      next[next.length - 1] = { ...last, reel: last.reel + 250 }
      return next
    })

    void values
    setFeedback("Incident signalé !")
    form.reset()
    setTimeout(() => setFeedback(null), 2000)
  }

  const handleCsvExport = () => {
    downloadCsv('buildflow-pilotage.csv', exportRows)
    showToast?.('Export CSV genere', 'success')
  }

  const handleExcelExport = () => {
    downloadExcel('buildflow-pilotage.xls', 'Pilotage', exportRows)
    showToast?.('Export Excel genere', 'success')
  }

  const handlePdfExport = () => {
    openPrintPreview(`Rapport BuildFlow - ${projectName}`, [
      { label: 'Budget prevu', value: `${stats.budget.prevu.toLocaleString()} EUR` },
      { label: 'Budget reel', value: `${stats.budget.reel.toLocaleString()} EUR` },
      { label: 'Incidents', value: `${stats.incidents} en cours` },
      { label: 'Retards', value: `${stats.retards} taches` },
      { label: 'Performance equipes', value: `${stats.performance} %` },
    ])
    showToast?.('Apercu PDF ouvert', 'success')
  }

  return (
    <div className="space-y-6">
      <div className="bf-card-soft p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="bf-section-eyebrow text-xs font-black uppercase tracking-wide">Exports</p>
            <h3 className="bf-text-primary text-lg font-black">Rapports de pilotage</h3>
            <p className="bf-text-muted text-sm">Exportez les indicateurs du projet en CSV, Excel ou PDF imprimable.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={handleCsvExport}>Exporter CSV</Button>
            <Button type="button" variant="ghost" onClick={handleExcelExport}>Exporter Excel</Button>
            <Button type="button" onClick={handlePdfExport}>Exporter PDF</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Budget</div>
          <div className="bf-text-muted">Prévu : {stats.budget.prevu.toLocaleString()} €</div>
          <div className="bf-text-muted">Réel : <span className={stats.budget.reel > stats.budget.prevu ? 'bf-stat-value-danger' : 'bf-stat-value-success'}>{stats.budget.reel.toLocaleString()} €</span></div>
          <div className="mt-3">
            <div className="flex justify-between text-xs bf-text-muted"><span>Taux de consommation</span><span>{budgetConsoPct}%</span></div>
            <div className="h-2 rounded bg-slate-100 overflow-hidden mt-1">
              <div className={`h-full ${budgetConsoPct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(budgetConsoPct, 100)}%` }} />
            </div>
            <div className={`text-xs mt-1 font-semibold ${budgetEcartPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              Ecart budgetaire: {budgetEcartPct > 0 ? '+' : ''}{budgetEcartPct}%
            </div>
          </div>
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Incidents</div>
          <div className="bf-text-muted">{stats.incidents} en cours</div>
          <div className="mt-3 space-y-1">
            {incidentBySeverity.map((item) => {
              const pct = Math.round((item.value / Math.max(totalIncidents, 1)) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs"><span>{item.label}</span><span>{item.value}</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className={`h-full ${item.color}`} style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Retards</div>
          <div className="bf-text-muted">{stats.retards} tâches</div>
          <div className="mt-3 space-y-1 text-xs">
            {delayByLot.map((item) => {
              const pct = Math.round((item.days / maxDelayDays) * 100)
              return (
                <div key={item.lot}>
                  <div className="flex justify-between"><span>{item.lot}</span><span>{item.days} j</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Performance équipes</div>
          <div className="bf-text-muted">{stats.performance} %</div>
          <div className="mt-3 space-y-1 text-xs">
            {teamPerf.map((team) => {
              const perf = Math.round((team.productivite + team.qualite + team.securite) / 3)
              return (
                <div key={team.team}>
                  <div className="flex justify-between"><span>{team.team}</span><span>{perf}%</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${perf}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bf-card-soft p-4">
          <h4 className="bf-text-primary font-bold">Diagramme budget prevu vs reel (mensuel)</h4>
          <p className="bf-text-muted text-xs mb-3">Comparaison par mois pour suivre le depassement.</p>
          <div className="space-y-2">
            {budgetTrend.map((point) => (
              <div key={point.month}>
                <div className="flex justify-between text-xs"><span>{point.month}</span><span>{point.reel.toLocaleString()} / {point.prevu.toLocaleString()} €</span></div>
                <div className="h-2 rounded bg-slate-100 overflow-hidden mt-1 relative">
                  <div className="h-full bg-slate-400" style={{ width: `${Math.round((point.prevu / maxBudgetPoint) * 100)}%` }} />
                  <div className={`absolute top-0 h-full ${point.reel > point.prevu ? 'bg-red-500/80' : 'bg-emerald-500/80'}`} style={{ width: `${Math.round((point.reel / maxBudgetPoint) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bf-card-soft p-4">
          <h4 className="bf-text-primary font-bold">Diagramme tendance incidents</h4>
          <p className="bf-text-muted text-xs mb-3">Evolution glissante du volume d'incidents.</p>
          <div className="flex items-end gap-2 h-28">
            {incidentsTrend.map((value, index) => {
              const pct = Math.round((value / Math.max(...incidentsTrend, 1)) * 100)
              return (
                <div key={`${index}-${value}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-rose-500" style={{ height: `${Math.max(pct, 8)}%` }} />
                  <span className="text-[10px] bf-text-muted">S{index + 1}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bf-card-soft p-4">
          <h4 className="bf-text-primary font-bold">Diagramme incidents par zone</h4>
          <p className="bf-text-muted text-xs mb-3">Heat map operationnelle par zone chantier.</p>
          <div className="space-y-2">
            {incidentByZone.map((item) => {
              const pct = Math.round((item.value / maxIncidentZone) * 100)
              return (
                <div key={item.zone}>
                  <div className="flex justify-between text-xs"><span>{item.zone}</span><span>{item.value}</span></div>
                  <div className="h-3 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-fuchsia-500" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bf-card-soft p-4">
          <h4 className="bf-text-primary font-bold">Diagramme performance equipes detaillee</h4>
          <p className="bf-text-muted text-xs mb-3">Productivite, qualite, securite et charge.</p>
          <div className="space-y-3">
            {teamPerf.map((team) => (
              <div key={team.team} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold">{team.team}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <div className="flex justify-between"><span>Prod.</span><span>{team.productivite}%</span></div>
                    <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${team.productivite}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Qualite</span><span>{team.qualite}%</span></div>
                    <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${team.qualite}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Securite</span><span>{team.securite}%</span></div>
                    <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-violet-500" style={{ width: `${team.securite}%` }} /></div>
                  </div>
                  <div>
                    <div className="flex justify-between"><span>Charge</span><span>{team.charge}%</span></div>
                    <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${team.charge}%` }} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase bf-text-muted">Synthese budget</p>
          <p className="text-2xl font-black bf-text-primary">{budgetConsoPct}%</p>
          <p className="text-xs bf-text-muted">Consommation sur prevu</p>
        </div>
        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase bf-text-muted">Risque incidents</p>
          <p className="text-2xl font-black bf-text-primary">{totalIncidents}</p>
          <p className="text-xs bf-text-muted">Tous niveaux confondus</p>
        </div>
        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase bf-text-muted">Derive retards</p>
          <p className="text-2xl font-black bf-text-primary">{delayByLot.reduce((sum, item) => sum + item.days, 0)} j</p>
          <p className="text-xs bf-text-muted">Cumule lots critiques</p>
        </div>
        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase bf-text-muted">Perf equipes</p>
          <p className="text-2xl font-black bf-text-primary">{teamGlobalPerf}%</p>
          <p className="text-xs bf-text-muted">Moyenne productivite/qualite/securite</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-2 items-end max-w-md" aria-label="Signaler un incident">
        <div className="flex-1">
          <label htmlFor="description" className="bf-text-primary block text-sm font-medium">Nouvel incident</label>
          <input
            id="description"
            type="text"
            {...form.register("description")}
            className="bf-input mt-1 block w-full rounded-xl"
            required
          />
          {form.formState.errors.description && <p className="text-red-600 text-xs mt-1">{form.formState.errors.description.message}</p>}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner size={16} /> : "Signaler"}
        </Button>
        {feedback && <span className="bf-stat-value-success ml-2">{feedback}</span>}
      </form>
    </div>
  )
}

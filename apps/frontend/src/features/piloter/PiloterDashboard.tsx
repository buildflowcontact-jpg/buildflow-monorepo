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

export function PiloterDashboard({ projectName = 'Projet actif' }: { projectName?: string }) {
  const [stats, setStats] = useState(statsInit)
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

  const onSubmit = (values: IncidentForm) => {
    setStats(s => ({ ...s, incidents: s.incidents + 1 }))
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
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Incidents</div>
          <div className="bf-text-muted">{stats.incidents} en cours</div>
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Retards</div>
          <div className="bf-text-muted">{stats.retards} tâches</div>
        </div>
        <div className="bf-card-soft p-4">
          <div className="bf-text-primary font-bold text-lg">Performance équipes</div>
          <div className="bf-text-muted">{stats.performance} %</div>
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

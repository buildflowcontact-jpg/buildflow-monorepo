import React, { useState } from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"

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

export function PiloterDashboard() {
  const [stats, setStats] = useState(statsInit)
  const form = useZodForm(incidentSchema, {
    defaultValues: { description: "" }
  })
  const [feedback, setFeedback] = useState<string | null>(null)

  const onSubmit = (values: IncidentForm) => {
    setStats(s => ({ ...s, incidents: s.incidents + 1 }))
    setFeedback("Incident signalé !")
    form.reset()
    setTimeout(() => setFeedback(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded shadow p-4 border border-border">
          <div className="font-bold text-lg">Budget</div>
          <div>Prévu : {stats.budget.prevu.toLocaleString()} €</div>
          <div>Réel : <span className={stats.budget.reel > stats.budget.prevu ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>{stats.budget.reel.toLocaleString()} €</span></div>
        </div>
        <div className="bg-card rounded shadow p-4 border border-border">
          <div className="font-bold text-lg">Incidents</div>
          <div>{stats.incidents} en cours</div>
        </div>
        <div className="bg-card rounded shadow p-4 border border-border">
          <div className="font-bold text-lg">Retards</div>
          <div>{stats.retards} tâches</div>
        </div>
        <div className="bg-card rounded shadow p-4 border border-border">
          <div className="font-bold text-lg">Performance équipes</div>
          <div>{stats.performance} %</div>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-2 items-end max-w-md" aria-label="Signaler un incident">
        <div className="flex-1">
          <label htmlFor="description" className="block text-sm font-medium">Nouvel incident</label>
          <input
            id="description"
            type="text"
            {...form.register("description")}
            className="mt-1 block w-full rounded border border-border bg-background text-foreground focus:ring-primary focus:border-primary"
            required
          />
          {form.formState.errors.description && <p className="text-red-600 text-xs mt-1">{form.formState.errors.description.message}</p>}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner size={16} /> : "Signaler"}
        </Button>
        {feedback && <span className="text-green-600 ml-2">{feedback}</span>}
      </form>
    </div>
  )
}

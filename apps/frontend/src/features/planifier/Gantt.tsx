import React, { useMemo, useState } from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"

const taskSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  start: z.string().min(1, "Date de début requise"),
  end: z.string().min(1, "Date de fin requise"),
  primaryDependencyId: z.string().optional(),
  subDependencyId: z.string().optional(),
})
type TaskForm = z.infer<typeof taskSchema>

const initialTasks = [
  { id: 1, name: 'Terrassement', start: '2026-05-01', end: '2026-05-05', dependencies: [] },
  { id: 2, name: 'Fondations', start: '2026-05-06', end: '2026-05-10', dependencies: [1] },
  { id: 3, name: 'Élévation', start: '2026-05-11', end: '2026-05-20', dependencies: [2] },
  { id: 4, name: 'Toiture', start: '2026-05-21', end: '2026-05-25', dependencies: [3] },
]

export function Gantt() {
  const [tasks, setTasks] = useState(initialTasks)
  const form = useZodForm(taskSchema, {
    defaultValues: { name: "", start: "", end: "", primaryDependencyId: "", subDependencyId: "" }
  })

  const primaryDependencyId = form.watch('primaryDependencyId')

  const subDependencyOptions = useMemo(() => {
    const parentTask = tasks.find((task) => String(task.id) === primaryDependencyId)
    if (!parentTask) return []
    return parentTask.dependencies
      .map((depId: number) => tasks.find((task) => task.id === depId))
      .filter((task): task is typeof tasks[number] => Boolean(task))
  }, [primaryDependencyId, tasks])

  const chartData = useMemo(() => {
    const today = new Date()
    const total = tasks.length || 1
    const done = tasks.filter((task) => new Date(task.end) < today).length
    const inProgress = tasks.filter((task) => new Date(task.start) <= today && new Date(task.end) >= today).length
    const upcoming = Math.max(tasks.length - done - inProgress, 0)
    const maxDependencies = Math.max(...tasks.map((task) => task.dependencies.length), 1)

    return {
      done,
      inProgress,
      upcoming,
      donePct: Math.round((done / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      upcomingPct: Math.round((upcoming / total) * 100),
      maxDependencies,
    }
  }, [tasks])

  const onSubmit = (values: TaskForm) => {
    const dependencies: number[] = []
    if (values.primaryDependencyId) dependencies.push(Number(values.primaryDependencyId))
    if (values.subDependencyId) dependencies.push(Number(values.subDependencyId))

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        name: values.name,
        start: values.start,
        end: values.end,
        dependencies,
      }
    ])
    form.reset()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-2 items-end" aria-label="Ajouter une tâche">
        <div>
          <label htmlFor="name" className="bf-text-primary block text-sm font-medium">Nom</label>
          <input id="name" type="text" {...form.register("name")} className="bf-input mt-1 block w-full rounded-xl" required />
          {form.formState.errors.name && <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="start" className="bf-text-primary block text-sm font-medium">Début</label>
          <input id="start" type="date" {...form.register("start")} className="bf-input mt-1 block w-full rounded-xl" required />
          {form.formState.errors.start && <p className="text-red-600 text-xs mt-1">{form.formState.errors.start.message}</p>}
        </div>
        <div>
          <label htmlFor="end" className="bf-text-primary block text-sm font-medium">Fin</label>
          <input id="end" type="date" {...form.register("end")} className="bf-input mt-1 block w-full rounded-xl" required />
          {form.formState.errors.end && <p className="text-red-600 text-xs mt-1">{form.formState.errors.end.message}</p>}
        </div>
        <div>
          <label htmlFor="dependencies" className="bf-text-primary block text-sm font-medium">Dépendances</label>
          <select id="dependencies" {...form.register("primaryDependencyId")}
            className="bf-select mt-1 block w-full rounded-xl">
            <option value="">Aucune dépendance</option>
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sub-dependencies" className="bf-text-primary block text-sm font-medium">Sous-dépendance</label>
          <select
            id="sub-dependencies"
            {...form.register("subDependencyId")}
            className="bf-select mt-1 block w-full rounded-xl"
            disabled={!primaryDependencyId || subDependencyOptions.length === 0}
          >
            <option value="">Aucune sous-dépendance</option>
            {subDependencyOptions.map((task) => (
              <option key={task.id} value={task.id}>{task.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner size={16} /> : "Ajouter"}
        </Button>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="bf-card-soft p-3">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Avancement global</p>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-2">
            <div className="h-full bg-green-500" style={{ width: `${chartData.donePct}%` }} />
          </div>
          <p className="text-sm bf-text-primary font-semibold">{chartData.done}/{tasks.length} tâches terminées</p>
        </div>

        <div className="bf-card-soft p-3">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Répartition des tâches</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between"><span>Terminées</span><span>{chartData.donePct}%</span></div>
            <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${chartData.donePct}%` }} /></div>
            <div className="flex items-center justify-between"><span>En cours</span><span>{chartData.inProgressPct}%</span></div>
            <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${chartData.inProgressPct}%` }} /></div>
            <div className="flex items-center justify-between"><span>À venir</span><span>{chartData.upcomingPct}%</span></div>
            <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${chartData.upcomingPct}%` }} /></div>
          </div>
        </div>

        <div className="bf-card-soft p-3">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Intensité des dépendances</p>
          <div className="space-y-1">
            {tasks.slice(0, 5).map((task) => {
              const pct = Math.round((task.dependencies.length / chartData.maxDependencies) * 100)
              return (
                <div key={task.id}>
                  <div className="flex items-center justify-between text-xs"><span className="truncate max-w-[150px]">{task.name}</span><span>{task.dependencies.length}</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="bf-table min-w-full text-xs bf-text-primary">
          <thead>
            <tr>
              <th className="p-2">Tâche</th>
              <th className="p-2">Début</th>
              <th className="p-2">Fin</th>
              <th className="p-2">Dépendances</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="bf-table-row">
                <td className="p-2 font-bold">{task.name}</td>
                <td className="p-2">{task.start}</td>
                <td className="p-2">{task.end}</td>
                <td className="p-2">{task.dependencies.map((dep: number) => tasks.find(t => t.id === dep)?.name).filter(Boolean).join(' > ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

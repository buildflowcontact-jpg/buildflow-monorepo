import React, { useMemo, useState } from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"

const taskSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  start: z.string().min(1, "Date de début requise"),
  end: z.string().min(1, "Date de fin requise"),
  assigneesInput: z.string().min(1, "Ajoutez au moins une personne"),
})
type TaskForm = z.infer<typeof taskSchema>

type TaskNode = {
  id: number
  name: string
  start: string
  end: string
  assignees: string[]
  children: TaskNode[]
}

export type GanttMode = "normal" | "simplifie"

export interface ResourceConflict {
  assignee: string
  taskA: string
  taskB: string
  overlapStart: string
  overlapEnd: string
}

interface PlannedDelivery {
  id: string
  name: string
  date: string
}

const initialTasks: TaskNode[] = [
  {
    id: 1,
    name: "Terrassement",
    start: "2026-05-01",
    end: "2026-05-05",
    assignees: ["Ahmed", "Lina"],
    children: [
      {
        id: 2,
        name: "Piquetage",
        start: "2026-05-01",
        end: "2026-05-02",
        assignees: ["Ahmed"],
        children: [],
      },
    ],
  },
]

function flattenTree(nodes: TaskNode[], depth = 0): Array<TaskNode & { depth: number }> {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...flattenTree(node.children, depth + 1),
  ])
}

function insertChild(nodes: TaskNode[], parentId: number, child: TaskNode): TaskNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] }
    }
    return { ...node, children: insertChild(node.children, parentId, child) }
  })
}

function dayDiff(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime()
  return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0)
}

export function Gantt({
  mode = "normal",
  onConflictsChange,
  readOnly = false,
  plannedDeliveries = [],
}: {
  mode?: GanttMode
  onConflictsChange?: (conflicts: ResourceConflict[]) => void
  readOnly?: boolean
  plannedDeliveries?: PlannedDelivery[]
}) {
  const [tasks, setTasks] = useState<TaskNode[]>(initialTasks)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [parentForNewTask, setParentForNewTask] = useState<number | null>(null)
  const form = useZodForm(taskSchema, {
    defaultValues: { name: "", start: "", end: "", assigneesInput: "" }
  })

  const flatTasks = useMemo(() => {
    const base = flattenTree(tasks)
    if (plannedDeliveries.length === 0) return base

    const deliveriesAsTasks: Array<TaskNode & { depth: number }> = plannedDeliveries.map((delivery, index) => ({
      id: -(index + 1),
      name: delivery.name,
      start: delivery.date,
      end: delivery.date,
      assignees: ["Livraison"],
      children: [],
      depth: 0,
    }))

    return [...base, ...deliveriesAsTasks]
  }, [tasks, plannedDeliveries])

  const chartData = useMemo(() => {
    const today = new Date()
    const total = flatTasks.length || 1
    const done = flatTasks.filter((task) => new Date(task.end) < today).length
    const inProgress = flatTasks.filter((task) => new Date(task.start) <= today && new Date(task.end) >= today).length
    const upcoming = Math.max(flatTasks.length - done - inProgress, 0)
    const maxChildren = Math.max(...flatTasks.map((task) => task.children.length), 1)

    return {
      done,
      inProgress,
      upcoming,
      donePct: Math.round((done / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      upcomingPct: Math.round((upcoming / total) * 100),
      maxChildren,
    }
  }, [flatTasks])

  const selectedTask = flatTasks.find((task) => task.id === selectedTaskId) ?? null

  const simplifiedTimeline = useMemo(() => {
    if (flatTasks.length === 0) return []

    const starts = flatTasks.map((task) => new Date(task.start))
    const ends = flatTasks.map((task) => new Date(task.end))
    const minStart = new Date(Math.min(...starts.map((d) => d.getTime())))
    const maxEnd = new Date(Math.max(...ends.map((d) => d.getTime())))
    const totalSpan = Math.max(dayDiff(minStart, maxEnd), 1)

    return flatTasks.map((task) => {
      const start = new Date(task.start)
      const end = new Date(task.end)
      const offsetPct = Math.round((dayDiff(minStart, start) / totalSpan) * 100)
      const widthPct = Math.max(Math.round((Math.max(dayDiff(start, end), 1) / totalSpan) * 100), 4)
      return {
        ...task,
        offsetPct,
        widthPct,
      }
    })
  }, [flatTasks])

  const resourceConflicts = useMemo<ResourceConflict[]>(() => {
    const conflicts: ResourceConflict[] = []
    const seen = new Set<string>()

    for (let i = 0; i < flatTasks.length; i += 1) {
      for (let j = i + 1; j < flatTasks.length; j += 1) {
        const a = flatTasks[i]
        const b = flatTasks[j]
        const shared = a.assignees.filter((assignee) => b.assignees.includes(assignee))
        if (shared.length === 0) continue

        const aStart = new Date(a.start)
        const aEnd = new Date(a.end)
        const bStart = new Date(b.start)
        const bEnd = new Date(b.end)
        const overlapStart = new Date(Math.max(aStart.getTime(), bStart.getTime()))
        const overlapEnd = new Date(Math.min(aEnd.getTime(), bEnd.getTime()))
        if (overlapStart > overlapEnd) continue

        shared.forEach((assignee) => {
          const key = [assignee, a.id, b.id].join('|')
          if (seen.has(key)) return
          seen.add(key)
          conflicts.push({
            assignee,
            taskA: a.name,
            taskB: b.name,
            overlapStart: overlapStart.toISOString().slice(0, 10),
            overlapEnd: overlapEnd.toISOString().slice(0, 10),
          })
        })
      }
    }

    return conflicts
  }, [flatTasks])

  React.useEffect(() => {
    onConflictsChange?.(resourceConflicts)
  }, [onConflictsChange, resourceConflicts])

  const onSubmit = (values: TaskForm) => {
    const assignees = values.assigneesInput
      .split(",")
      .map((person) => person.trim())
      .filter(Boolean)

    if (assignees.length === 0) return

    const newNode: TaskNode = {
      id: Date.now(),
      name: values.name,
      start: values.start,
      end: values.end,
      assignees,
      children: [],
    }

    if (parentForNewTask === null) {
      setTasks((prev) => [...prev, newNode])
    } else {
      setTasks((prev) => insertChild(prev, parentForNewTask, newNode))
    }

    setParentForNewTask(null)
    form.reset()
  }

  const startRootTaskCreation = () => {
    setParentForNewTask(null)
    form.reset()
  }

  const startSubTaskCreation = (taskId: number) => {
    setSelectedTaskId(taskId)
    setParentForNewTask(taskId)
    form.reset()
  }

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm bf-text-muted">Cliquez sur une tâche pour préparer une sous-tâche.</p>
            <Button type="button" onClick={startRootTaskCreation}>Ajouter une tâche</Button>
          </div>

          {selectedTask ? (
            <div className="bf-card-soft p-3 text-xs">
              <span className="font-semibold">Tâche sélectionnée :</span> {selectedTask.name}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-3"
                onClick={() => startSubTaskCreation(selectedTask.id)}
              >
                Ajouter une sous-tâche
              </Button>
            </div>
          ) : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-2 items-end" aria-label="Ajouter une tâche ou sous-tâche">
            <div className="w-full text-xs bf-text-muted">
              {parentForNewTask === null ? "Création : tâche racine" : `Création : sous-tâche de l'élément ${parentForNewTask}`}
            </div>
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
              <label htmlFor="assigneesInput" className="bf-text-primary block text-sm font-medium">Personnes assignées</label>
              <input
                id="assigneesInput"
                type="text"
                {...form.register("assigneesInput")}
                className="bf-input mt-1 block w-full rounded-xl"
                placeholder="Ex: Ahmed, Lina, Marc"
                required
              />
              {form.formState.errors.assigneesInput && <p className="text-red-600 text-xs mt-1">{form.formState.errors.assigneesInput.message}</p>}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Spinner size={16} /> : parentForNewTask === null ? "Ajouter la tâche" : "Ajouter la sous-tâche"}
            </Button>
          </form>
        </>
      ) : null}

      {mode === "normal" && !readOnly ? (
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
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Intensité des sous-tâches</p>
          <div className="space-y-1">
            {flatTasks.slice(0, 5).map((task) => {
              const pct = Math.round((task.children.length / chartData.maxChildren) * 100)
              return (
                <div key={task.id}>
                  <div className="flex items-center justify-between text-xs"><span className="truncate max-w-[150px]">{task.name}</span><span>{task.children.length}</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      ) : null}

      {mode === "normal" && !readOnly ? (
      <div className="overflow-x-auto">
        <table className="bf-table min-w-full text-xs bf-text-primary">
          <thead>
            <tr>
              <th className="p-2">Tâche</th>
              <th className="p-2">Niveau</th>
              <th className="p-2">Début</th>
              <th className="p-2">Fin</th>
              <th className="p-2">Assignés</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {flatTasks.map(task => (
              <tr
                key={task.id}
                className={`bf-table-row cursor-pointer ${selectedTaskId === task.id ? "bg-blue-50" : ""}`}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <td className="p-2 font-bold" style={{ paddingLeft: `${task.depth * 16 + 8}px` }}>
                  {task.depth > 0 ? "↳ " : ""}{task.name}
                </td>
                <td className="p-2">{task.depth}</td>
                <td className="p-2">{task.start}</td>
                <td className="p-2">{task.end}</td>
                <td className="p-2">{task.assignees.join(", ")}</td>
                <td className="p-2">
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); startSubTaskCreation(task.id) }}>
                    + Sous-tâche
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : (
      <div className="bf-card-soft p-4 space-y-3">
        <p className="text-xs uppercase font-semibold bf-text-muted">Diagramme de Gantt simplifié</p>
        <div className="space-y-2">
          {simplifiedTimeline.map((task) => (
            <div key={task.id} className="grid grid-cols-[200px_1fr] gap-3 items-center">
              <button
                type="button"
                className="text-left text-xs font-semibold truncate"
                onClick={() => setSelectedTaskId(task.id)}
                title={task.name}
              >
                {task.depth > 0 ? "↳ " : ""}{task.name}
              </button>
              <div className="relative h-6 rounded bg-slate-100 overflow-hidden">
                <div
                  className="absolute top-1 h-4 rounded bg-blue-500 text-white text-[10px] px-1 flex items-center"
                  style={{ left: `${task.offsetPct}%`, width: `${task.widthPct}%` }}
                  title={`${task.start} -> ${task.end}`}
                >
                  {task.assignees.length > 1 ? `${task.assignees.length} pers.` : task.assignees[0]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}

import React, { useMemo, useState } from "react";
import { Gantt as GanttChart, Task as GanttTask, ViewMode as GanttViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useZodForm } from "@/hooks/useZodForm";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";

const taskSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  start: z.string().min(1, "Date de début requise"),
  end: z.string().min(1, "Date de fin requise"),
  assigneesInput: z.string().min(1, "Ajoutez au moins une personne"),
});
type TaskForm = z.infer<typeof taskSchema>;

type TaskNode = {
  id: string;
  name: string;
  start: string;
  end: string;
  assignees: string[];
  children: TaskNode[];
};

interface FlatTask extends TaskNode {
  depth: number;
  parentId?: string;
  kind: "task" | "delivery";
}

export type GanttMode = "normal" | "simplifie";

export interface ResourceConflict {
  assignee: string;
  taskA: string;
  taskB: string;
  overlapStart: string;
  overlapEnd: string;
}

interface PlannedDelivery {
  id: string;
  name: string;
  date: string;
}

const initialTasks: TaskNode[] = [
  {
    id: "1",
    name: "Terrassement",
    start: "2026-05-01",
    end: "2026-05-05",
    assignees: ["Ahmed", "Lina"],
    children: [
      {
        id: "2",
        name: "Piquetage",
        start: "2026-05-01",
        end: "2026-05-02",
        assignees: ["Ahmed"],
        children: [],
      },
    ],
  },
];

function flattenTree(nodes: TaskNode[], depth = 0, parentId?: string): FlatTask[] {
  return nodes.flatMap((node) => [
    { ...node, depth, parentId, kind: "task" },
    ...flattenTree(node.children, depth + 1, node.id),
  ]);
}

function insertChild(nodes: TaskNode[], parentId: string, child: TaskNode): TaskNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, child] };
    }
    return { ...node, children: insertChild(node.children, parentId, child) };
  });
}

export function Gantt({
  mode = "normal",
  onConflictsChange,
  readOnly = false,
  plannedDeliveries = [],
}: {
  mode?: GanttMode;
  onConflictsChange?: (conflicts: ResourceConflict[]) => void;
  readOnly?: boolean;
  plannedDeliveries?: PlannedDelivery[];
}) {
  const [tasks, setTasks] = useState<TaskNode[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [parentForNewTask, setParentForNewTask] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<"day" | "week" | "month">("week");

  // Keep mode prop for backward compatibility with older callers.
  void mode;

  const form = useZodForm(taskSchema, {
    defaultValues: { name: "", start: "", end: "", assigneesInput: "" },
  });

  const flatTasks = useMemo<FlatTask[]>(() => {
    const base = flattenTree(tasks)
    if (plannedDeliveries.length === 0) return base;

    const deliveriesAsTasks: FlatTask[] = plannedDeliveries.map((delivery) => ({
      id: `delivery-${delivery.id}`,
      name: delivery.name,
      start: delivery.date,
      end: delivery.date,
      assignees: ["Livraison"],
      children: [],
      depth: 0,
      kind: "delivery",
    }));

    return [...base, ...deliveriesAsTasks];
  }, [tasks, plannedDeliveries]);

  const selectedTask = flatTasks.find((task) => task.id === selectedTaskId) ?? null;

  const chartData = useMemo(() => {
    const today = new Date()
    const total = flatTasks.length || 1
    const done = flatTasks.filter((task) => new Date(task.end) < today).length
    const inProgress = flatTasks.filter((task) => new Date(task.start) <= today && new Date(task.end) >= today).length
    const upcoming = Math.max(flatTasks.length - done - inProgress, 0)
    const maxChildren = Math.max(...flatTasks.map((task) => task.children.length), 1);

    return {
      done,
      inProgress,
      upcoming,
      donePct: Math.round((done / total) * 100),
      inProgressPct: Math.round((inProgress / total) * 100),
      upcomingPct: Math.round((upcoming / total) * 100),
      maxChildren,
    };
  }, [flatTasks]);

  const ganttViewMode = useMemo(() => {
    if (zoomLevel === "day") return GanttViewMode.Day;
    if (zoomLevel === "month") return GanttViewMode.Month;
    return GanttViewMode.Week;
  }, [zoomLevel]);

  const ganttTasks = useMemo<GanttTask[]>(() => {
    const predecessorMap = new Map<string, string[]>();

    tasks.forEach((task, taskIndex) => {
      if (taskIndex > 0) {
        predecessorMap.set(task.id, [tasks[taskIndex - 1].id]);
      }

      if (task.children.length > 0) {
        predecessorMap.set(task.children[0].id, [task.id]);

        for (let childIndex = 1; childIndex < task.children.length; childIndex += 1) {
          predecessorMap.set(task.children[childIndex].id, [task.children[childIndex - 1].id]);
        }
      }
    });

    const progressByDate = (endDate: string): number => {
      const now = new Date();
      return new Date(endDate) < now ? 100 : 45;
    };

    const taskStyles = {
      backgroundColor: "#dbeafe",
      progressColor: "#2563eb",
      progressSelectedColor: "#1d4ed8",
    };

    const deliveryStyles = {
      backgroundColor: "#d1fae5",
      progressColor: "#10b981",
      progressSelectedColor: "#059669",
    };

    return flatTasks.map((item) => ({
      id: item.id,
      name: `${item.depth > 0 ? "↳ " : ""}${item.name}`,
      start: new Date(item.start),
      end: new Date(item.end),
      type: item.kind === "delivery" ? "milestone" : (item.depth === 0 ? "project" : "task"),
      progress: progressByDate(item.end),
      dependencies: predecessorMap.get(item.id) ?? [],
      project: item.parentId,
      hideChildren: false,
      styles: item.kind === "delivery" ? deliveryStyles : taskStyles,
      isDisabled: readOnly,
      displayOrder: item.depth,
    }));
  }, [flatTasks, readOnly, tasks]);

  const resourceConflicts = useMemo<ResourceConflict[]>(() => {
    const conflicts: ResourceConflict[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < flatTasks.length; i += 1) {
      for (let j = i + 1; j < flatTasks.length; j += 1) {
        const a = flatTasks[i];
        const b = flatTasks[j];
        const shared = a.assignees.filter((assignee) => b.assignees.includes(assignee));
        if (shared.length === 0) continue;

        const aStart = new Date(a.start);
        const aEnd = new Date(a.end);
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        const overlapStart = new Date(Math.max(aStart.getTime(), bStart.getTime()));
        const overlapEnd = new Date(Math.min(aEnd.getTime(), bEnd.getTime()));
        if (overlapStart > overlapEnd) continue;

        shared.forEach((assignee) => {
          const key = [assignee, a.id, b.id].join("|");
          if (seen.has(key)) return;
          seen.add(key);
          conflicts.push({
            assignee,
            taskA: a.name,
            taskB: b.name,
            overlapStart: overlapStart.toISOString().slice(0, 10),
            overlapEnd: overlapEnd.toISOString().slice(0, 10),
          });
        });
      }
    }

    return conflicts;
  }, [flatTasks]);

  React.useEffect(() => {
    onConflictsChange?.(resourceConflicts);
  }, [onConflictsChange, resourceConflicts]);

  const onSubmit = (values: TaskForm) => {
    const assignees = values.assigneesInput
      .split(",")
      .map((person) => person.trim())
    .filter(Boolean);

    if (assignees.length === 0) return;

    const newNode: TaskNode = {
      id: `task-${Date.now()}`,
      name: values.name,
      start: values.start,
      end: values.end,
      assignees,
      children: [],
    };

    if (parentForNewTask === null) {
      setTasks((prev) => [...prev, newNode]);
    } else {
      setTasks((prev) => insertChild(prev, parentForNewTask, newNode));
    }

    setParentForNewTask(null);
    form.reset();
  };

  const startRootTaskCreation = () => {
    setParentForNewTask(null);
    form.reset();
  };

  const startSubTaskCreation = (taskId: string) => {
    setSelectedTaskId(taskId);
    setParentForNewTask(taskId);
    form.reset();
  };

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

      {!readOnly ? (
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

      <div className="bf-card-soft p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase font-semibold bf-text-muted">Diagramme de Gantt</p>
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setZoomLevel("day")}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${zoomLevel === "day" ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
            >
              Jour
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("week")}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${zoomLevel === "week" ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("month")}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${zoomLevel === "month" ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
            >
              Mois
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
          {ganttTasks.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Aucune tâche à afficher.</div>
          ) : (
            <div className="p-2 [&_.bar-label]:fill-white [&_.calendar-bottom-text]:fill-slate-500 [&_.calendar-top-text]:fill-slate-500 [&_.grid-header]:fill-slate-100 [&_.grid-row]:fill-white">
              <GanttChart
                tasks={ganttTasks}
                viewMode={ganttViewMode}
                listCellWidth="300px"
                rowHeight={48}
                columnWidth={zoomLevel === "day" ? 44 : zoomLevel === "week" ? 56 : 90}
                barCornerRadius={6}
                barFill={68}
                todayColor="rgba(37,99,235,0.12)"
                onSelect={(selected) => setSelectedTaskId(selected.id)}
                onDateChange={() => false}
                onProgressChange={() => false}
                onDoubleClick={(selected) => {
                  const found = flatTasks.find((task) => task.id === selected.id);
                  if (found?.kind === "task" && !readOnly) {
                    startSubTaskCreation(found.id);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

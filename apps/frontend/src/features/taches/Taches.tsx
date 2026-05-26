import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock3, Filter, GripVertical, ListFilter, Play, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface SubTask {
  id: string;
  code: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
}

interface Task {
  id: string;
  code: string;
  title: string;
  description: string;
  assignee: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  subTasks: SubTask[];
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    code: '01',
    title: 'Preparer la zone de coulage',
    description: 'Verifier les acces et installer la signaletique.',
    assignee: 'Julien Martin',
    startDate: '2026-05-10',
    dueDate: '2026-05-15',
    status: 'todo',
    priority: 'high',
    subTasks: [
      {
        id: 'st-1-1',
        code: '01.1',
        title: 'Nettoyage de la zone',
        status: 'done',
        priority: 'low',
        assignee: 'Marc Dubois',
        dueDate: '2026-05-08',
      },
      {
        id: 'st-1-2',
        code: '01.2',
        title: 'Mise en place des coffrages',
        status: 'in_progress',
        priority: 'medium',
        assignee: 'Sophie Bernard',
        dueDate: '2026-05-12',
      },
      {
        id: 'st-1-3',
        code: '01.3',
        title: 'Verification niveaux et cotes',
        status: 'todo',
        priority: 'medium',
        assignee: 'Thomas Petit',
        dueDate: '2026-05-15',
      },
    ],
  },
  {
    id: 't-2',
    code: '02',
    title: 'Controle ferraillage niveau -1',
    description: 'Point de controle qualite avant coulage.',
    assignee: 'Sophie Bernard',
    startDate: '2026-05-12',
    dueDate: '2026-05-18',
    status: 'in_progress',
    priority: 'medium',
    subTasks: [
      {
        id: 'st-2-1',
        code: '02.1',
        title: 'Controle implantation',
        status: 'in_progress',
        priority: 'medium',
        assignee: 'Thomas Petit',
        dueDate: '2026-05-16',
      },
      {
        id: 'st-2-2',
        code: '02.2',
        title: 'Controle ligaturage',
        status: 'todo',
        priority: 'low',
        assignee: 'Marc Dubois',
        dueDate: '2026-05-18',
      },
    ],
  },
  {
    id: 't-3',
    code: '03',
    title: 'Validation plan de reservation',
    description: 'Validation finale avec bureau methodes.',
    assignee: 'Thomas Petit',
    startDate: '2026-05-05',
    dueDate: '2026-05-12',
    status: 'done',
    priority: 'medium',
    subTasks: [
      {
        id: 'st-3-1',
        code: '03.1',
        title: 'Transmission au BE',
        status: 'done',
        priority: 'low',
        assignee: 'Thomas Petit',
        dueDate: '2026-05-12',
      },
    ],
  },
  {
    id: 't-4',
    code: '04',
    title: 'Livraison armatures',
    description: 'Attente confirmation transporteur et reception chantier.',
    assignee: 'Marc Dubois',
    startDate: '2026-05-17',
    dueDate: '2026-05-22',
    status: 'waiting',
    priority: 'low',
    subTasks: [],
  },
];

const STATUS_TITLE: Record<TaskStatus, string> = {
  todo: 'A faire',
  in_progress: 'En cours',
  waiting: 'En attente',
  done: 'Terminee',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  waiting: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

const PRIORITY_TITLE: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

type ViewMode = 'list' | 'tree' | 'gantt';
type ZoomLevel = 'day' | 'week' | 'month';

interface DragState {
  taskId: string;
  subTaskId: string;
}
interface GanttRow {
  id: string;
  code: string;
  label: string;
  assignee: string;
  status: TaskStatus;
  level: 0 | 1;
  startDate: string;
  dueDate: string;
  parentTaskId?: string;
  parentTaskTitle?: string;
}

export function Taches() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>(INITIAL_TASKS.map((task) => task.id));
  const [draggedSubTask, setDraggedSubTask] = useState<DragState | null>(null);
  const [selectedGanttItem, setSelectedGanttItem] = useState<GanttRow | null>(null);
  const ganttWrapRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignee('');
    setStartDate('');
    setDueDate('');
    setPriority('medium');
    setStatus('todo');
  };

  const openTaskModal = (task: Task) => {
    setSelectedTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setAssignee(task.assignee);
    setStartDate(task.startDate);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setStatus(task.status);
  };

  const closeTaskModal = () => {
    setSelectedTaskId(null);
    resetForm();
  };

  const saveTask = () => {
    if (!selectedTaskId || !title.trim() || !assignee.trim() || !startDate || !dueDate) return;
    setTasks((prev) => prev.map((task) => (
      task.id === selectedTaskId
        ? {
            ...task,
            title: title.trim(),
            description: description.trim(),
            assignee: assignee.trim(),
            startDate,
            dueDate,
            priority,
            status,
          }
        : task
    )));
    closeTaskModal();
  };

  const deleteTask = () => {
    if (!selectedTaskId) return;
    setTasks((prev) => prev.filter((task) => task.id !== selectedTaskId));
    closeTaskModal();
  };

  const createTask = () => {
    if (!title.trim() || !assignee.trim() || !startDate || !dueDate) return;
    const nextCode = String(tasks.length + 1).padStart(2, '0');
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        code: nextCode,
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim(),
        startDate,
        dueDate,
        priority,
        status,
        subTasks: [],
      },
      ...prev,
    ]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const toggleExpandedTask = (taskId: string) => {
    setExpandedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
  };

  const moveSubTask = (sourceTaskId: string, sourceSubTaskId: string, targetTaskId: string, targetSubTaskId: string) => {
    if (sourceTaskId !== targetTaskId) return;
    setTasks((prev) => prev.map((task) => {
      if (task.id !== sourceTaskId) return task;

      const sourceIndex = task.subTasks.findIndex((subTask) => subTask.id === sourceSubTaskId);
      const targetIndex = task.subTasks.findIndex((subTask) => subTask.id === targetSubTaskId);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return task;

      const nextSubTasks = [...task.subTasks];
      const [moved] = nextSubTasks.splice(sourceIndex, 1);
      nextSubTasks.splice(targetIndex, 0, moved);

      return {
        ...task,
        subTasks: nextSubTasks.map((subTask, index) => ({
          ...subTask,
          code: `${task.code}.${index + 1}`,
        })),
      };
    }));
  };

  const assigneeOptions = useMemo(
    () => [...new Set(tasks.flatMap((task) => [task.assignee, ...task.subTasks.map((subTask) => subTask.assignee)]))],
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const parentMatch =
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.code.toLowerCase().includes(normalizedSearch) ||
        task.assignee.toLowerCase().includes(normalizedSearch);

      const hasMatchingSubTask = task.subTasks.some((subTask) =>
        subTask.title.toLowerCase().includes(normalizedSearch) ||
        subTask.code.toLowerCase().includes(normalizedSearch) ||
        subTask.assignee.toLowerCase().includes(normalizedSearch)
      );

      const statusOk = statusFilter === 'all' || task.status === statusFilter || task.subTasks.some((subTask) => subTask.status === statusFilter);
      const priorityOk = priorityFilter === 'all' || task.priority === priorityFilter || task.subTasks.some((subTask) => subTask.priority === priorityFilter);
      const assigneeOk = assigneeFilter === 'all' || task.assignee === assigneeFilter || task.subTasks.some((subTask) => subTask.assignee === assigneeFilter);
      const searchOk = !normalizedSearch || parentMatch || hasMatchingSubTask;

      return statusOk && priorityOk && assigneeOk && searchOk;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  const allItems = useMemo(() => tasks.flatMap((task) => [task, ...task.subTasks]), [tasks]);

  const metrics = useMemo(() => {
    const countByStatus = (value: TaskStatus) => allItems.filter((item) => item.status === value).length;
    return {
      total: allItems.length,
      todo: countByStatus('todo'),
      inProgress: countByStatus('in_progress'),
      waiting: countByStatus('waiting'),
      done: countByStatus('done'),
    };
  }, [allItems]);

  const metricCards = [
    { label: 'Total taches', value: metrics.total, ratio: '100%', icon: <CheckCircle2 size={16} className="text-slate-500" /> },
    {
      label: 'A faire',
      value: metrics.todo,
      ratio: `${Math.round((metrics.todo / Math.max(metrics.total, 1)) * 100)}%`,
      icon: <CircleDot size={16} className="text-blue-600" />,
    },
    {
      label: 'En cours',
      value: metrics.inProgress,
      ratio: `${Math.round((metrics.inProgress / Math.max(metrics.total, 1)) * 100)}%`,
      icon: <Play size={16} className="text-violet-600" />,
    },
    {
      label: 'En attente',
      value: metrics.waiting,
      ratio: `${Math.round((metrics.waiting / Math.max(metrics.total, 1)) * 100)}%`,
      icon: <Clock3 size={16} className="text-amber-600" />,
    },
    {
      label: 'Terminees',
      value: metrics.done,
      ratio: `${Math.round((metrics.done / Math.max(metrics.total, 1)) * 100)}%`,
      icon: <CheckCircle2 size={16} className="text-emerald-600" />,
    },
  ];

  const formatDueDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getInitials = (fullName: string) =>
    fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

  const treeByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      waiting: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const ganttRows = useMemo(() => {
    const rows: Array<{
      id: string;
      code: string;
      label: string;
      assignee: string;
      status: TaskStatus;
      level: 0 | 1;
      startDate: string;
      dueDate: string;
      parentTaskId?: string;
    }> = [];

    filteredTasks.forEach((task) => {
      rows.push({
        id: task.id,
        code: task.code,
        label: task.title,
        assignee: task.assignee,
        status: task.status,
        level: 0,
        startDate: task.startDate,
        dueDate: task.dueDate,
      });

      task.subTasks.forEach((subTask, index) => {
        const taskStart = new Date(task.startDate);
        taskStart.setDate(taskStart.getDate() + Math.min(index, 2));

        rows.push({
          id: subTask.id,
          code: subTask.code,
          label: subTask.title,
          assignee: subTask.assignee,
          status: subTask.status,
          level: 1,
          startDate: taskStart.toISOString().slice(0, 10),
          dueDate: subTask.dueDate,
          parentTaskId: task.id,
          parentTaskTitle: task.title,
        });
      });
    });

    return rows;
  }, [filteredTasks]);

  const ganttScale = useMemo(() => {
    if (ganttRows.length === 0) {
      return null;
    }

    const starts = ganttRows.map((row) => new Date(row.startDate).getTime());
    const ends = ganttRows.map((row) => new Date(row.dueDate).getTime());
    const minTs = Math.min(...starts);
    const maxTs = Math.max(...ends);
    const dayMs = 24 * 60 * 60 * 1000;
    const unitDays = zoomLevel === 'day' ? 1 : zoomLevel === 'week' ? 7 : 30;
    const totalDays = Math.max(1, Math.round((maxTs - minTs) / dayMs) + 1);
    const totalUnits = Math.max(1, Math.ceil(totalDays / unitDays));

    const ticks = Array.from({ length: totalUnits }, (_, index) => {
      const tickDate = new Date(minTs + index * unitDays * dayMs);
      const label = zoomLevel === 'month'
        ? tickDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
        : zoomLevel === 'week'
          ? `S${Math.floor(index) + 1}`
          : tickDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      return {
        key: tickDate.toISOString(),
        label,
        isMajor: index === 0 || (zoomLevel === 'day' ? tickDate.getDay() === 1 : true),
      };
    });

    const toPercent = (date: string) => {
      const ts = new Date(date).getTime();
      const days = (ts - minTs) / dayMs;
      return (days / totalDays) * 100;
    };

    const unitLabel = zoomLevel === 'day' ? 'Jour' : zoomLevel === 'week' ? 'Semaine' : 'Mois';

    return { ticks, totalDays, toPercent, dayMs, minTs, unitDays, unitLabel };
  }, [ganttRows, zoomLevel]);

  const ganttDependencies = useMemo(() => {
    const dependencies: Array<{
      id: string;
      fromRowId: string;
      toRowId: string;
      fromLeft: number;
      fromTop: number;
      toLeft: number;
      toTop: number;
    }> = [];

    if (!ganttScale) return dependencies;

    const rowHeight = 56;
    const rowGap = 1;
    const rowCenter = (index: number) => index * (rowHeight + rowGap) + rowHeight / 2;
    const rowMap = new Map(ganttRows.map((row, index) => [row.id, { row, index }]));
    const addDependency = (sourceId: string, targetId: string) => {
      const source = rowMap.get(sourceId);
      const target = rowMap.get(targetId);
      if (!source || !target) return;

      dependencies.push({
        id: `${sourceId}-${targetId}`,
        fromRowId: sourceId,
        toRowId: targetId,
        fromLeft: ganttScale.toPercent(source.row.dueDate),
        fromTop: rowCenter(source.index),
        toLeft: ganttScale.toPercent(target.row.startDate),
        toTop: rowCenter(target.index),
      });
    };

    filteredTasks.forEach((task, index) => {
      if (task.subTasks.length > 0) {
        addDependency(task.id, task.subTasks[0].id);

        for (let subTaskIndex = 0; subTaskIndex < task.subTasks.length - 1; subTaskIndex += 1) {
          addDependency(task.subTasks[subTaskIndex].id, task.subTasks[subTaskIndex + 1].id);
        }
      }

      const nextTask = filteredTasks[index + 1];
      if (nextTask) {
        const sourceId = task.subTasks.length > 0 ? task.subTasks[task.subTasks.length - 1].id : task.id;
        const targetId = nextTask.subTasks.length > 0 ? nextTask.subTasks[0].id : nextTask.id;
        addDependency(sourceId, targetId);
      }
    });

    return dependencies;
  }, [ganttRows, ganttScale, filteredTasks]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="bf-text-primary font-black text-2xl mb-1">Taches & Sous-taches</h2>
          <p className="bf-text-muted">Cliquez sur une tache pour ouvrir son detail complet.</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
        >
          + Creer une tache
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
        <div className="grid gap-3 md:grid-cols-5">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {card.icon}
                <span>{card.label}</span>
              </div>
              <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500">{card.ratio}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 md:p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 font-semibold ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
            >
              Liste
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`rounded-lg px-3 py-1.5 font-semibold ${viewMode === 'tree' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
            >
              Arborescence
            </button>
            <button
              type="button"
              onClick={() => setViewMode('gantt')}
              className={`rounded-lg px-3 py-1.5 font-semibold ${viewMode === 'gantt' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
            >
              Gantt
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400"
                placeholder="Rechercher une tache..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
            >
              <option value="all">Statut</option>
              <option value="todo">A faire</option>
              <option value="in_progress">En cours</option>
              <option value="waiting">En attente</option>
              <option value="done">Terminee</option>
            </select>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
            >
              <option value="all">Priorite</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
            >
              <option value="all">Responsable</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>

            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
              <Filter size={14} />
              Filtres
            </button>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
              <ListFilter size={14} />
            </button>

            {viewMode === 'gantt' ? (
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel('day')}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold ${zoomLevel === 'day' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                >
                  <ZoomIn size={12} />
                  Jour
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('week')}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold ${zoomLevel === 'week' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                >
                  <ZoomIn size={12} />
                  Semaine
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel('month')}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold ${zoomLevel === 'month' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                >
                  <ZoomOut size={12} />
                  Mois
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Tache</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Priorite</th>
                  <th className="px-4 py-3 text-left">Responsable</th>
                  <th className="px-4 py-3 text-left">Echeance</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const isExpanded = expandedTaskIds.includes(task.id);
                  return (
                    <React.Fragment key={task.id}>
                      <tr className="border-t border-slate-100 bg-white hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => toggleExpandedTask(task.id)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <button type="button" onClick={() => openTaskModal(task)} className="text-left">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">{task.code}</span>
                                <div>
                                  <p className="font-bold text-slate-800">{task.title}</p>
                                  <p className="text-xs text-slate-500">{task.subTasks.length} sous-tache{task.subTasks.length > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${STATUS_BADGE[task.status]}`}>{STATUS_TITLE[task.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                            {PRIORITY_TITLE[task.priority]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{getInitials(task.assignee)}</span>
                            <span className="text-slate-700">{task.assignee}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <CalendarDays size={13} />
                            {formatDueDate(task.dueDate)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">...</td>
                      </tr>

                      {isExpanded ? task.subTasks.map((subTask) => (
                        <tr key={subTask.id} className="border-t border-slate-100 bg-slate-50/40">
                          <td className="px-4 py-3">
                            <div className="ml-7 flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400">{subTask.code}</span>
                              <span className="text-slate-700">{subTask.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${STATUS_BADGE[subTask.status]}`}>{STATUS_TITLE[subTask.status]}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[subTask.priority]}`} />
                              {PRIORITY_TITLE[subTask.priority]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{getInitials(subTask.assignee)}</span>
                              <span className="text-slate-700">{subTask.assignee}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <CalendarDays size={13} />
                              {formatDueDate(subTask.dueDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">...</td>
                        </tr>
                      )) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {viewMode === 'tree' ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 md:p-4 space-y-4">
            {(['todo', 'in_progress', 'waiting', 'done'] as TaskStatus[]).map((statusKey) => {
              const bucket = treeByStatus[statusKey];
              return (
                <section key={statusKey} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${STATUS_BADGE[statusKey]}`}>{STATUS_TITLE[statusKey]}</span>
                      <span className="text-xs font-semibold text-slate-500">{bucket.length} tache{bucket.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {bucket.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune tache dans cette categorie.</p>
                  ) : (
                    <ul className="space-y-2">
                      {bucket.map((task) => {
                        const isExpanded = expandedTaskIds.includes(task.id);
                        return (
                          <li key={task.id} className="rounded-lg border border-slate-100 bg-slate-50/60">
                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                              <button type="button" onClick={() => toggleExpandedTask(task.id)} className="flex items-center gap-2 text-left">
                                {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                                <span className="text-xs font-bold text-slate-400">{task.code}</span>
                                <span className="font-semibold text-slate-800">{task.title}</span>
                              </button>

                              <div className="inline-flex items-center gap-3">
                                <span className="text-xs text-slate-500">{task.subTasks.length} sous-tache{task.subTasks.length > 1 ? 's' : ''}</span>
                                <button type="button" onClick={() => openTaskModal(task)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-white">
                                  Ouvrir
                                </button>
                              </div>
                            </div>

                            {isExpanded && task.subTasks.length > 0 ? (
                              <div className="border-t border-slate-200 bg-white px-3 py-2">
                                <ul className="space-y-1.5">
                                  {task.subTasks.map((subTask) => (
                                    <li
                                      key={subTask.id}
                                      className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-2 py-1.5"
                                      draggable
                                      onDragStart={() => setDraggedSubTask({ taskId: task.id, subTaskId: subTask.id })}
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={() => {
                                        if (draggedSubTask) {
                                          moveSubTask(draggedSubTask.taskId, draggedSubTask.subTaskId, task.id, subTask.id);
                                          setDraggedSubTask(null);
                                        }
                                      }}
                                    >
                                      <div className="inline-flex items-center gap-2">
                                        <span className="cursor-grab text-slate-400"><GripVertical size={14} /></span>
                                        <span className="text-xs font-bold text-slate-400">{subTask.code}</span>
                                        <span className="text-sm text-slate-700">{subTask.title}</span>
                                      </div>
                                      <div className="inline-flex items-center gap-2">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[subTask.status]}`}>{STATUS_TITLE[subTask.status]}</span>
                                        <span className="text-xs text-slate-500">{subTask.assignee}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        ) : null}

        {viewMode === 'gantt' ? (
          <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            {ganttRows.length === 0 || !ganttScale ? (
              <div className="p-8 text-center text-sm font-semibold text-slate-500">Aucune donnee a afficher pour ce filtre.</div>
            ) : (
              <div className="overflow-auto" ref={ganttWrapRef}>
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[320px_1fr] border-b border-slate-200 bg-slate-50">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tache</div>
                    <div className="relative h-10 px-2">
                      <div className="flex h-full items-end">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Zoom {ganttScale.unitLabel}</span>
                      </div>
                      {ganttScale.ticks.map((tick, index) => (
                        <div
                          key={`tick-${tick.key}`}
                          className={`absolute top-0 h-full ${tick.isMajor ? 'border-l border-slate-300' : 'border-l border-slate-200'}`}
                          style={{ left: `${(index / ganttScale.totalDays) * 100}%` }}
                        >
                          {tick.isMajor ? <span className="ml-1 text-[10px] font-semibold text-slate-500">{tick.label}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    {ganttDependencies.length > 0 ? (
                      <svg className="pointer-events-none absolute bottom-0 left-[320px] right-0 top-0 z-10" viewBox={`0 0 100 ${Math.max(1, ganttRows.length * 57)}`} preserveAspectRatio="none">
                        <defs>
                          <marker id="dependency-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
                          </marker>
                        </defs>
                        {ganttDependencies.map((dependency) => (
                          (() => {
                            const elbowBase = dependency.toLeft >= dependency.fromLeft
                              ? dependency.fromLeft + 3
                              : dependency.fromLeft - 3;
                            const elbow = Math.max(1, Math.min(99, elbowBase));
                            return (
                              <path
                                key={dependency.id}
                                d={`M ${dependency.fromLeft} ${dependency.fromTop} L ${elbow} ${dependency.fromTop} L ${elbow} ${dependency.toTop} L ${dependency.toLeft} ${dependency.toTop}`}
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="0.9"
                                strokeDasharray="1.5 1.5"
                                markerEnd="url(#dependency-arrow)"
                              />
                            );
                          })()
                        ))}
                      </svg>
                    ) : null}

                    {ganttRows.map((row, index) => {
                      const left = ganttScale.toPercent(row.startDate);
                      const right = ganttScale.toPercent(row.dueDate);
                      const width = Math.max(1.5, right - left);
                      const barTop = 12;

                      return (
                        <div key={row.id} className="grid grid-cols-[320px_1fr] border-b border-slate-100">
                          <div className={`px-4 py-2.5 ${row.level === 1 ? 'pl-9 bg-slate-50/60' : 'bg-white'}`}>
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">{row.code}</span>
                              <span className={`text-sm ${row.level === 0 ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>{row.label}</span>
                            </div>
                            <p className="text-xs text-slate-500">{row.assignee}</p>
                          </div>

                          <div className="relative h-14 px-2">
                            {ganttScale.ticks.map((tick, tickIndex) => (
                              <div
                                key={`grid-${row.id}-${tick.key}`}
                                className="absolute top-0 h-full border-l border-slate-100"
                                style={{ left: `${(tickIndex / ganttScale.totalDays) * 100}%` }}
                              />
                            ))}

                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setSelectedGanttItem(row)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedGanttItem(row);
                                }
                              }}
                              className={`absolute cursor-pointer rounded-full px-2 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-[1.01] ${row.status === 'done' ? 'bg-emerald-500' : row.status === 'in_progress' ? 'bg-violet-500' : row.status === 'waiting' ? 'bg-amber-500' : 'bg-blue-500'}`}
                              style={{ left: `${left}%`, top: `${barTop}px`, width: `${width}%`, height: '26px' }}
                            >
                              <div className="flex h-full items-center justify-between gap-2">
                                <span className="truncate leading-none">{STATUS_TITLE[row.status]}</span>
                                <span className="hidden text-[10px] font-semibold uppercase opacity-80 md:inline">{row.level === 0 ? 'Parent' : 'Sous-tache'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {selectedGanttItem ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="bf-text-primary font-black text-xl">Element Gantt</h3>
                <p className="text-sm bf-text-muted">Detail de la tache selectionnee dans le diagramme.</p>
              </div>
              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${STATUS_BADGE[selectedGanttItem.status]}`}>
                {STATUS_TITLE[selectedGanttItem.status]}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Code</p>
                <p className="font-semibold text-slate-800">{selectedGanttItem.code}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Intitule</p>
                <p className="font-semibold text-slate-800">{selectedGanttItem.label}</p>
              </div>
              {selectedGanttItem.level === 1 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Tache parente</p>
                  <p className="font-semibold text-slate-800">{selectedGanttItem.parentTaskTitle ?? 'Non renseignee'}</p>
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Responsable</p>
                  <p className="font-semibold text-slate-800">{selectedGanttItem.assignee}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Type</p>
                  <p className="font-semibold text-slate-800">{selectedGanttItem.level === 0 ? 'Tache parente' : 'Sous-tache'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Debut</p>
                  <p className="font-semibold text-slate-800">{formatDueDate(selectedGanttItem.startDate)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Echeance</p>
                  <p className="font-semibold text-slate-800">{formatDueDate(selectedGanttItem.dueDate)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {selectedGanttItem.level === 0 ? (
                <Button
                  type="button"
                  onClick={() => {
                    const task = tasks.find((item) => item.id === selectedGanttItem.id);
                    if (task) {
                      openTaskModal(task);
                    }
                    setSelectedGanttItem(null);
                  }}
                >
                  Ouvrir en edition
                </Button>
              ) : null}
              <Button type="button" variant="ghost" onClick={() => setSelectedGanttItem(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <h3 className="bf-text-primary font-black text-xl">Creer une nouvelle tache</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label htmlFor="task-title" className="text-sm font-medium bf-text-primary">Titre</label>
                <input id="task-title" className="bf-input mt-1 w-full" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="task-description" className="text-sm font-medium bf-text-primary">Description</label>
                <textarea id="task-description" className="bf-textarea mt-1 w-full rounded-xl px-3 py-2" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div>
                <label htmlFor="task-assignee" className="text-sm font-medium bf-text-primary">Affectation</label>
                <input id="task-assignee" className="bf-input mt-1 w-full" value={assignee} onChange={(event) => setAssignee(event.target.value)} />
              </div>
              <div>
                <label htmlFor="task-priority" className="text-sm font-medium bf-text-primary">Priorite</label>
                <select id="task-priority" className="bf-select mt-1 w-full rounded-xl px-3 py-2" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-status" className="text-sm font-medium bf-text-primary">Statut</label>
                <select id="task-status" className="bf-select mt-1 w-full rounded-xl px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                  <option value="todo">A faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="done">Terminee</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-start-date" className="text-sm font-medium bf-text-primary">Date debut</label>
                <input id="task-start-date" type="date" className="bf-input mt-1 w-full" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div>
                <label htmlFor="task-date" className="text-sm font-medium bf-text-primary">Echeance</label>
                <input id="task-date" type="date" className="bf-input mt-1 w-full" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
              <Button type="button" onClick={createTask}>Creer</Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedTask ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="bf-text-primary font-black text-xl">Detail tache</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label htmlFor="edit-task-title" className="text-sm font-medium bf-text-primary">Titre</label>
                <input id="edit-task-title" className="bf-input mt-1 w-full" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="edit-task-description" className="text-sm font-medium bf-text-primary">Description</label>
                <textarea id="edit-task-description" className="bf-textarea mt-1 w-full rounded-xl px-3 py-2" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-assignee" className="text-sm font-medium bf-text-primary">Affectation</label>
                <input id="edit-task-assignee" className="bf-input mt-1 w-full" value={assignee} onChange={(event) => setAssignee(event.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-status" className="text-sm font-medium bf-text-primary">Statut</label>
                <select id="edit-task-status" className="bf-select mt-1 w-full rounded-xl px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
                  <option value="todo">A faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="done">Terminee</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-task-start-date" className="text-sm font-medium bf-text-primary">Date debut</label>
                <input id="edit-task-start-date" type="date" className="bf-input mt-1 w-full" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-date" className="text-sm font-medium bf-text-primary">Echeance</label>
                <input id="edit-task-date" type="date" className="bf-input mt-1 w-full" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-sm font-semibold bf-text-primary">Sous-taches</p>
              <ul className="pl-1 mt-2 space-y-1">
                {selectedTask.subTasks.map((subTask) => (
                  <li key={subTask.id} className="flex items-center justify-between gap-3 text-sm rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    <span className="font-medium text-slate-700">{subTask.code} · {subTask.title}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${STATUS_BADGE[subTask.status]}`}>{STATUS_TITLE[subTask.status]}</span>
                  </li>
                ))}
                {selectedTask.subTasks.length === 0 ? <li className="text-xs bf-text-muted">Aucune sous-tache.</li> : null}
              </ul>
            </div>

            <div className="flex justify-between gap-2">
              <Button type="button" variant="destructive" onClick={deleteTask}>Supprimer</Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={closeTaskModal}>Fermer</Button>
                <Button type="button" onClick={saveTask}>Enregistrer</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

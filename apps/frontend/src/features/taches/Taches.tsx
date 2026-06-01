import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Clock3, Filter, ListFilter, Play, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportTasksToCSV } from './exportTasksToCSV';
import { exportTasksToPDF } from './exportTasksToPDF';
import { useToast } from '@/ui/ToastProvider';
import { BodyPortal } from '@/components/ui/BodyPortal';
import { useAuth } from '@/modules/chantier/hooks/useAuth';
import { useProjectStore } from '@/store/projectStore';
import { logAudit } from '@/services/audit';
import { useAuditLogs } from '@/modules/audit/hooks/useAuditLogs';

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

const FILTERS_KEY = 'taches-filtres';

function loadFilters() {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveFilters(filters: any) {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {}
}

export function Taches() {
  const { showToast } = useToast() || {};
  const { user } = useAuth();
  const currentProjectId = useProjectStore((state) => state.currentProjectId);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubTaskRef, setSelectedSubTaskRef] = useState<{ taskId: string; subTaskId: string } | null>(null);
  const initialFilters = loadFilters() || { searchTerm: '', statusFilter: 'all', priorityFilter: 'all', assigneeFilter: 'all' };
  const [searchTerm, setSearchTerm] = useState<string>(initialFilters.searchTerm);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>(initialFilters.statusFilter);
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>(initialFilters.priorityFilter);
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | string>(initialFilters.assigneeFilter);
  const [expandedTaskIds, setExpandedTaskIds] = useState<string[]>(INITIAL_TASKS.map((task) => task.id));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const [subTaskAssignee, setSubTaskAssignee] = useState('');
  const [subTaskDueDate, setSubTaskDueDate] = useState('');
  const [subTaskPriority, setSubTaskPriority] = useState<TaskPriority>('medium');
  const [subTaskStatus, setSubTaskStatus] = useState<TaskStatus>('todo');

  const auditFilters = useMemo(
    () => ({
      projectId: currentProjectId ?? undefined,
      entityType: 'task',
    }),
    [currentProjectId]
  );

  const { data: auditLogs, refetch: refetchAuditLogs } = useAuditLogs(auditFilters);

  const historyEntries = useMemo(
    () => (auditLogs ?? [])
      .filter((log) => ['CREATE', 'UPDATE', 'DELETE', 'EXPORT'].includes(log.action))
      .slice(0, 30),
    [auditLogs]
  );

  const selectedSubTask = useMemo(() => {
    if (!selectedSubTaskRef) return null;
    const parentTask = tasks.find((task) => task.id === selectedSubTaskRef.taskId);
    if (!parentTask) return null;
    const subTask = parentTask.subTasks.find((item) => item.id === selectedSubTaskRef.subTaskId);
    if (!subTask) return null;
    return { parentTask, subTask };
  }, [selectedSubTaskRef, tasks]);

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

  const openSubTaskModal = (taskId: string, subTask: SubTask) => {
    setSelectedSubTaskRef({ taskId, subTaskId: subTask.id });
    setSubTaskTitle(subTask.title);
    setSubTaskAssignee(subTask.assignee);
    setSubTaskDueDate(subTask.dueDate);
    setSubTaskPriority(subTask.priority);
    setSubTaskStatus(subTask.status);
  };

  const closeSubTaskModal = () => {
    setSelectedSubTaskRef(null);
    setSubTaskTitle('');
    setSubTaskAssignee('');
    setSubTaskDueDate('');
    setSubTaskPriority('medium');
    setSubTaskStatus('todo');
  };

  const closeTaskModal = () => {
    setSelectedTaskId(null);
    resetForm();
  };

  const recordTaskAudit = (action: string, metadata: Record<string, unknown>) => {
    if (!user?.id) return;
    void logAudit({
      userId: user.id,
      action,
      entity: { type: 'task', project_id: currentProjectId ?? undefined },
      metadata,
    }).then(() => {
      void refetchAuditLogs();
    });
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
    recordTaskAudit('UPDATE', { task_id: selectedTaskId, title: title.trim() });
    closeTaskModal();
  };

  const deleteTask = () => {
    if (!selectedTaskId) return;
    const deletedTaskTitle = tasks.find((task) => task.id === selectedTaskId)?.title ?? title;
    setTasks((prev) => prev.filter((task) => task.id !== selectedTaskId));
    recordTaskAudit('DELETE', { task_id: selectedTaskId, title: deletedTaskTitle });
    closeTaskModal();
  };

  const saveSubTask = () => {
    if (!selectedSubTaskRef || !subTaskTitle.trim() || !subTaskAssignee.trim() || !subTaskDueDate) return;

    setTasks((prev) => prev.map((task) => {
      if (task.id !== selectedSubTaskRef.taskId) return task;
      return {
        ...task,
        subTasks: task.subTasks.map((item) => (
          item.id === selectedSubTaskRef.subTaskId
            ? {
                ...item,
                title: subTaskTitle.trim(),
                assignee: subTaskAssignee.trim(),
                dueDate: subTaskDueDate,
                priority: subTaskPriority,
                status: subTaskStatus,
              }
            : item
        )),
      };
    }));

    closeSubTaskModal();
  };

  const createTask = () => {
    if (!title.trim() || !assignee.trim() || !startDate || !dueDate) return;
    const nextCode = String(tasks.length + 1).padStart(2, '0');
    const newTask = {
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
    };
    setTasks((prev) => [newTask, ...prev]);
    recordTaskAudit('CREATE', { task_id: newTask.id, title: newTask.title });
    resetForm();
    setIsCreateModalOpen(false);
  };

  const toggleExpandedTask = (taskId: string) => {
    setExpandedTaskIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
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

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="bf-text-primary mb-1 text-2xl font-black tracking-[-0.015em]">Taches & Sous-taches</h2>
            <p className="bf-text-muted">Cliquez sur une tache pour ouvrir son detail complet.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={async () => {
                try {
                  await exportTasksToCSV(filteredTasks);
                  showToast?.('Export CSV effectue', 'success');
                  recordTaskAudit('EXPORT', { format: 'csv', count: filteredTasks.length });
                } catch {
                  showToast?.("Echec de l'export CSV", 'error');
                }
              }}
            >
              Exporter CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              onClick={async () => {
                try {
                  await exportTasksToPDF(filteredTasks);
                  showToast?.('Export PDF effectue', 'success');
                  recordTaskAudit('EXPORT', { format: 'pdf', count: filteredTasks.length });
                } catch {
                  showToast?.("Echec de l'export PDF", 'error');
                }
              }}
            >
              Exporter PDF
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl"
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
            >
              + Creer une tache
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-sm md:p-4">
        <div className="grid gap-3 md:grid-cols-5">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-3.5">
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

      <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm md:p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-2">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                  className="h-10 w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-[12px] focus:border-blue-400"
                  placeholder="Rechercher une tache..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    saveFilters({ searchTerm: event.target.value, statusFilter, priorityFilter, assigneeFilter });
                  }}
                />
            </label>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px]"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | TaskStatus);
                saveFilters({ searchTerm, statusFilter: event.target.value, priorityFilter, assigneeFilter });
              }}
            >
              <option value="all">Statut</option>
              <option value="todo">A faire</option>
              <option value="in_progress">En cours</option>
              <option value="waiting">En attente</option>
              <option value="done">Terminee</option>
            </select>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px]"
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value as 'all' | TaskPriority);
                saveFilters({ searchTerm, statusFilter, priorityFilter: event.target.value, assigneeFilter });
              }}
            >
              <option value="all">Priorite</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[13px]"
              value={assigneeFilter}
              onChange={(event) => {
                setAssigneeFilter(event.target.value);
                saveFilters({ searchTerm, statusFilter, priorityFilter, assigneeFilter: event.target.value });
              }}
            >
              <option value="all">Responsable</option>
              {assigneeOptions.map((assignee) => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>

            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600">
              <Filter size={14} />
              Filtres
            </button>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-600">
              <ListFilter size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[36%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[4%]" />
              </colgroup>
              <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.05em] text-slate-500">
                <tr>
                  <th className="px-4 py-3.5 text-left">Tache</th>
                  <th className="px-4 py-3.5 text-left">Statut</th>
                  <th className="px-4 py-3.5 text-left">Priorite</th>
                  <th className="px-4 py-3.5 text-left">Responsable</th>
                  <th className="px-4 py-3.5 text-left">Echeance</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
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
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-xs font-bold text-slate-500">{task.code}</span>
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-slate-800">{task.title}</p>
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
                          <span className="inline-flex min-w-0 items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{getInitials(task.assignee)}</span>
                            <span className="truncate text-slate-700">{task.assignee}</span>
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

                      {isExpanded ? task.subTasks.map((subTask, subTaskIndex) => (
                        <tr key={subTask.id} className="border-t border-slate-100 bg-slate-50/40">
                          <td className="px-4 py-3">
                            <div className="ml-7 flex min-w-0 items-center gap-2">
                              <span className="relative h-8 w-6 shrink-0">
                                <span className="absolute left-3 top-0 h-1/2 w-px bg-slate-300" />
                                {subTaskIndex < task.subTasks.length - 1 ? (
                                  <span className="absolute left-3 top-1/2 h-1/2 w-px bg-slate-300" />
                                ) : null}
                                <span className="absolute left-3 top-1/2 h-px w-3 bg-slate-300" />
                              </span>
                              <span className="text-xs font-bold text-slate-400">{subTask.code}</span>
                              <button
                                type="button"
                                onClick={() => openSubTaskModal(task.id, subTask)}
                                className="truncate text-left text-slate-700 hover:text-blue-700"
                              >
                                {subTask.title}
                              </button>
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
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{getInitials(subTask.assignee)}</span>
                              <span className="truncate text-slate-700">{subTask.assignee}</span>
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
      </div>

      {isCreateModalOpen ? (
        <BodyPortal>
          <div className="fixed inset-0 z-[1100] bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
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
        </BodyPortal>
      ) : null}

      {selectedTask ? (
        <BodyPortal>
          <div className="fixed inset-0 z-[1100] bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
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
                    <button
                      type="button"
                      onClick={() => openSubTaskModal(selectedTask.id, subTask)}
                      className="font-medium text-slate-700 hover:text-blue-700"
                    >
                      {subTask.code} · {subTask.title}
                    </button>
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
        </BodyPortal>
      ) : null}

      {selectedSubTask ? (
        <BodyPortal>
          <div className="fixed inset-0 z-[1100] bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
            <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <div>
              <h3 className="bf-text-primary font-black text-xl">Edition sous-tache</h3>
              <p className="text-sm bf-text-muted">{selectedSubTask.parentTask.title} · {selectedSubTask.subTask.code}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label htmlFor="edit-subtask-title" className="text-sm font-medium bf-text-primary">Titre</label>
                <input id="edit-subtask-title" className="bf-input mt-1 w-full" value={subTaskTitle} onChange={(event) => setSubTaskTitle(event.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-subtask-assignee" className="text-sm font-medium bf-text-primary">Affectation</label>
                <input id="edit-subtask-assignee" className="bf-input mt-1 w-full" value={subTaskAssignee} onChange={(event) => setSubTaskAssignee(event.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-subtask-priority" className="text-sm font-medium bf-text-primary">Priorite</label>
                <select id="edit-subtask-priority" className="bf-select mt-1 w-full rounded-xl px-3 py-2" value={subTaskPriority} onChange={(event) => setSubTaskPriority(event.target.value as TaskPriority)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-subtask-status" className="text-sm font-medium bf-text-primary">Statut</label>
                <select id="edit-subtask-status" className="bf-select mt-1 w-full rounded-xl px-3 py-2" value={subTaskStatus} onChange={(event) => setSubTaskStatus(event.target.value as TaskStatus)}>
                  <option value="todo">A faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="waiting">En attente</option>
                  <option value="done">Terminee</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-subtask-date" className="text-sm font-medium bf-text-primary">Echeance</label>
                <input id="edit-subtask-date" type="date" className="bf-input mt-1 w-full" value={subTaskDueDate} onChange={(event) => setSubTaskDueDate(event.target.value)} />
              </div>
            </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeSubTaskModal}>Annuler</Button>
                <Button type="button" onClick={saveSubTask}>Enregistrer</Button>
              </div>
            </div>
          </div>
        </BodyPortal>
      ) : null}

      {/* Historique des actions */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="font-bold text-lg mb-2">Historique des actions</h3>
        <ul className="space-y-1 text-sm">
          {historyEntries.length === 0 && <li className="text-slate-400">Aucune action recente.</li>}
          {historyEntries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2">
              <span className="text-slate-500">{new Date(entry.created_at).toLocaleString('fr-FR')}</span>
              <span className="font-semibold">{entry.action}</span>
              <span className="text-slate-700">{typeof entry.metadata?.title === 'string' ? entry.metadata.title : 'Tache'}</span>
              <span className="text-slate-400">par {entry.user_id ? `${entry.user_id.slice(0, 8)}...` : 'utilisateur'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

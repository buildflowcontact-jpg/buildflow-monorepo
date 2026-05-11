import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Preparer la zone de coulage',
    assignee: 'Lina',
    dueDate: '2026-05-14',
    status: 'todo',
    priority: 'high',
  },
  {
    id: 't-2',
    title: 'Controle ferraillage niveau -1',
    assignee: 'Marc',
    dueDate: '2026-05-16',
    status: 'in_progress',
    priority: 'medium',
  },
  {
    id: 't-3',
    title: 'Validation plan de reservation',
    assignee: 'Ines',
    dueDate: '2026-05-10',
    status: 'done',
    priority: 'low',
  },
];

const STATUS_TITLE: Record<TaskStatus, string> = {
  todo: 'A faire',
  in_progress: 'En cours',
  done: 'Termine',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
};

export function Taches() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const grouped = useMemo(() => {
    const next: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((task) => next[task.status].push(task));
    (Object.keys(next) as TaskStatus[]).forEach((status) => {
      next[status].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    });
    return next;
  }, [tasks]);

  const createTask = () => {
    if (!title.trim() || !assignee.trim() || !dueDate) return;
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        title: title.trim(),
        assignee: assignee.trim(),
        dueDate,
        priority,
        status: 'todo',
      },
      ...prev,
    ]);
    setTitle('');
    setAssignee('');
    setDueDate('');
    setPriority('medium');
    setIsCreateModalOpen(false);
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const renderTaskCard = (task: Task) => (
    <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <p className="font-semibold bf-text-primary text-sm">{task.title}</p>
      <p className="text-xs bf-text-muted">Responsable: {task.assignee}</p>
      <p className="text-xs bf-text-muted">Echeance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
      <p className="text-xs bf-text-muted">Priorite: {PRIORITY_LABEL[task.priority]}</p>
      <div className="flex gap-1 pt-1">
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'todo')}>A faire</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'in_progress')}>En cours</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'done')}>Termine</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="bf-text-primary font-black text-2xl mb-1">Taches & Sous-taches</h2>
          <p className="bf-text-muted">Creation et visualisation des taches du chantier.</p>
        </div>
        <Button type="button" onClick={() => setIsCreateModalOpen(true)}>Creer une tache</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bf-card-soft p-4 space-y-3">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.todo}</h3>
          {grouped.todo.length === 0 ? <p className="text-sm bf-text-muted">Aucune tache.</p> : grouped.todo.map(renderTaskCard)}
        </section>

        <section className="bf-card-soft p-4 space-y-3">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.in_progress}</h3>
          {grouped.in_progress.length === 0 ? <p className="text-sm bf-text-muted">Aucune tache.</p> : grouped.in_progress.map(renderTaskCard)}
        </section>

        <section className="bf-card-soft p-4 space-y-3">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.done}</h3>
          {grouped.done.length === 0 ? <p className="text-sm bf-text-muted">Aucune tache.</p> : grouped.done.map(renderTaskCard)}
        </section>
      </div>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <h3 className="bf-text-primary font-black text-xl">Creer une nouvelle tache</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label htmlFor="task-title" className="text-sm font-medium bf-text-primary">Titre</label>
                <input id="task-title" className="bf-input mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="task-assignee" className="text-sm font-medium bf-text-primary">Responsable</label>
                <input id="task-assignee" className="bf-input mt-1 w-full" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
              </div>
              <div>
                <label htmlFor="task-date" className="text-sm font-medium bf-text-primary">Echeance</label>
                <input id="task-date" type="date" className="bf-input mt-1 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="task-priority" className="text-sm font-medium bf-text-primary">Priorite</label>
                <select id="task-priority" className="bf-input mt-1 w-full" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
              <Button type="button" onClick={createTask}>Creer</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';

interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  subTasks: SubTask[];
}

interface HistoryEntry {
  id: string;
  taskTitle: string;
  action: string;
  at: string;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'A faire',
  in_progress: 'En cours',
  done: 'Terminée',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
};

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Préparer la zone de coulage',
    assignee: 'Lina',
    dueDate: '2026-05-14',
    status: 'in_progress',
    priority: 'high',
    subTasks: [
      { id: 'st-1', title: 'Baliser la zone', done: true },
      { id: 'st-2', title: 'Contrôler la ferraille', done: false },
    ],
  },
  {
    id: 't-2',
    title: 'Vérifier les accès livraison',
    assignee: 'Marc',
    dueDate: '2026-05-18',
    status: 'todo',
    priority: 'medium',
    subTasks: [{ id: 'st-3', title: 'Confirmer le créneau grue', done: false }],
  },
];

export function Taches() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  const [newSubTasks, setNewSubTasks] = useState<Record<string, string>>({});
  const [draggedSubTaskId, setDraggedSubTaskId] = useState<string | null>(null);

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((task) => task.assignee).filter(Boolean))),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterAssignee !== 'all' && task.assignee !== filterAssignee) return false;
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterAssignee]);

  const dueNotifications = useMemo(() => {
    const now = new Date();
    const in2Days = new Date();
    in2Days.setDate(in2Days.getDate() + 2);

    const overdue: Task[] = [];
    const dueSoon: Task[] = [];

    tasks.forEach((task) => {
      if (!task.dueDate || task.status === 'done') return;
      const due = new Date(task.dueDate);
      if (due < now) {
        overdue.push(task);
      } else if (due <= in2Days) {
        dueSoon.push(task);
      }
    });

    return { overdue, dueSoon };
  }, [tasks]);

  const pushHistory = (taskTitle: string, action: string) => {
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        taskTitle,
        action,
        at: new Date().toLocaleString('fr-FR'),
      },
      ...prev,
    ].slice(0, 40));
  };

  const addTask = () => {
    if (!newTaskTitle.trim() || !newTaskAssignee.trim() || !newTaskDueDate) return;

    const next: Task = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee.trim(),
      dueDate: newTaskDueDate,
      status: 'todo',
      priority: newTaskPriority,
      subTasks: [],
    };

    setTasks((prev) => [next, ...prev]);
    pushHistory(next.title, 'Création de la tâche');
    setNewTaskTitle('');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
    setNewTaskPriority('medium');
  };

  const addSubTask = (taskId: string) => {
    const title = (newSubTasks[taskId] ?? '').trim();
    if (!title) return;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updated = {
          ...task,
          subTasks: [...task.subTasks, { id: `st-${Date.now()}`, title, done: false }],
        };
        pushHistory(task.title, `Ajout sous-tâche: ${title}`);
        return updated;
      })
    );
    setNewSubTasks((prev) => ({ ...prev, [taskId]: '' }));
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subTasks: task.subTasks.map((subTask) => {
            if (subTask.id !== subTaskId) return subTask;
            const next = { ...subTask, done: !subTask.done };
            pushHistory(task.title, `${next.done ? 'Validation' : 'Réouverture'} sous-tâche: ${subTask.title}`);
            return next;
          }),
        };
      })
    );
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        pushHistory(task.title, `Passage statut: ${STATUS_LABEL[status]}`);
        return { ...task, status };
      })
    );
  };

  const onSubTaskDrop = (taskId: string, targetSubTaskId: string) => {
    if (!draggedSubTaskId || draggedSubTaskId === targetSubTaskId) return;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const fromIndex = task.subTasks.findIndex((st) => st.id === draggedSubTaskId);
        const toIndex = task.subTasks.findIndex((st) => st.id === targetSubTaskId);
        if (fromIndex === -1 || toIndex === -1) return task;

        const reordered = [...task.subTasks];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        pushHistory(task.title, `Réorganisation sous-tâche: ${moved.title}`);
        return { ...task, subTasks: reordered };
      })
    );

    setDraggedSubTaskId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="bf-text-primary font-black text-2xl mb-1">Tâches & Sous-tâches</h2>
        <p className="bf-text-muted">Créez et visualisez uniquement les tâches opérationnelles du chantier.</p>
      </div>

      {(dueNotifications.overdue.length > 0 || dueNotifications.dueSoon.length > 0) && (
        <div className="bf-card-soft p-4 space-y-2 border border-amber-200">
          <h3 className="font-bold bf-text-primary">Notifications d'échéance</h3>
          {dueNotifications.overdue.map((task) => (
            <p key={`over-${task.id}`} className="text-sm text-red-700">
              Retard: {task.title} ({task.assignee}) devait être terminée le {new Date(task.dueDate).toLocaleDateString('fr-FR')}
            </p>
          ))}
          {dueNotifications.dueSoon.map((task) => (
            <p key={`soon-${task.id}`} className="text-sm text-amber-700">
              A échéance proche: {task.title} ({task.assignee}) avant le {new Date(task.dueDate).toLocaleDateString('fr-FR')}
            </p>
          ))}
        </div>
      )}

      <div className="bf-card-soft p-4 space-y-3">
        <h3 className="font-bold bf-text-primary">Créer une tâche</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            className="bf-input"
            placeholder="Titre"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <input
            className="bf-input"
            placeholder="Responsable"
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
          />
          <input
            className="bf-input"
            type="date"
            value={newTaskDueDate}
            onChange={(e) => setNewTaskDueDate(e.target.value)}
          />
          <select
            className="bf-input"
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
          >
            <option value="low">Priorité faible</option>
            <option value="medium">Priorité moyenne</option>
            <option value="high">Priorité haute</option>
          </select>
          <Button type="button" onClick={addTask}>Ajouter</Button>
        </div>
      </div>

      <div className="bf-card-soft p-4 space-y-3">
        <h3 className="font-bold bf-text-primary">Filtres avancés</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="bf-input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | TaskStatus)}>
            <option value="all">Tous les statuts</option>
            <option value="todo">A faire</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminées</option>
          </select>
          <select className="bf-input" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as 'all' | TaskPriority)}>
            <option value="all">Toutes priorités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
          <select className="bf-input" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
            <option value="all">Tous les responsables</option>
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bf-card-soft p-4 text-sm bf-text-muted">Aucune tâche ne correspond aux filtres.</div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bf-card-soft p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold bf-text-primary">{task.title}</h4>
                  <p className="text-xs bf-text-muted">
                    Responsable: {task.assignee} | Echéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')} | Priorité: {PRIORITY_LABEL[task.priority]}
                  </p>
                </div>
                <select
                  className="bf-input text-sm"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                >
                  <option value="todo">A faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminée</option>
                </select>
              </div>

              <div className="space-y-2">
                {task.subTasks.map((subTask) => (
                  <div
                    key={subTask.id}
                    className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between gap-2 bg-white"
                    draggable
                    onDragStart={() => setDraggedSubTaskId(subTask.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onSubTaskDrop(task.id, subTask.id)}
                  >
                    <label className="text-sm flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subTask.done}
                        onChange={() => toggleSubTask(task.id, subTask.id)}
                      />
                      <span className={subTask.done ? 'line-through text-slate-500' : ''}>{subTask.title}</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Glisser-déposer</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  className="bf-input"
                  placeholder="Nouvelle sous-tâche"
                  value={newSubTasks[task.id] ?? ''}
                  onChange={(e) => setNewSubTasks((prev) => ({ ...prev, [task.id]: e.target.value }))}
                />
                <Button type="button" variant="ghost" onClick={() => addSubTask(task.id)}>
                  Ajouter sous-tâche
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bf-card-soft p-4">
        <h3 className="font-bold bf-text-primary mb-2">Historique des modifications</h3>
        {history.length === 0 ? (
          <p className="text-sm bf-text-muted">Aucune modification récente.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {history.map((item) => (
              <li key={item.id} className="bf-text-muted">
                {item.at} | {item.taskTitle} | {item.action}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

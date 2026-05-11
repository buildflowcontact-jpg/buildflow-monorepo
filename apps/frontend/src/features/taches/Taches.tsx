import React, { useMemo, useState } from 'react';
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
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  subTasks: SubTask[];
}

const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    title: 'Préparer la zone de coulage',
    assignee: 'Lina',
    startDate: '2026-05-10',
    dueDate: '2026-05-14',
    status: 'todo',
    priority: 'high',
    subTasks: [],
  },
  {
    id: 't-2',
    title: 'Contrôle ferraillage niveau -1',
    assignee: 'Marc',
    startDate: '2026-05-12',
    dueDate: '2026-05-16',
    status: 'in_progress',
    priority: 'medium',
    subTasks: [],
  },
  {
    id: 't-3',
    title: 'Validation plan de réservation',
    assignee: 'Ines',
    startDate: '2026-05-05',
    dueDate: '2026-05-10',
    status: 'done',
    priority: 'low',
    subTasks: [],
  },
];

const STATUS_TITLE: Record<TaskStatus, string> = {
  todo: 'A faire',
  in_progress: 'En cours',
  done: 'Terminée',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
};

export function Taches() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [subTaskInput, setSubTaskInput] = useState<Record<string, string>>({});

  // Form states
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState('');
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

  const openEditModal = (task: Task) => {
    setEditTaskId(task.id);
    setTitle(task.title);
    setAssignee(task.assignee);
    setStartDate(task.startDate);
    setDueDate(task.dueDate);
    setPriority(task.priority);
  };

  const saveEditTask = () => {
    setTasks((prev) => prev.map((task) =>
      task.id === editTaskId
        ? { ...task, title: title.trim(), assignee: assignee.trim(), startDate, dueDate, priority }
        : task
    ));
    setEditTaskId(null);
    setTitle('');
    setAssignee('');
    setStartDate('');
    setDueDate('');
    setPriority('medium');
  };

  const openDeleteModal = (taskId: string) => setDeleteTaskId(taskId);
  const confirmDeleteTask = () => {
    setTasks((prev) => prev.filter((task) => task.id !== deleteTaskId));
    setDeleteTaskId(null);
  };

  const createTask = () => {
    if (!title.trim() || !assignee.trim() || !dueDate || !startDate) return;
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        title: title.trim(),
        assignee: assignee.trim(),
        startDate,
        dueDate,
        priority,
        status: 'todo',
        subTasks: [],
      },
      ...prev,
    ]);
    setTitle('');
    setAssignee('');
    setStartDate('');
    setDueDate('');
    setPriority('medium');
    setIsCreateModalOpen(false);
  };

  const moveTask = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const addSubTask = (taskId: string) => {
    const value = (subTaskInput[taskId] || '').trim();
    if (!value) return;
    setTasks((prev) => prev.map((task) =>
      task.id === taskId
        ? { ...task, subTasks: [...task.subTasks, { id: `st-${Date.now()}`, title: value, done: false }] }
        : task
    ));
    setSubTaskInput((prev) => ({ ...prev, [taskId]: '' }));
  };

  const toggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks((prev) => prev.map((task) =>
      task.id === taskId
        ? { ...task, subTasks: task.subTasks.map(st => st.id === subTaskId ? { ...st, done: !st.done } : st) }
        : task
    ));
  };

  const renderTaskCard = (task: Task) => (
    <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold bf-text-primary text-sm">{task.title}</p>
          <p className="text-xs bf-text-muted">Responsable: {task.assignee}</p>
          <p className="text-xs bf-text-muted">Début: {task.startDate ? new Date(task.startDate).toLocaleDateString('fr-FR') : '-'}</p>
          <p className="text-xs bf-text-muted">Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
          <p className="text-xs bf-text-muted">Priorité: {PRIORITY_LABEL[task.priority]}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(task)}>Éditer</Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => openDeleteModal(task.id)}>Supprimer</Button>
        </div>
      </div>
      <div className="flex gap-1 pt-1">
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'todo')}>A faire</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'in_progress')}>En cours</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => moveTask(task.id, 'done')}>Terminé</Button>
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <input
            className="bf-input flex-1"
            placeholder="Ajouter une sous-tâche"
            value={subTaskInput[task.id] || ''}
            onChange={e => setSubTaskInput(prev => ({ ...prev, [task.id]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') addSubTask(task.id); }}
          />
          <Button type="button" size="sm" onClick={() => addSubTask(task.id)}>Ajouter</Button>
        </div>
        <ul className="pl-4 mt-2 space-y-1">
          {task.subTasks.map(st => (
            <li key={st.id} className="flex items-center gap-2">
              <input type="checkbox" checked={st.done} onChange={() => toggleSubTask(task.id, st.id)} />
              <span className={st.done ? 'line-through text-gray-400' : ''}>{st.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="bf-text-primary font-black text-2xl mb-1">Tâches & Sous-tâches</h2>
          <p className="bf-text-muted">Création, édition et visualisation des tâches du chantier.</p>
        </div>
        <Button type="button" onClick={() => setIsCreateModalOpen(true)}>Créer une tâche</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bf-card-soft p-4 space-y-3 bg-red-100 border-red-300">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.todo}</h3>
          {grouped.todo.length === 0 ? <p className="text-sm bf-text-muted">Aucune tâche.</p> : grouped.todo.map(renderTaskCard)}
        </section>
        <section className="bf-card-soft p-4 space-y-3 bg-orange-100 border-orange-300">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.in_progress}</h3>
          {grouped.in_progress.length === 0 ? <p className="text-sm bf-text-muted">Aucune tâche.</p> : grouped.in_progress.map(renderTaskCard)}
        </section>
        <section className="bf-card-soft p-4 space-y-3 bg-green-100 border-green-300">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.done}</h3>
          {grouped.done.length === 0 ? <p className="text-sm bf-text-muted">Aucune tâche.</p> : grouped.done.map(renderTaskCard)}
        </section>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <h3 className="bf-text-primary font-black text-xl">Créer une nouvelle tâche</h3>
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
                <label htmlFor="task-start-date" className="text-sm font-medium bf-text-primary">Date de début</label>
                <input id="task-start-date" type="date" className="bf-input mt-1 w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="task-date" className="text-sm font-medium bf-text-primary">Échéance</label>
                <input id="task-date" type="date" className="bf-input mt-1 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="task-priority" className="text-sm font-medium bf-text-primary">Priorité</label>
                <select id="task-priority" className="bf-input mt-1 w-full" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
              <Button type="button" onClick={createTask}>Créer</Button>
            </div>
          </div>
        </div>
      )}

      {editTaskId && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-lg p-5 space-y-4">
            <h3 className="bf-text-primary font-black text-xl">Éditer la tâche</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label htmlFor="edit-task-title" className="text-sm font-medium bf-text-primary">Titre</label>
                <input id="edit-task-title" className="bf-input mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-assignee" className="text-sm font-medium bf-text-primary">Responsable</label>
                <input id="edit-task-assignee" className="bf-input mt-1 w-full" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-start-date" className="text-sm font-medium bf-text-primary">Date de début</label>
                <input id="edit-task-start-date" type="date" className="bf-input mt-1 w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-task-date" className="text-sm font-medium bf-text-primary">Échéance</label>
                <input id="edit-task-date" type="date" className="bf-input mt-1 w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="edit-task-priority" className="text-sm font-medium bf-text-primary">Priorité</label>
                <select id="edit-task-priority" className="bf-input mt-1 w-full" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditTaskId(null)}>Annuler</Button>
              <Button type="button" onClick={saveEditTask}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}

      {deleteTaskId && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="bf-modal w-full max-w-sm p-5 space-y-4">
            <h3 className="bf-text-primary font-black text-xl">Supprimer la tâche ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteTaskId(null)}>Annuler</Button>
              <Button type="button" variant="destructive" onClick={confirmDeleteTask}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

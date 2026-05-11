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
}

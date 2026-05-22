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
    title: 'Preparer la zone de coulage',
    description: 'Verifier les acces et installer la signaletique.',
    assignee: 'Lina',
    startDate: '2026-05-10',
    dueDate: '2026-05-14',
    status: 'todo',
    priority: 'high',
    subTasks: [],
  },
  {
    id: 't-2',
    title: 'Controle ferraillage niveau -1',
    description: 'Point de controle qualite avant coulage.',
    assignee: 'Marc',
    startDate: '2026-05-12',
    dueDate: '2026-05-16',
    status: 'in_progress',
    priority: 'medium',
    subTasks: [],
  },
  {
    id: 't-3',
    title: 'Validation plan de reservation',
    description: 'Validation finale avec bureau methodes.',
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
  done: 'Terminee',
};

export function Taches() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subTaskInput, setSubTaskInput] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');

  const grouped = useMemo(() => {
    const next: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    tasks.forEach((task) => next[task.status].push(task));
    return next;
  }, [tasks]);

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
    setSubTaskInput('');
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
    setSubTaskInput('');
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
    setTasks((prev) => [
      {
        id: `t-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim(),
        startDate,
        dueDate,
        priority,
        status: 'todo',
        subTasks: [],
      },
      ...prev,
    ]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const addSubTask = () => {
    if (!selectedTaskId || !subTaskInput.trim()) return;
    setTasks((prev) => prev.map((task) => (
      task.id === selectedTaskId
        ? {
            ...task,
            subTasks: [...task.subTasks, { id: `st-${Date.now()}`, title: subTaskInput.trim(), done: false }],
          }
        : task
    )));
    setSubTaskInput('');
  };

  const toggleSubTask = (subTaskId: string) => {
    if (!selectedTaskId) return;
    setTasks((prev) => prev.map((task) => (
      task.id === selectedTaskId
        ? {
            ...task,
            subTasks: task.subTasks.map((subTask) => (
              subTask.id === subTaskId ? { ...subTask, done: !subTask.done } : subTask
            )),
          }
        : task
    )));
  };

  const renderTaskCard = (task: Task) => (
    <button
      key={task.id}
      type="button"
      onClick={() => openTaskModal(task)}
      className="w-full text-left rounded-xl border border-slate-200 bg-white px-3 py-3 font-semibold bf-text-primary hover:border-slate-400 transition-colors"
    >
      {task.title}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
          Creer une tache
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bf-card-soft p-4 space-y-3 bg-red-100 border-red-300">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.todo}</h3>
          {grouped.todo.length === 0 ? <p className="text-sm bf-text-muted">Aucune tache.</p> : grouped.todo.map(renderTaskCard)}
        </section>
        <section className="bf-card-soft p-4 space-y-3 bg-orange-100 border-orange-300">
          <h3 className="bf-text-primary font-black tracking-tight">{STATUS_TITLE.in_progress}</h3>
          {grouped.in_progress.length === 0 ? <p className="text-sm bf-text-muted">Aucune tache.</p> : grouped.in_progress.map(renderTaskCard)}
        </section>
        <section className="bf-card-soft p-4 space-y-3 bg-green-100 border-green-300">
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
              <div className="flex items-center gap-2">
                <input
                  className="bf-input flex-1"
                  placeholder="Ajouter une sous-tache"
                  value={subTaskInput}
                  onChange={(event) => setSubTaskInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') addSubTask();
                  }}
                />
                <Button type="button" size="sm" onClick={addSubTask}>Ajouter</Button>
              </div>
              <ul className="pl-1 mt-2 space-y-1">
                {selectedTask.subTasks.map((subTask) => (
                  <li key={subTask.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={subTask.done} onChange={() => toggleSubTask(subTask.id)} />
                    <span className={subTask.done ? 'line-through text-gray-400' : ''}>{subTask.title}</span>
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

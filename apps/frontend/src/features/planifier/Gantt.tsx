import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"

const taskSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  start: z.string().min(1, "Date de début requise"),
  end: z.string().min(1, "Date de fin requise"),
  dependencies: z.array(z.number()).optional()
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
  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { name: "", start: "", end: "", dependencies: [] }
  })

  const onSubmit = (values: TaskForm) => {
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        ...values,
        dependencies: values.dependencies || []
      }
    ])
    form.reset()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap gap-2 items-end" aria-label="Ajouter une tâche">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Nom</label>
          <input id="name" type="text" {...form.register("name")} className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" required />
          {form.formState.errors.name && <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="start" className="block text-sm font-medium">Début</label>
          <input id="start" type="date" {...form.register("start")} className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" required />
          {form.formState.errors.start && <p className="text-red-600 text-xs mt-1">{form.formState.errors.start.message}</p>}
        </div>
        <div>
          <label htmlFor="end" className="block text-sm font-medium">Fin</label>
          <input id="end" type="date" {...form.register("end")} className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500" required />
          {form.formState.errors.end && <p className="text-red-600 text-xs mt-1">{form.formState.errors.end.message}</p>}
        </div>
        <div>
          <label htmlFor="dependencies" className="block text-sm font-medium">Dépendances</label>
          <select id="dependencies" multiple {...form.register("dependencies")}
            className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500">
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs">
          <thead>
            <tr>
              <th className="border p-2">Tâche</th>
              <th className="border p-2">Début</th>
              <th className="border p-2">Fin</th>
              <th className="border p-2">Dépendances</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td className="border p-2 font-bold">{task.name}</td>
                <td className="border p-2">{task.start}</td>
                <td className="border p-2">{task.end}</td>
                <td className="border p-2">{task.dependencies.map((dep: number) => tasks.find(t => t.id === dep)?.name).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 text-gray-500">(Gantt visuel à venir)</div>
      </div>
    </div>
  )
}

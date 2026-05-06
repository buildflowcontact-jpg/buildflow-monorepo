import React, { useState } from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"

const memberSchema = z.object({
  name: z.string().min(2, "Nom requis")
})
type MemberForm = z.infer<typeof memberSchema>

export interface EquipeProps {
  membres?: { id: number; name: string }[]
}

export function Equipe({ membres: initialMembres = [] }: EquipeProps) {
  const [membres, setMembres] = useState(initialMembres)
  const form = useZodForm(memberSchema, {
    defaultValues: { name: "" }
  })

  const onSubmit = (values: MemberForm) => {
    setMembres([...membres, { id: Date.now(), name: values.name }])
    form.reset()
  }

  return (
    <div className="space-y-5">
      <h3 className="bf-text-primary text-2xl font-black tracking-tight">Équipe</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 sm:items-end" aria-label="Ajouter un membre">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="name" className="bf-text-primary block text-sm font-semibold">Nom</label>
          <input
            id="name"
            type="text"
            {...form.register("name")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            required
          />
          {form.formState.errors.name && <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl">
          {form.formState.isSubmitting ? <Spinner size={16} /> : "Ajouter"}
        </Button>
      </form>
      <ul className="bf-card-soft divide-y divide-slate-200">
        {membres.length ? membres.map((m) => (
          <li key={m.id} className="bf-text-primary px-4 py-3 font-medium">{m.name}</li>
        )) : <li className="bf-text-muted px-4 py-3">Aucun membre</li>}
      </ul>
    </div>
  )
}

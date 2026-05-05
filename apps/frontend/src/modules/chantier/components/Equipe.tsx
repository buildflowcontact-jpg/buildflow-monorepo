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
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Équipe</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-end" aria-label="Ajouter un membre">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Nom</label>
          <input
            id="name"
            type="text"
            {...form.register("name")}
            className="mt-1 block w-full rounded border border-border bg-background text-foreground focus:ring-primary focus:border-primary"
            required
          />
          {form.formState.errors.name && <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Spinner size={16} /> : "Ajouter"}
        </Button>
      </form>
      <ul className="divide-y divide-border bg-card rounded shadow border border-border">
        {membres.length ? membres.map((m) => (
          <li key={m.id} className="px-4 py-2 text-foreground">{m.name}</li>
        )) : <li className="px-4 py-2 text-muted-foreground">Aucun membre</li>}
      </ul>
    </div>
  )
}

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"

const memberSchema = z.object({
  name: z.string().min(2, "Nom requis")
})
type MemberForm = z.infer<typeof memberSchema>

export interface EquipeProps {
  membres?: { id: number; name: string }[]
}

export function Equipe({ membres: initialMembres = [] }: EquipeProps) {
  const [membres, setMembres] = useState(initialMembres)
  const form = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
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
            className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          {form.formState.errors.name && <p className="text-red-600 text-xs mt-1">{form.formState.errors.name.message}</p>}
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>Ajouter</Button>
      </form>
      <ul className="divide-y divide-gray-200 bg-white rounded shadow">
        {membres.length ? membres.map((m) => (
          <li key={m.id} className="px-4 py-2">{m.name}</li>
        )) : <li className="px-4 py-2 text-gray-500">Aucun membre</li>}
      </ul>
    </div>
  )
}

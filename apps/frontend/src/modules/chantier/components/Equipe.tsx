import React from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/ui/ToastProvider"
import { supabase } from "@/lib/supabase"
import { useWorkers, useCreateWorker } from "@/modules/rh-securite/hooks/useRHSecurity"

const memberSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  company: z.string().min(2, "Entreprise requise"),
  domain: z.string().min(2, "Domaine d'activité requis"),
})
type MemberForm = z.infer<typeof memberSchema>

export interface EquipeProps {
  projectId: string
  projectName: string
}

export function Equipe({ projectId, projectName }: EquipeProps) {
  const form = useZodForm(memberSchema, {
    defaultValues: { firstName: "", lastName: "", company: "", domain: "" }
  })
  const { data: membres = [], isLoading } = useWorkers(projectId)
  const createWorker = useCreateWorker()
  const { showToast } = useToast() || {}

  const companyStats = React.useMemo(() => {
    const counts: Record<string, number> = {}
    membres.forEach((worker) => {
      const key = worker.company || 'Non renseignée'
      counts[key] = (counts[key] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [membres])

  const domainStats = React.useMemo(() => {
    const counts: Record<string, number> = {}
    membres.forEach((worker) => {
      const key = worker.role || 'Non renseigné'
      counts[key] = (counts[key] ?? 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [membres])

  const maxCompany = Math.max(...companyStats.map((entry) => entry[1]), 1)
  const maxDomain = Math.max(...domainStats.map((entry) => entry[1]), 1)

  const onSubmit = async (values: MemberForm) => {
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`

    // Recherche de l'utilisateur existant (même identité) dans la base des collaborateurs.
    const { data: existingWorkers, error: searchError } = await supabase
      .from('workers')
      .select('id, full_name, company')
      .eq('full_name', fullName)
      .eq('company', values.company.trim())
      .limit(1)

    if (searchError) {
      showToast?.('Erreur lors de la recherche du collaborateur', 'error')
      return
    }

    const existing = existingWorkers && existingWorkers.length > 0 ? existingWorkers[0] : null

    if (existing) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          project_id: projectId,
          type: 'PROJECT_INVITATION',
          target_role: 'worker',
          reference_id: `${existing.id}|${projectName}`,
          is_read: false,
        })

      if (notifError) {
        showToast?.('Collaborateur trouvé, mais notification impossible à créer', 'error')
        return
      }

      showToast?.(`Invitation envoyée à ${fullName} pour rejoindre ${projectName}`, 'success')
      form.reset()
      return
    }

    await createWorker.mutateAsync({
      projectId,
      fullName,
      role: `${values.domain.trim()} (virtuel)`,
      company: values.company.trim(),
    })

    showToast?.(`Profil virtuel créé pour ${fullName}`, 'success')
    form.reset()
  }

  return (
    <div className="space-y-5">
      <h3 className="bf-text-primary text-2xl font-black tracking-tight">Équipe</h3>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-label="Ajouter un membre">
        <div className="w-full sm:max-w-sm">
          <label htmlFor="firstName" className="bf-text-primary block text-sm font-semibold">Prénom</label>
          <input
            id="firstName"
            type="text"
            {...form.register("firstName")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            required
          />
          {form.formState.errors.firstName && <p className="text-red-600 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
        </div>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="lastName" className="bf-text-primary block text-sm font-semibold">Nom</label>
          <input
            id="lastName"
            type="text"
            {...form.register("lastName")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            required
          />
          {form.formState.errors.lastName && <p className="text-red-600 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
        </div>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="company" className="bf-text-primary block text-sm font-semibold">Entreprise</label>
          <input
            id="company"
            type="text"
            {...form.register("company")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            required
          />
          {form.formState.errors.company && <p className="text-red-600 text-xs mt-1">{form.formState.errors.company.message}</p>}
        </div>
        <div className="w-full sm:max-w-sm">
          <label htmlFor="domain" className="bf-text-primary block text-sm font-semibold">Domaine d'activité</label>
          <input
            id="domain"
            type="text"
            {...form.register("domain")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            required
          />
          {form.formState.errors.domain && <p className="text-red-600 text-xs mt-1">{form.formState.errors.domain.message}</p>}
        </div>
        <div className="md:col-span-2">
          <p className="text-xs bf-text-muted mb-2">
            Si le collaborateur existe déjà, une notification d'invitation est envoyée. Sinon, un profil virtuel est créé.
          </p>
          <Button type="submit" disabled={form.formState.isSubmitting || createWorker.isPending} className="rounded-xl">
            {(form.formState.isSubmitting || createWorker.isPending) ? <Spinner size={16} /> : "Ajouter / Inviter"}
          </Button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Répartition par entreprise</p>
          <div className="space-y-2">
            {companyStats.length ? companyStats.map(([company, count]) => {
              const width = Math.round((count / maxCompany) * 100)
              return (
                <div key={company}>
                  <div className="flex items-center justify-between text-xs"><span className="truncate max-w-[220px]">{company}</span><span>{count}</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${width}%` }} /></div>
                </div>
              )
            }) : <p className="text-xs bf-text-muted">Aucune donnée.</p>}
          </div>
        </div>

        <div className="bf-card-soft p-4">
          <p className="text-xs uppercase font-semibold bf-text-muted mb-2">Répartition par domaine</p>
          <div className="space-y-2">
            {domainStats.length ? domainStats.map(([domain, count]) => {
              const width = Math.round((count / maxDomain) * 100)
              return (
                <div key={domain}>
                  <div className="flex items-center justify-between text-xs"><span className="truncate max-w-[220px]">{domain}</span><span>{count}</span></div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${width}%` }} /></div>
                </div>
              )
            }) : <p className="text-xs bf-text-muted">Aucune donnée.</p>}
          </div>
        </div>
      </div>

      <ul className="bf-card-soft divide-y divide-slate-200">
        {isLoading ? (
          <li className="bf-text-muted px-4 py-3">Chargement...</li>
        ) : membres.length ? membres.map((m) => (
          <li key={m.id} className="bf-text-primary px-4 py-3 font-medium">
            <span>{m.full_name}</span>
            {m.company ? <span className="text-xs bf-text-muted ml-2">({m.company})</span> : null}
            {m.role ? <div className="text-xs bf-text-muted">{m.role}</div> : null}
          </li>
        )) : <li className="bf-text-muted px-4 py-3">Aucun membre</li>}
      </ul>
    </div>
  )
}

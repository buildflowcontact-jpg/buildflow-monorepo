import React from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"
import { useToast } from "@/ui/ToastProvider"
import { supabase } from "@/lib/supabase"
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker } from "@/modules/rh-securite/hooks/useRHSecurity"
import { usePermissions } from "@/hooks/usePermissions"

const memberSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  company: z.string().min(2, "Entreprise requise"),
  domain: z.string().min(2, "Domaine d'activité requis"),
  projectRole: z.string().min(2, "Rôle projet requis"),
})
type MemberForm = z.infer<typeof memberSchema>

export interface EquipeProps {
  projectId: string
  projectName: string
}

export function Equipe({ projectId, projectName }: EquipeProps) {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValues, setEditValues] = React.useState<{ fullName: string; company: string; role: string }>({ fullName: '', company: '', role: '' })
  const [certByWorker, setCertByWorker] = React.useState<Record<string, Array<{ id: string; label: string; expiresAt: string }>>>({})
  const [certWorkerId, setCertWorkerId] = React.useState('')
  const [certLabel, setCertLabel] = React.useState('')
  const [certExpiry, setCertExpiry] = React.useState('')
  const [messageText, setMessageText] = React.useState('')
  const [messages, setMessages] = React.useState<Array<{ id: string; text: string; createdAt: string }>>([])
  const form = useZodForm(memberSchema, {
    defaultValues: { firstName: "", lastName: "", company: "", domain: "", projectRole: "" }
  })
  const { data: membres = [], isLoading } = useWorkers(projectId)
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const deleteWorker = useDeleteWorker()
  const { showToast } = useToast() || {}
  const { can } = usePermissions(projectId)
  const canInvite = can('team:invite')
  const canRemove = can('team:remove')

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

  const certAlerts = React.useMemo(() => {
    const now = new Date()
    const alertDate = new Date()
    alertDate.setDate(alertDate.getDate() + 30)
    const alerts: Array<{ workerName: string; label: string; expiresAt: string; isExpired: boolean }> = []

    membres.forEach((worker) => {
      const certs = certByWorker[worker.id] ?? []
      certs.forEach((cert) => {
        const expires = new Date(cert.expiresAt)
        if (expires <= alertDate) {
          alerts.push({
            workerName: worker.full_name,
            label: cert.label,
            expiresAt: cert.expiresAt,
            isExpired: expires < now,
          })
        }
      })
    })

    return alerts.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
  }, [certByWorker, membres])

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
      role: `${values.projectRole.trim()} | ${values.domain.trim()} (virtuel)`,
      company: values.company.trim(),
    })

    showToast?.(`Profil virtuel créé pour ${fullName}`, 'success')
    form.reset()
  }

  const addCertification = () => {
    if (!certWorkerId || !certLabel.trim() || !certExpiry) return
    setCertByWorker((prev) => ({
      ...prev,
      [certWorkerId]: [
        ...(prev[certWorkerId] ?? []),
        { id: `${Date.now()}`, label: certLabel.trim(), expiresAt: certExpiry },
      ],
    }))
    setCertLabel('')
    setCertExpiry('')
  }

  const sendInternalMessage = () => {
    if (!messageText.trim()) return
    setMessages((prev) => [
      {
        id: `${Date.now()}`,
        text: messageText.trim(),
        createdAt: new Date().toLocaleString('fr-FR'),
      },
      ...prev,
    ].slice(0, 20))
    setMessageText('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="bf-text-primary text-2xl font-black tracking-tight">Équipe</h3>
        {canInvite && (
        <Button
          type="button"
          onClick={() => setIsAddFormOpen((open) => !open)}
          aria-expanded={isAddFormOpen}
          aria-controls="add-person-form"
        >
          {isAddFormOpen ? "Fermer" : "Ajouter une personne"}
        </Button>
        )}
      </div>

      {isAddFormOpen && canInvite ? (
      <form id="add-person-form" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-label="Ajouter un membre">
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
        <div className="w-full sm:max-w-sm">
          <label htmlFor="projectRole" className="bf-text-primary block text-sm font-semibold">Rôle projet</label>
          <input
            id="projectRole"
            type="text"
            {...form.register("projectRole")}
            className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none"
            placeholder="Ex: Chef d'équipe"
            required
          />
          {form.formState.errors.projectRole && <p className="text-red-600 text-xs mt-1">{form.formState.errors.projectRole.message}</p>}
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
      ) : null}

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

      <div className="space-y-2">
        <p className="text-sm font-semibold bf-text-primary">Liste des personnes liées au projet</p>
        <ul className="bf-card-soft divide-y divide-slate-200">
        {isLoading ? (
          <li className="bf-text-muted px-4 py-3">Chargement...</li>
        ) : membres.length ? membres.map((m) => (
          <li key={m.id} className="px-4 py-3 space-y-1">
            {editingId === m.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  aria-label="Nom complet"
                  value={editValues.fullName}
                  onChange={(e) => setEditValues({ ...editValues, fullName: e.target.value })}
                  className="bf-input rounded-xl px-3 py-2 text-sm"
                />
                <input
                  aria-label="Entreprise"
                  value={editValues.company}
                  onChange={(e) => setEditValues({ ...editValues, company: e.target.value })}
                  className="bf-input rounded-xl px-3 py-2 text-sm"
                />
                <input
                  aria-label="Rôle / domaine"
                  value={editValues.role}
                  onChange={(e) => setEditValues({ ...editValues, role: e.target.value })}
                  className="bf-input rounded-xl px-3 py-2 text-sm"
                />
                <div className="sm:col-span-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={updateWorker.isPending}
                    onClick={async () => {
                      try {
                        await updateWorker.mutateAsync({ workerId: m.id, projectId, fullName: editValues.fullName, company: editValues.company, role: editValues.role })
                        showToast?.('Membre mis à jour', 'success')
                        setEditingId(null)
                      } catch {
                        showToast?.('Impossible de mettre à jour le membre', 'error')
                      }
                    }}
                  >
                    {updateWorker.isPending ? <Spinner size={14} /> : 'Enregistrer'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="bf-text-primary font-medium">{m.full_name}</span>
                  {m.company ? <span className="text-xs bf-text-muted ml-2">({m.company})</span> : null}
                  {m.role ? <div className="text-xs bf-text-muted">{m.role}</div> : null}
                  <div className="mt-1 flex gap-2 items-center">
                    <span className="text-[11px] uppercase bf-text-muted">Rôle projet</span>
                    <select
                      className="bf-input text-xs py-1"
                      value={m.role ?? ''}
                      onChange={async (e) => {
                        try {
                          await updateWorker.mutateAsync({ workerId: m.id, projectId, fullName: m.full_name, company: m.company ?? '', role: e.target.value })
                          showToast?.('Rôle projet mis à jour', 'success')
                        } catch {
                          showToast?.('Mise à jour du rôle impossible', 'error')
                        }
                      }}
                    >
                      <option value={m.role ?? ''}>{m.role ?? 'Définir un rôle'}</option>
                      <option value="Chef d'équipe">Chef d'équipe</option>
                      <option value="Conducteur de travaux">Conducteur de travaux</option>
                      <option value="Responsable sécurité">Responsable sécurité</option>
                      <option value="Technicien">Technicien</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {canInvite && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(m.id)
                      setEditValues({ fullName: m.full_name ?? '', company: m.company ?? '', role: m.role ?? '' })
                    }}
                  >
                    Modifier
                  </Button>
                  )}
                  {canRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteWorker.isPending}
                    onClick={async () => {
                      if (!confirm(`Retirer ${m.full_name} du projet ?`)) return
                      try {
                        await deleteWorker.mutateAsync({ workerId: m.id, projectId })
                        showToast?.(`${m.full_name} retiré du projet`, 'success')
                      } catch {
                        showToast?.('Impossible de supprimer ce membre', 'error')
                      }
                    }}
                  >
                    Retirer
                  </Button>
                  )}
                </div>
              </div>
            )}
          </li>
        )) : <li className="bf-text-muted px-4 py-3">Aucun membre</li>}
        </ul>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bf-card-soft p-4 space-y-3">
          <h4 className="bf-text-primary font-bold">Habilitations & certifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select className="bf-input" value={certWorkerId} onChange={(e) => setCertWorkerId(e.target.value)}>
              <option value="">Sélectionner un membre</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
            <input className="bf-input" value={certLabel} onChange={(e) => setCertLabel(e.target.value)} placeholder="Certification" />
            <input className="bf-input" type="date" value={certExpiry} onChange={(e) => setCertExpiry(e.target.value)} />
          </div>
          <Button type="button" variant="ghost" onClick={addCertification}>Ajouter certification</Button>

          <div className="space-y-1 text-sm">
            {certAlerts.length === 0 ? (
              <p className="bf-text-muted">Aucune certification proche d'expiration.</p>
            ) : certAlerts.map((alert, idx) => (
              <p key={`${alert.workerName}-${alert.label}-${idx}`} className={alert.isExpired ? 'text-red-700' : 'text-amber-700'}>
                {alert.workerName} | {alert.label} | expire le {new Date(alert.expiresAt).toLocaleDateString('fr-FR')}
              </p>
            ))}
          </div>
        </div>

        <div className="bf-card-soft p-4 space-y-3">
          <h4 className="bf-text-primary font-bold">Messagerie interne rapide</h4>
          <div className="flex gap-2">
            <input
              className="bf-input"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Message équipe"
            />
            <Button type="button" onClick={sendInternalMessage}>Envoyer</Button>
          </div>
          <div className="space-y-1 text-sm">
            {messages.length === 0 ? (
              <p className="bf-text-muted">Aucun message interne.</p>
            ) : messages.map((message) => (
              <p key={message.id} className="bf-text-muted">{message.createdAt} | {message.text}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

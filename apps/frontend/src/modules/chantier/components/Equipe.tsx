import React from "react"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"
import { BodyPortal } from "@/components/ui/BodyPortal"
import { useToast } from "@/ui/ToastProvider"
import { supabase } from "@/lib/supabase"
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker } from "@/modules/rh-securite/hooks/useRHSecurity"
import { usePermissions } from "@/hooks/usePermissions"
import { uploadAttachmentToSupabase } from "@/modules/approvisionnement/services/uploadAttachmentToSupabase"

const memberSchema = z.object({
  firstName: z.string().min(2, "Prenom requis"),
  lastName: z.string().min(2, "Nom requis"),
  company: z.string().min(2, "Entreprise requise"),
  domain: z.string().min(2, "Domaine d'activite requis"),
})
type MemberForm = z.infer<typeof memberSchema>

interface MemberCredential {
  id: string
  label: string
  type: 'habilitation' | 'certification'
  expiresAt: string
  docs: Array<{ id: string; name: string; path: string }>
}

export interface EquipeProps {
  projectId: string
  projectName: string
}

export function Equipe({ projectId, projectName }: EquipeProps) {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false)
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'infos' | 'credentials'>('infos')
  const [credentialsByWorker, setCredentialsByWorker] = React.useState<Record<string, MemberCredential[]>>({})

  const [credentialLabel, setCredentialLabel] = React.useState('')
  const [credentialType, setCredentialType] = React.useState<'habilitation' | 'certification'>('habilitation')
  const [credentialExpiry, setCredentialExpiry] = React.useState('')
  const [credentialFiles, setCredentialFiles] = React.useState<File[]>([])

  const form = useZodForm(memberSchema, {
    defaultValues: { firstName: "", lastName: "", company: "", domain: "" }
  })

  const { data: membres = [], isLoading } = useWorkers(projectId)
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const deleteWorker = useDeleteWorker()
  const { showToast } = useToast() || {}
  const { can } = usePermissions(projectId)
  const canInvite = can('team:invite')
  const canRemove = can('team:remove')

  const selectedMember = membres.find((member) => member.id === selectedMemberId) ?? null
  const selectedCredentials = selectedMemberId ? (credentialsByWorker[selectedMemberId] ?? []) : []

  const onSubmit = async (values: MemberForm) => {
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`

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
        showToast?.('Collaborateur trouve, mais notification impossible a creer', 'error')
        return
      }

      showToast?.(`Invitation envoyee a ${fullName} pour rejoindre ${projectName}`, 'success')
      form.reset()
      return
    }

    await createWorker.mutateAsync({
      projectId,
      fullName,
      role: values.domain.trim(),
      company: values.company.trim(),
    })

    showToast?.(`Profil virtuel cree pour ${fullName}`, 'success')
    form.reset()
  }

  const openMemberModal = (memberId: string) => {
    setSelectedMemberId(memberId)
    setActiveTab('infos')
  }

  const closeMemberModal = () => {
    setSelectedMemberId(null)
    setCredentialLabel('')
    setCredentialExpiry('')
    setCredentialFiles([])
  }

  const addCredential = async () => {
    if (!selectedMemberId || !credentialLabel.trim() || !credentialExpiry) return

    const docs: Array<{ id: string; name: string; path: string }> = []
    for (const file of credentialFiles) {
      try {
        const path = await uploadAttachmentToSupabase(file, projectId, 'document')
        docs.push({ id: `${Date.now()}-${file.name}`, name: file.name, path })
      } catch {
        showToast?.(`Echec upload: ${file.name}`, 'error')
      }
    }

    const nextCredential: MemberCredential = {
      id: `cred-${Date.now()}`,
      label: credentialLabel.trim(),
      type: credentialType,
      expiresAt: credentialExpiry,
      docs,
    }

    setCredentialsByWorker((prev) => ({
      ...prev,
      [selectedMemberId]: [nextCredential, ...(prev[selectedMemberId] ?? [])],
    }))

    setCredentialLabel('')
    setCredentialExpiry('')
    setCredentialFiles([])
    showToast?.('Habilitation / certification ajoutee', 'success')
  }

  const removeCredential = (credentialId: string) => {
    if (!selectedMemberId) return
    setCredentialsByWorker((prev) => ({
      ...prev,
      [selectedMemberId]: (prev[selectedMemberId] ?? []).filter((credential) => credential.id !== credentialId),
    }))
  }

  const removeCredentialDoc = (credentialId: string, docId: string) => {
    if (!selectedMemberId) return
    setCredentialsByWorker((prev) => ({
      ...prev,
      [selectedMemberId]: (prev[selectedMemberId] ?? []).map((credential) => {
        if (credential.id !== credentialId) return credential
        return { ...credential, docs: credential.docs.filter((doc) => doc.id !== docId) }
      }),
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="bf-text-primary text-2xl font-black tracking-tight">Équipe</h3>
        {canInvite && (
          <Button type="button" onClick={() => setIsAddFormOpen((open) => !open)} aria-expanded={isAddFormOpen} aria-controls="add-person-form">
            {isAddFormOpen ? "Fermer" : "Ajouter une personne"}
          </Button>
        )}
      </div>

      {isAddFormOpen && canInvite ? (
        <form id="add-person-form" onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-label="Ajouter un membre">
          <div className="w-full sm:max-w-sm">
            <label htmlFor="firstName" className="bf-text-primary block text-sm font-semibold">Prénom</label>
            <input id="firstName" type="text" {...form.register("firstName")} className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none" required />
            {form.formState.errors.firstName && <p className="text-red-600 text-xs mt-1">{form.formState.errors.firstName.message}</p>}
          </div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="lastName" className="bf-text-primary block text-sm font-semibold">Nom</label>
            <input id="lastName" type="text" {...form.register("lastName")} className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none" required />
            {form.formState.errors.lastName && <p className="text-red-600 text-xs mt-1">{form.formState.errors.lastName.message}</p>}
          </div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="company" className="bf-text-primary block text-sm font-semibold">Entreprise</label>
            <input id="company" type="text" {...form.register("company")} className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none" required />
            {form.formState.errors.company && <p className="text-red-600 text-xs mt-1">{form.formState.errors.company.message}</p>}
          </div>
          <div className="w-full sm:max-w-sm">
            <label htmlFor="domain" className="bf-text-primary block text-sm font-semibold">Domaine d'activité</label>
            <input id="domain" type="text" {...form.register("domain")} className="bf-input mt-1.5 block w-full rounded-xl px-3.5 py-2.5 outline-none" required />
            {form.formState.errors.domain && <p className="text-red-600 text-xs mt-1">{form.formState.errors.domain.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={form.formState.isSubmitting || createWorker.isPending} className="rounded-xl">
              {(form.formState.isSubmitting || createWorker.isPending) ? <Spinner size={16} /> : "Ajouter / Inviter"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold bf-text-primary">Liste des personnes liées au projet</p>
        <ul className="bf-card-soft divide-y divide-slate-200">
          {isLoading ? (
            <li className="bf-text-muted px-4 py-3">Chargement...</li>
          ) : membres.length ? membres.map((member) => (
            <li key={member.id} className="px-4 py-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => openMemberModal(member.id)} className="text-left flex-1 hover:opacity-80">
                <p className="bf-text-primary font-medium">{member.full_name}</p>
                <p className="text-xs bf-text-muted">{member.company ?? 'Entreprise non renseignee'} | {member.role ?? 'Role non renseigne'}</p>
              </button>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const role = prompt('Nouveau role pour ce membre ?', member.role ?? '')
                    if (role === null) return
                    try {
                      await updateWorker.mutateAsync({ workerId: member.id, projectId, fullName: member.full_name ?? '', company: member.company ?? '', role })
                      showToast?.('Role mis a jour', 'success')
                    } catch {
                      showToast?.('Mise a jour impossible', 'error')
                    }
                  }}
                >
                  Role
                </Button>
                {canRemove && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteWorker.isPending}
                    onClick={async () => {
                      if (!confirm(`Retirer ${member.full_name} du projet ?`)) return
                      try {
                        await deleteWorker.mutateAsync({ workerId: member.id, projectId })
                        showToast?.(`${member.full_name} retire du projet`, 'success')
                      } catch {
                        showToast?.('Impossible de supprimer ce membre', 'error')
                      }
                    }}
                  >
                    Retirer
                  </Button>
                )}
              </div>
            </li>
          )) : <li className="bf-text-muted px-4 py-3">Aucun membre</li>}
        </ul>
      </div>

      {selectedMember ? (
        <BodyPortal>
          <div className="fixed inset-0 z-[1100] bg-black/40 flex items-center justify-center px-2 md:px-4" role="dialog" aria-modal="true" style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh' }}>
            <div className="bf-modal w-full max-w-4xl p-5 space-y-4 max-h-[90vh] overflow-auto shadow-2xl border-2 border-blue-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="bf-text-primary font-black text-xl">{selectedMember.full_name}</h4>
                <p className="text-sm bf-text-muted">{selectedMember.company ?? 'Entreprise non renseignee'} | {selectedMember.role ?? 'Role non renseigne'}</p>
              </div>
              <Button type="button" variant="ghost" onClick={closeMemberModal}>Fermer</Button>
            </div>

            <div className="flex gap-2">
              <Button type="button" size="sm" variant={activeTab === 'infos' ? 'default' : 'ghost'} onClick={() => setActiveTab('infos')}>Informations</Button>
              <Button type="button" size="sm" variant={activeTab === 'credentials' ? 'default' : 'ghost'} onClick={() => setActiveTab('credentials')}>
                Habilitations et certifications
              </Button>
            </div>

            {activeTab === 'infos' ? (
              <div className="bf-card-soft p-4 space-y-1 text-sm">
                <p><span className="font-semibold">Nom:</span> {selectedMember.full_name}</p>
                <p><span className="font-semibold">Entreprise:</span> {selectedMember.company ?? 'Non renseignee'}</p>
                <p><span className="font-semibold">Role:</span> {selectedMember.role ?? 'Non renseigne'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bf-card-soft p-4 space-y-3">
                  <h5 className="font-bold bf-text-primary">Ajouter une habilitation / certification</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input className="bf-input" placeholder="Libelle" value={credentialLabel} onChange={(e) => setCredentialLabel(e.target.value)} />
                    <select className="bf-input" value={credentialType} onChange={(e) => setCredentialType(e.target.value as 'habilitation' | 'certification')}>
                      <option value="habilitation">Habilitation</option>
                      <option value="certification">Certification</option>
                    </select>
                    <input className="bf-input" type="date" value={credentialExpiry} onChange={(e) => setCredentialExpiry(e.target.value)} />
                    <input className="bf-input" type="file" multiple onChange={(e) => setCredentialFiles(Array.from(e.target.files ?? []))} />
                  </div>
                  <Button type="button" onClick={addCredential}>Ajouter</Button>
                </div>

                <div className="bf-card-soft p-4 space-y-3">
                  <h5 className="font-bold bf-text-primary">Liste des habilitations et certifications</h5>
                  {selectedCredentials.length === 0 ? (
                    <p className="text-sm bf-text-muted">Aucun element enregistre.</p>
                  ) : (
                    selectedCredentials.map((credential) => (
                      <div key={credential.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold bf-text-primary">{credential.label}</p>
                            <p className="text-xs bf-text-muted">{credential.type} | expiration: {new Date(credential.expiresAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeCredential(credential.id)}>Supprimer</Button>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs uppercase font-semibold bf-text-muted">Documents lies</p>
                          {credential.docs.length === 0 ? (
                            <p className="text-sm bf-text-muted">Aucun document lie.</p>
                          ) : (
                            credential.docs.map((doc) => {
                              const publicUrl = supabase.storage.from('project-media').getPublicUrl(doc.path).data.publicUrl
                              return (
                                <div key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                                  <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{doc.name}</a>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCredentialDoc(credential.id, doc.id)}>Supprimer</Button>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </BodyPortal>
      ) : null}
    </div>
  )
}
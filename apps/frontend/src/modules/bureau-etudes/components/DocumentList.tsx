import React, { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useZodForm } from "@/hooks/useZodForm"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/Spinner"
import { supabase } from "@/lib/supabase"
import { uploadAttachmentToSupabase } from "@/modules/approvisionnement/services/uploadAttachmentToSupabase"

import { useToast } from "@/components/ui/ToastProvider";
import * as documentHooks from "../hooks/useProjectDocuments"

const docSchema = z.object({
  title: z.string().min(2, "Titre requis"),
  category: z.string().optional()
})

type DocForm = z.infer<typeof docSchema>

export interface DocumentListProps {
  projectId: string
  onSelect: (docId: string) => void
}

export function DocumentList({ projectId, onSelect }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { data: docs, isLoading } = documentHooks.useProjectDocuments(projectId)
  const createDoc = documentHooks.useCreateDocument(projectId)
  const updateDoc = documentHooks.useUpdateDocument(projectId)
  const deleteDoc = documentHooks.useDeleteDocument(projectId)
  const createVersion = documentHooks.useCreateDocumentVersion
    ? documentHooks.useCreateDocumentVersion(projectId)
    : ({ isPending: false, mutateAsync: async () => null } as { isPending: boolean; mutateAsync: (args: any) => Promise<any> })
  const [editDoc, setEditDoc] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [versionLabel, setVersionLabel] = useState("")
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [signatureName, setSignatureName] = useState("")
  const { showToast } = useToast() || {};
  const versionsQuery = documentHooks.useDocumentVersions
    ? documentHooks.useDocumentVersions(selectedDocId)
    : ({ data: [], isLoading: false } as { data: any[]; isLoading: boolean })
  const { data: versions = [], isLoading: isLoadingVersions } = versionsQuery

  const form = useZodForm(docSchema, {
    defaultValues: { title: "", category: "" }
  })

  React.useEffect(() => {
    if (editDoc) {
      form.reset({ title: editDoc.title, category: editDoc.category || "" })
    } else {
      form.reset({ title: "", category: "" })
    }
  }, [editDoc, form])

  const onSubmit = async (values: DocForm) => {
    try {
      if (editDoc) {
        await updateDoc.mutateAsync({ id: editDoc.id, ...values })
        showToast && showToast('Document modifié', 'success');
      } else {
        await createDoc.mutateAsync(values)
        showToast && showToast('Document créé', 'success');
      }
      setModalOpen(false)
      setEditDoc(null)
    } catch (e) {
      showToast && showToast('Erreur lors de l’enregistrement', 'error');
    }
  }

  const filteredDocs = React.useMemo(() => {
    const source = docs ?? []
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return source
    return source.filter((doc: any) => {
      const title = (doc.title ?? '').toLowerCase()
      const category = (doc.category ?? '').toLowerCase()
      return title.includes(keyword) || category.includes(keyword)
    })
  }, [docs, searchTerm])

  const selectedDoc = filteredDocs.find((doc: any) => doc.id === selectedDocId) ?? null

  const handleSelectDoc = (doc: any) => {
    setSelectedDocId(doc.id)
    onSelect(doc.id)
  }

  const handleCreateVersion = async () => {
    if (!selectedDocId || !versionFile) return
    try {
      const path = await uploadAttachmentToSupabase(versionFile, projectId, 'document')
      await createVersion.mutateAsync({
        documentId: selectedDocId,
        fileUrl: path,
        versionLabel: versionLabel.trim() || undefined,
      })
      showToast && showToast('Nouvelle version déposée', 'success')
      setVersionFile(null)
      setVersionLabel('')
    } catch {
      showToast && showToast('Erreur lors du dépôt de version', 'error')
    }
  }

  const handleSignDocument = async () => {
    if (!selectedDoc || !signatureName.trim()) return
    try {
      const previousMetadata = typeof selectedDoc.metadata === 'object' && selectedDoc.metadata !== null ? selectedDoc.metadata as Record<string, unknown> : {}
      const signedBy = [
        ...(Array.isArray(previousMetadata.signedBy) ? (previousMetadata.signedBy as string[]) : []),
        `${signatureName.trim()} (${new Date().toLocaleString('fr-FR')})`,
      ]

      const { error } = await supabase
        .from('documents')
        .update({ metadata: { ...previousMetadata, signedBy } })
        .eq('id', selectedDoc.id)

      if (error) throw error
      showToast && showToast('Signature électronique enregistrée', 'success')
      setSignatureName('')
      await updateDoc.mutateAsync({ id: selectedDoc.id, title: selectedDoc.title, category: selectedDoc.category ?? undefined })
    } catch {
      showToast && showToast('Impossible d\'enregistrer la signature', 'error')
    }
  }

  const signedByList = selectedDoc && selectedDoc.metadata && typeof selectedDoc.metadata === 'object' && Array.isArray((selectedDoc.metadata as any).signedBy)
    ? ((selectedDoc.metadata as any).signedBy as string[])
    : []

  if (isLoading) return <div>Chargement des documents...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="bf-text-primary text-lg font-bold">Documents</h3>
        <Button onClick={() => { setEditDoc(null); setModalOpen(true) }}>Nouveau</Button>
      </div>
      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bf-input"
        placeholder="Recherche plein texte (titre, catégorie)"
        aria-label="Recherche de document"
      />
      <ul className="bf-card-soft divide-y divide-gray-200">
        <AnimatePresence>
          {filteredDocs.length ? filteredDocs.map((doc: any) => (
            <motion.li
              key={doc.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex items-center justify-between px-4 py-2 hover:bg-slate-50/70"
            >
              <button
                className="bf-text-primary text-left flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => handleSelectDoc(doc)}
                aria-label={`Ouvrir ${doc.title}`}
              >
                <span className="font-medium">{doc.title}</span>
                {doc.category && <span className="bf-text-muted ml-2 text-xs">[{doc.category}]</span>}
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditDoc(doc); setModalOpen(true) }} aria-label="Éditer">✏️</Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteDoc.isPending}
                  onClick={async () => {
                    try {
                      await deleteDoc.mutateAsync(doc.id);
                      showToast && showToast('Document supprimé', 'success');
                    } catch (e) {
                      showToast && showToast('Erreur lors de la suppression', 'error');
                    }
                  }}
                  aria-label="Supprimer"
                >
                  {deleteDoc.isPending ? <Spinner size={16} /> : '🗑️'}
                </Button>
              </div>
            </motion.li>
          )) : <li className="bf-text-muted px-4 py-2">Aucun document</li>}
        </AnimatePresence>
      </ul>

      <div className="bf-card-soft p-4 space-y-3">
        <h4 className="bf-text-primary font-bold">Versioning & signature électronique</h4>
        {!selectedDoc ? (
          <p className="text-sm bf-text-muted">Sélectionnez un document pour gérer ses versions et signatures.</p>
        ) : (
          <>
            <p className="text-sm bf-text-muted">Document sélectionné: {selectedDoc.title}</p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-end">
              <input
                type="text"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                className="bf-input"
                placeholder="Label version (ex: v2.1)"
              />
              <input
                type="file"
                onChange={(e) => setVersionFile((e.target.files && e.target.files[0]) ? e.target.files[0] : null)}
                className="bf-input"
              />
              <Button type="button" onClick={handleCreateVersion} disabled={createVersion.isPending || !versionFile}>
                {createVersion.isPending ? <Spinner size={16} /> : 'Déposer version'}
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase bf-text-muted font-semibold">Historique versions</p>
              {isLoadingVersions ? (
                <p className="text-sm bf-text-muted">Chargement des versions...</p>
              ) : versions.length === 0 ? (
                <p className="text-sm bf-text-muted">Aucune version disponible.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {versions.map((version) => {
                    const publicUrl = supabase.storage.from('project-media').getPublicUrl(version.file_url).data.publicUrl
                    return (
                      <li key={version.id} className="flex items-center justify-between gap-2">
                        <span className="bf-text-muted">{version.version_label || 'Version sans label'} | {new Date(version.created_at).toLocaleDateString('fr-FR')}</span>
                        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Ouvrir</a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase bf-text-muted font-semibold">Signature électronique</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="bf-input"
                  placeholder="Nom du signataire"
                />
                <Button type="button" variant="ghost" onClick={handleSignDocument}>Signer</Button>
              </div>
              {signedByList.length > 0 ? (
                <ul className="text-xs bf-text-muted space-y-1">
                  {signedByList.map((entry, idx) => (
                    <li key={`${entry}-${idx}`}>• {entry}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm bf-text-muted">Aucune signature enregistrée.</p>
              )}
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bf-modal p-6 w-full max-w-sm space-y-4"
            aria-label={editDoc ? "Éditer document" : "Nouveau document"}
          >
            <h4 className="bf-text-primary font-bold mb-2">{editDoc ? "Éditer" : "Nouveau"} document</h4>
            <div>
              <label htmlFor="title" className="bf-text-primary block text-sm font-medium">Titre</label>
              <input
                id="title"
                type="text"
                {...form.register("title")}
                className="bf-input mt-1 block w-full rounded-xl"
                autoFocus
                required
              />
              {form.formState.errors.title && <p className="text-red-600 text-xs mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="category" className="bf-text-primary block text-sm font-medium">Catégorie</label>
              <input
                id="category"
                type="text"
                {...form.register("category")}
                className="bf-input mt-1 block w-full rounded-xl"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditDoc(null) }}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Spinner size={16} /> : "Valider"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

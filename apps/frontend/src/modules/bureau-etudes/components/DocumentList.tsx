import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useProjectDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from "../hooks/useProjectDocuments"

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
  const { data: docs, isLoading } = useProjectDocuments(projectId)
  const createDoc = useCreateDocument(projectId)
  const updateDoc = useUpdateDocument(projectId)
  const deleteDoc = useDeleteDocument(projectId)
  const [editDoc, setEditDoc] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const form = useForm<DocForm>({
    resolver: zodResolver(docSchema),
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
    if (editDoc) {
      await updateDoc.mutateAsync({ id: editDoc.id, ...values })
    } else {
      await createDoc.mutateAsync(values)
    }
    setModalOpen(false)
    setEditDoc(null)
  }

  if (isLoading) return <div>Chargement des documents...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Documents</h3>
        <Button onClick={() => { setEditDoc(null); setModalOpen(true) }}>Nouveau</Button>
      </div>
      <ul className="divide-y divide-gray-200 bg-white rounded shadow">
        {docs && docs.length ? docs.map((doc: any) => (
          <li key={doc.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
            <button
              className="text-left flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => onSelect(doc.id)}
              aria-label={`Ouvrir ${doc.title}`}
            >
              <span className="font-medium">{doc.title}</span>
              {doc.category && <span className="ml-2 text-xs text-gray-500">[{doc.category}]</span>}
            </button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditDoc(doc); setModalOpen(true) }} aria-label="Éditer">✏️</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteDoc.mutateAsync(doc.id)} aria-label="Supprimer">🗑️</Button>
            </div>
          </li>
        )) : <li className="px-4 py-2 text-gray-500">Aucun document</li>}
      </ul>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm space-y-4"
            aria-label={editDoc ? "Éditer document" : "Nouveau document"}
          >
            <h4 className="font-bold mb-2">{editDoc ? "Éditer" : "Nouveau"} document</h4>
            <div>
              <label htmlFor="title" className="block text-sm font-medium">Titre</label>
              <input
                id="title"
                type="text"
                {...form.register("title")}
                className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                required
              />
              {form.formState.errors.title && <p className="text-red-600 text-xs mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium">Catégorie</label>
              <input
                id="category"
                type="text"
                {...form.register("category")}
                className="mt-1 block w-full rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditDoc(null) }}>Annuler</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Enregistrement..." : "Valider"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
}

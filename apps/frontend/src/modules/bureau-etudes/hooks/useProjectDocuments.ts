import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface DocumentVersion {
  id: string;
  document_id: string;
  file_url: string;
  version_label: string | null;
  created_at: string;
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('title');
      if (error) throw error;
      return data;
    }
  });
}

export function useSearchDocuments(projectId: string, searchTerm: string) {
  return useQuery({
    queryKey: ['project-documents-search', projectId, searchTerm],
    enabled: !!projectId,
    queryFn: async () => {
      if (!searchTerm.trim()) {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .order('title');
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .order('title');
      if (error) throw error;
      return data;
    },
  });
}

export function useDocumentVersions(documentId: string | null) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('id, document_id, file_url, version_label, created_at')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentVersion[];
    },
  });
}

export function useCreateDocumentVersion(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      fileUrl,
      versionLabel,
    }: {
      documentId: string;
      fileUrl: string;
      versionLabel?: string;
    }) => {
      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          file_url: fileUrl,
          version_label: versionLabel ?? null,
          is_bpe: false,
        })
        .select('id, document_id, file_url, version_label, created_at')
        .single();
      if (error) throw error;
      return data as DocumentVersion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-documents-search', projectId] });
    },
  });
}

export function useCreateDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, category }: { title: string; category?: string }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({ project_id: projectId, title, category: category ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
    },
  });
}

export function useUpdateDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, category }: { id: string; title: string; category?: string }) => {
      const { data, error } = await supabase
        .from('documents')
        .update({ title, category: category ?? null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] });
    },
  });
}

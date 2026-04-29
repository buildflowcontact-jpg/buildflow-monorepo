import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateDocumentVersion(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, created_by, version_number, is_bpe }: { file: File; created_by: string; version_number?: number; is_bpe?: boolean }) => {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(`${documentId}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number,
          file_url: `${documentId}/${fileName}`,
          status: 'review',
          created_by,
          is_bpe: !!is_bpe
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['document-versions', documentId]);
    },
  });
}

export function useDeleteDocumentVersion(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_versions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['document-versions', documentId]);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';

export function useInboxIncidents(projectId: string) {
  return useQuery({
    queryKey: ['inbox-incidents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .eq('type', 'INCIDENT')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateDocumentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ document_id, file, created_by }: { document_id: string; file: File; created_by: string }) => {
      // 1. Upload du fichier
      const fileName = `${Date.now()}-${file.name}`;
      const { data: upload, error: uploadError } = await supabase.storage
        .from('project-media')
        .upload(`${document_id}/${fileName}`, file);
      if (uploadError) throw uploadError;
      // 2. Création de la version
      const { data, error } = await supabase
        .from('document_versions')
        .insert({
          document_id,
          version_number: Math.floor(Math.random() * 1000), // À remplacer par l'incrément réel
          file_url: `${document_id}/${fileName}`,
          status: 'review',
          created_by,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['bpe-plan', variables.document_id]);
    },
  });
}

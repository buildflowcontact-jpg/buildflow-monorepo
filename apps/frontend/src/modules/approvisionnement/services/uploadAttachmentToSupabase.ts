import { supabase } from '@/lib/supabase';

export async function uploadAttachmentToSupabase(file: File, projectId: string, scope: 'order' | 'delivery' | 'document' | 'incident') {
  const safeName = file.name.replace(/\s+/g, '_');
  const filePath = `${projectId}/${scope}/${Date.now()}-${safeName}`;
  const { data, error } = await supabase.storage
    .from('project-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

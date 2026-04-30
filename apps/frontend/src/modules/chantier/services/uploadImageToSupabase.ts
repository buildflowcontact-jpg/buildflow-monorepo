import { supabase } from '../../lib/supabase';

export async function uploadImageToSupabase(file: File, projectId: string) {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('project-media')
    .upload(`${projectId}/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false,
    });
  if (error) throw error;
  return data.path;
}

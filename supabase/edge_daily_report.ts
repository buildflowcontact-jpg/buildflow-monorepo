// Edge Function (Supabase) pour générer le daily_report à 17h
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  // Pour chaque projet, agréger météo, incidents, photos, tâches validées
  const { data: projects } = await supabase.from('projects').select('id');
  for (const project of projects ?? []) {
    // TODO: collecter météo, incidents, photos, tâches validées du jour
    await supabase.from('daily_reports').insert({
      project_id: project.id,
      date: new Date().toISOString().slice(0, 10),
      status: 'INTERNAL_REVIEW',
      weather: {},
      incidents: [],
      photos: [],
      validated_tasks: []
    });
  }
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});

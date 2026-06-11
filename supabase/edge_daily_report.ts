// Edge Function (Supabase) pour générer le daily_report à 17h
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

type ProjectRow = {
  id: string;
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type IncidentRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type TaskRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: string | null;
  due_date?: string | null;
  validated_at?: string | null;
};

type PhotoRow = {
  id: string;
  path?: string | null;
  url?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown>;
};

type WeatherData = {
  temperature_celsius?: number | null;
  conditions?: string | null;
  description?: string | null;
  humidity_percent?: number | null;
  wind_speed_kmh?: number | null;
  source?: string;
  fetched_at: string;
};

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const emptyWeather = (source = 'unavailable'): WeatherData => ({
  source,
  fetched_at: new Date().toISOString(),
});

async function fetchWeather(project: ProjectRow): Promise<WeatherData> {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
  const lat = project.latitude;
  const lon = project.longitude;

  if (!apiKey || lat == null || lon == null) {
    return emptyWeather();
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[daily-report] weather API error ${response.status} for project ${project.id}`);
      return emptyWeather('openweathermap-error');
    }

    const json = await response.json() as {
      main?: { temp?: number; humidity?: number };
      weather?: Array<{ main?: string; description?: string }>;
      wind?: { speed?: number };
    };

    return {
      temperature_celsius: json.main?.temp,
      humidity_percent: json.main?.humidity,
      conditions: json.weather?.[0]?.main ?? null,
      description: json.weather?.[0]?.description ?? null,
      wind_speed_kmh: json.wind?.speed == null ? null : Math.round(json.wind.speed * 3.6),
      source: 'openweathermap',
      fetched_at: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`[daily-report] weather fetch failed for project ${project.id}`, error);
    return emptyWeather('openweathermap-fetch-error');
  }
}

async function collectIncidents(supabase: SupabaseClient, projectId: string): Promise<IncidentRow[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('id, title, description, severity, status, created_at')
    .eq('project_id', projectId)
    .gte('created_at', `${todayIsoDate()}T00:00:00.000Z`)
    .lt('created_at', `${todayIsoDate()}T23:59:59.999Z`)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn(`[daily-report] incidents query failed for project ${projectId}`, error.message);
    return [];
  }

  return data ?? [];
}

async function collectPhotos(supabase: SupabaseClient, projectId: string): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, storage_path, created_at, metadata')
    .eq('project_id', projectId)
    .eq('doc_type', 'photo')
    .gte('created_at', `${todayIsoDate()}T00:00:00.000Z`)
    .lt('created_at', `${todayIsoDate()}T23:59:59.999Z`)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn(`[daily-report] photos query failed for project ${projectId}`, error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    path: row.storage_path ?? row.path ?? null,
    url: row.url ?? null,
    created_at: row.created_at,
    metadata: row.metadata ?? {},
  }));
}

async function collectValidatedTasks(supabase: SupabaseClient, projectId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date, validated_at')
    .eq('project_id', projectId)
    .in('status', ['validated', 'done', 'completed', 'TERMINE'])
    .order('validated_at', { ascending: false, nullsFirst: true });

  if (error) {
    console.warn(`[daily-report] validated tasks query failed for project ${projectId}`, error.message);
    return [];
  }

  return data ?? [];
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, address, latitude, longitude')
    .eq('status', 'EN_COURS')
    .order('name', { ascending: true });

  if (projectsError) {
    console.error('[daily-report] projects query failed', projectsError.message);
    return new Response(JSON.stringify({ status: 'error', error: 'projects_query_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const reports: Array<{ project_id: string; status: string }> = [];

  for (const project of projects ?? []) {
    const [weather, incidents, photos, validatedTasks] = await Promise.all([
      fetchWeather(project),
      collectIncidents(supabase, project.id),
      collectPhotos(supabase, project.id),
      collectValidatedTasks(supabase, project.id),
    ]);

    const { error: insertError } = await supabase.from('daily_reports').insert({
      project_id: project.id,
      date: todayIsoDate(),
      status: 'INTERNAL_REVIEW',
      weather,
      incidents,
      photos,
      validated_tasks: validatedTasks,
    });

    if (insertError) {
      console.error(`[daily-report] insert failed for project ${project.id}`, insertError.message);
      reports.push({ project_id: project.id, status: 'error' });
      continue;
    }

    reports.push({ project_id: project.id, status: 'created' });
  }

  return new Response(JSON.stringify({ status: 'ok', reports }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Project } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (project: Omit<Project, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => [data, ...prev]);
    return data;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const fetchPhases = async (projectId: string) => {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  };

  const fetchTasks = async (phaseId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('phase_id', phaseId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    fetchPhases,
    fetchTasks,
    refreshProjects: fetchProjects,
  };
};
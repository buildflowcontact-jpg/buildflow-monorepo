// app/providers/ProjectProvider.tsx
// Fournit à toute l'app le projet courant, la liste des projets,
// et la fonction switchProject (avec invalidation ciblée du cache React Query).
//
// S'appuie sur :
//   • useProjectStore (Zustand) — persiste l'id sélectionné
//   • useProjects (React Query) — charge la liste depuis Supabase
//   • queryClient — invalidation des queries scopées au projet
// -----------------------------------------------------------------------

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useProjects, type ProjectSummary } from "@/hooks/useProjects";
import { useProjectStore } from "@/store/projectStore";
import { queryClient } from "./queryClient";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface ProjectContextValue {
  /** Projet actuellement sélectionné (null si aucun projet disponible) */
  currentProject: ProjectSummary | null;
  currentProjectId: string | null;
  projects: ProjectSummary[];
  isLoading: boolean;
  /** Switch de projet avec invalidation des queries scopées */
  switchProject: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: projects = [], isLoading } = useProjects();
  const { currentProjectId, setCurrentProjectId } = useProjectStore();

  // Auto-sélection du premier projet disponible
  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [currentProjectId, projects, setCurrentProjectId]);

  const resolvedProjectId = currentProjectId ?? projects[0]?.id ?? null;
  const currentProject = projects.find((p) => p.id === resolvedProjectId) ?? null;

  const switchProject = useCallback(
    (projectId: string) => {
      if (projectId === currentProjectId) return;
      setCurrentProjectId(projectId);
      // Invalide toutes les queries liées à l'ancien projet
      // Les queries scoped utilisent ["<resource>", projectId] comme queryKey
      void queryClient.invalidateQueries();
    },
    [currentProjectId, setCurrentProjectId]
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      currentProject,
      currentProjectId: resolvedProjectId,
      projects,
      isLoading,
      switchProject,
    }),
    [currentProject, resolvedProjectId, projects, isLoading, switchProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside <ProjectProvider>");
  return ctx;
};

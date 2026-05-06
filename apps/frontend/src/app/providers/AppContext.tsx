// app/providers/AppContext.tsx
// Contexte global unifié — "cerveau de l'app".
//
// Expose en un seul hook :
//   user, project, role, can(), online, activeModule
//
// C'est le point d'entrée unique pour les composants qui ont besoin
// de connaître leur contexte d'exécution complet.
// -----------------------------------------------------------------------

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { ProjectSummary } from "@/hooks/useProjects";
import { useProject } from "./ProjectProvider";
import { usePermission, type ProjectRole, type Permission } from "./PermissionProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AppModule =
  | "terrain"
  | "executer"
  | "planifier"
  | "piloter"
  | "equipe"
  | "approvisionner"
  | "finance"
  | "rh-securite"
  | "commercial"
  | "kpi"
  | "time-tracking"
  | "audit"
  | "parametres"
  | null;

export interface AppContextValue {
  // Identité
  user: User | null;
  // Projet
  project: ProjectSummary | null;
  projectId: string | null;
  projects: ProjectSummary[];
  switchProject: (id: string) => void;
  // Permissions
  role: ProjectRole;
  can: (permission: Permission) => boolean;
  isLoadingRole: boolean;
  // Réseau
  online: boolean;
  // Navigation
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AppContextProvider: React.FC<{
  user: User | null;
  children: React.ReactNode;
}> = ({ user, children }) => {
  const {
    currentProject,
    currentProjectId,
    projects,
    switchProject,
  } = useProject();
  const { role, can, isLoadingRole } = usePermission();
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [activeModule, setActiveModule] = useState<AppModule>(null);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      project: currentProject,
      projectId: currentProjectId,
      projects,
      switchProject,
      role,
      can,
      isLoadingRole,
      online,
      activeModule,
      setActiveModule,
    }),
    [user, currentProject, currentProjectId, projects, switchProject, role, can, isLoadingRole, online, activeModule]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook principal — remplace useProject + usePermission pour les composants
// ---------------------------------------------------------------------------
export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside <AppContextProvider>");
  return ctx;
};

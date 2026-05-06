// app/providers/PermissionProvider.tsx
// Système de permissions basé sur le rôle de l'utilisateur dans le projet courant.
//
// Le rôle est chargé depuis project_members (Supabase).
// Les permissions sont calculées à partir d'une matrice statique.
// La fonction can() est exposée via usePermission().
// -----------------------------------------------------------------------

import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProject } from "./ProjectProvider";

// ---------------------------------------------------------------------------
// Types de rôles
// ---------------------------------------------------------------------------
export type ProjectRole =
  | "admin"
  | "chef_projet"
  | "chef_chantier"
  | "technicien"
  | "commercial"
  | "bureau_etudes"
  | "viewer";

const ROLE_ALIASES: Record<string, ProjectRole> = {
  ADMIN: 'admin',
  CHEF_PROJET: 'chef_projet',
  CHEF_CHANTIER: 'chef_chantier',
  TECHNICIEN: 'technicien',
  COMMERCIAL: 'commercial',
  BE: 'bureau_etudes',
  BUREAU_ETUDES: 'bureau_etudes',
  viewer: 'viewer',
  admin: 'admin',
  chef_projet: 'chef_projet',
  chef_chantier: 'chef_chantier',
  technicien: 'technicien',
  commercial: 'commercial',
  bureau_etudes: 'bureau_etudes',
};

// ---------------------------------------------------------------------------
// Permissions atomiques
// ---------------------------------------------------------------------------
export type Permission =
  | "incident:create"
  | "incident:update"
  | "incident:delete"
  | "incident:approve"
  | "incident:escalate"
  | "task:create"
  | "task:update"
  | "task:validate"
  | "task:delete"
  | "delivery:create"
  | "delivery:receive"
  | "finance:view"
  | "finance:export"
  | "member:manage"
  | "project:settings"
  | "audit:view"
  | "workflow:manage";

// ---------------------------------------------------------------------------
// Matrice de permissions par rôle
// ---------------------------------------------------------------------------
const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  admin: [
    "incident:create", "incident:update", "incident:delete", "incident:approve", "incident:escalate",
    "task:create", "task:update", "task:validate", "task:delete",
    "delivery:create", "delivery:receive",
    "finance:view", "finance:export",
    "member:manage", "project:settings",
    "audit:view", "workflow:manage",
  ],
  chef_projet: [
    "incident:create", "incident:update", "incident:approve", "incident:escalate",
    "task:create", "task:update", "task:validate",
    "delivery:create", "delivery:receive",
    "finance:view",
    "audit:view", "workflow:manage",
  ],
  chef_chantier: [
    "incident:create", "incident:update", "incident:escalate",
    "task:create", "task:update", "task:validate",
    "delivery:receive",
  ],
  technicien: [
    "incident:create", "incident:update",
    "task:update",
  ],
  commercial: [
    "incident:create",
    "delivery:create",
    "finance:view",
  ],
  bureau_etudes: [
    "incident:create", "incident:update",
    "task:create", "task:update",
    "audit:view",
  ],
  viewer: [],
};

// ---------------------------------------------------------------------------
// Fetch du rôle depuis project_members
// ---------------------------------------------------------------------------
const fetchProjectRole = async (
  projectId: string,
  userId: string
): Promise<ProjectRole> => {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return "viewer";
  return ROLE_ALIASES[String(data.role)] ?? "viewer";
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface PermissionContextValue {
  role: ProjectRole;
  can: (permission: Permission) => boolean;
  isLoadingRole: boolean;
}

const PermissionContext = createContext<PermissionContextValue>({
  role: "viewer",
  can: () => false,
  isLoadingRole: true,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const PermissionProvider: React.FC<{
  userId: string | undefined;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const { currentProjectId } = useProject();

  const { data: role = "viewer", isLoading } = useQuery<ProjectRole>({
    queryKey: ["project-role", currentProjectId, userId],
    queryFn: () => fetchProjectRole(currentProjectId!, userId!),
    enabled: !!currentProjectId && !!userId,
    staleTime: 60_000,
  });

  const can = useMemo(() => {
    const perms = new Set(ROLE_PERMISSIONS[role] ?? []);
    return (permission: Permission) => perms.has(permission);
  }, [role]);

  const value = useMemo<PermissionContextValue>(
    () => ({ role, can, isLoadingRole: isLoading }),
    [role, can, isLoading]
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export const usePermission = () => useContext(PermissionContext);

export const useRole = (): ProjectRole => useContext(PermissionContext).role;

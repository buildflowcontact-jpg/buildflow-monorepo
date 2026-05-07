// app/providers/PermissionProvider.tsx
import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useProject } from "./ProjectProvider";

export type ProjectRole =
  | "admin"
  | "chef_projet"
  | "chef_chantier"
  | "bureau_etudes"
  | "commercial"
  | "technicien"
  | "sous_traitant"
  | "viewer";

const ROLE_ALIASES: Record<string, ProjectRole> = {
  admin: "admin", ADMIN: "admin", owner: "admin",
  chef_projet: "chef_projet", CHEF_PROJET: "chef_projet", charge_projet: "chef_projet", chp: "chef_projet", manager: "chef_projet",
  chef_chantier: "chef_chantier", CHEF_CHANTIER: "chef_chantier", chc: "chef_chantier", site_manager: "chef_chantier",
  bureau_etudes: "bureau_etudes", BUREAU_ETUDES: "bureau_etudes", BE: "bureau_etudes", be: "bureau_etudes",
  commercial: "commercial", COMMERCIAL: "commercial", com: "commercial",
  technicien: "technicien", TECHNICIEN: "technicien", tech: "technicien",
  sous_traitant: "sous_traitant", SOUS_TRAITANT: "sous_traitant", subcontractor: "sous_traitant", st: "sous_traitant",
  viewer: "viewer", VIEWER: "viewer",
};

export type Permission =
  | "module:dashboard" | "module:terrain" | "module:executer" | "module:planifier"
  | "module:piloter" | "module:equipe" | "module:approvisionner" | "module:finance"
  | "module:incidents" | "module:rh" | "module:commercial" | "module:kpi"
  | "module:time" | "module:audit" | "module:parametres"
  | "dashboard:full" | "dashboard:operational" | "dashboard:personal" | "dashboard:limited"
  | "documents:read" | "documents:create" | "documents:update" | "documents:delete" | "documents:publish" | "documents:annotate"
  | "tasks:read" | "tasks:create" | "tasks:update" | "tasks:validate" | "tasks:delete" | "tasks:assign"
  | "incidents:read" | "incidents:read_critical" | "incidents:create" | "incidents:update"
  | "incidents:delete" | "incidents:approve" | "incidents:escalate" | "incidents:validate_terrain"
  | "procurement:read" | "procurement:create" | "procurement:manage" | "procurement:receive"
  | "finance:read" | "finance:full" | "finance:export"
  | "rh:read" | "rh:manage" | "team:invite" | "team:remove" | "team:manage_roles"
  | "commercial:read" | "commercial:full"
  | "time:personal" | "time:manage_team" | "time:read"
  | "audit:read" | "audit:limited"
  | "settings:update" | "workflow:manage" | "project:settings";

const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  admin: [
    "module:dashboard","module:terrain","module:executer","module:planifier",
    "module:piloter","module:equipe","module:approvisionner","module:finance",
    "module:incidents","module:rh","module:commercial","module:kpi",
    "module:time","module:audit","module:parametres",
    "dashboard:full",
    "documents:read","documents:create","documents:update","documents:delete","documents:publish","documents:annotate",
    "tasks:read","tasks:create","tasks:update","tasks:validate","tasks:delete","tasks:assign",
    "incidents:read","incidents:create","incidents:update","incidents:delete","incidents:approve","incidents:escalate","incidents:validate_terrain",
    "procurement:read","procurement:create","procurement:manage","procurement:receive",
    "finance:read","finance:full","finance:export",
    "rh:read","rh:manage","team:invite","team:remove","team:manage_roles",
    "commercial:read","commercial:full",
    "time:personal","time:manage_team","time:read",
    "audit:read",
    "settings:update","workflow:manage","project:settings",
  ],
  chef_projet: [
    "module:dashboard","module:terrain","module:executer","module:planifier",
    "module:piloter","module:equipe","module:approvisionner","module:finance",
    "module:incidents","module:rh","module:commercial","module:kpi",
    "module:time","module:audit","module:parametres",
    "dashboard:full",
    "documents:read","documents:create","documents:update","documents:delete","documents:publish","documents:annotate",
    "tasks:read","tasks:create","tasks:update","tasks:validate","tasks:delete","tasks:assign",
    "incidents:read","incidents:create","incidents:update","incidents:approve","incidents:escalate","incidents:validate_terrain",
    "procurement:read","procurement:create","procurement:manage","procurement:receive",
    "finance:read","finance:full","finance:export",
    "rh:read","rh:manage","team:invite","team:remove","team:manage_roles",
    "commercial:read",
    "time:read",
    "audit:read",
    "settings:update","workflow:manage","project:settings",
  ],
  chef_chantier: [
    "module:dashboard","module:terrain","module:executer","module:planifier",
    "module:piloter","module:equipe","module:approvisionner",
    "module:incidents","module:rh","module:kpi","module:time","module:parametres",
    "dashboard:operational",
    "documents:read","documents:annotate",
    "tasks:read","tasks:create","tasks:update","tasks:validate","tasks:assign",
    "incidents:read","incidents:create","incidents:update","incidents:escalate","incidents:validate_terrain",
    "procurement:read","procurement:receive",
    "rh:read","team:invite","team:remove",
    "time:personal","time:manage_team",
    "audit:limited",
    "settings:update",
  ],
  bureau_etudes: [
    "module:dashboard","module:executer","module:planifier",
    "module:piloter","module:approvisionner","module:incidents",
    "module:kpi","module:parametres",
    "dashboard:full",
    "documents:read","documents:create","documents:update","documents:delete","documents:publish","documents:annotate",
    "tasks:read","tasks:create","tasks:update","tasks:validate",
    "incidents:read","incidents:create","incidents:update",
    "procurement:read",
    "audit:read",
    "settings:update",
  ],
  commercial: [
    "module:dashboard","module:executer","module:planifier",
    "module:piloter","module:approvisionner","module:finance",
    "module:incidents","module:commercial","module:kpi","module:parametres",
    "dashboard:full",
    "documents:read",
    "tasks:read",
    "incidents:read_critical",
    "procurement:read",
    "finance:read",
    "commercial:read","commercial:full",
    "settings:update",
  ],
  technicien: [
    "module:dashboard","module:terrain","module:executer",
    "module:incidents","module:time","module:parametres",
    "dashboard:personal",
    "documents:read",
    "tasks:read","tasks:update",
    "incidents:read","incidents:create",
    "time:personal",
    "settings:update",
  ],
  sous_traitant: [
    "module:dashboard","module:terrain","module:executer",
    "module:incidents","module:time",
    "dashboard:limited",
    "documents:read",
    "tasks:read","tasks:update",
    "incidents:create",
    "time:personal",
  ],
  viewer: [
    "module:dashboard","module:executer",
    "dashboard:limited",
    "documents:read",
    "tasks:read",
    "incidents:read",
  ],
};

const fetchProjectRole = async (projectId: string, userId: string): Promise<ProjectRole> => {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return "viewer";
  return ROLE_ALIASES[String(data.role)] ?? "viewer";
};

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

export const PermissionProvider: React.FC<{ userId: string | undefined; children: React.ReactNode }> = ({ userId, children }) => {
  const { currentProjectId } = useProject();

  // En TanStack Query v5, enabled:false donne isLoading=false (contrairement à v4).
  // On active la requête seulement quand les deux IDs sont disponibles.
  const isEnabled = !!currentProjectId && !!userId;

  const { data: role = "viewer", isLoading } = useQuery<ProjectRole>({
    queryKey: ["project-role", currentProjectId, userId],
    queryFn: () => fetchProjectRole(currentProjectId!, userId!),
    enabled: isEnabled,
    staleTime: 60_000,
  });

  // Considère le rôle comme "en cours de chargement" tant que l'utilisateur est
  // connecté mais que le projet n'est pas encore résolu, pour éviter un flash viewer.
  const isLoadingRole = isLoading || (!!userId && !currentProjectId);

  const can = useMemo(() => {
    const perms = new Set(ROLE_PERMISSIONS[role] ?? []);
    return (permission: Permission) => perms.has(permission);
  }, [role]);

  const value = useMemo<PermissionContextValue>(
    () => ({ role, can, isLoadingRole }),
    [role, can, isLoadingRole]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermission = () => useContext(PermissionContext);
export const useRole = (): ProjectRole => useContext(PermissionContext).role;

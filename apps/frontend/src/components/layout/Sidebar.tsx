import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

interface SidebarProps {
  projects?: Array<{ id: string; name: string; code?: string }>;
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
  onSignOut?: () => void;
}

type NavItem = {
  permission: Parameters<ReturnType<typeof usePermission>['can']>[0];
  to: string;
  label: string;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Tableau de bord' },
  { permission: 'module:piloter', to: '/taches', label: 'Taches' },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning' },
  { permission: 'module:executer', to: '/documents', label: 'Documents' },
  { permission: 'module:equipe', to: '/equipe', label: 'Equipe' },
  { permission: 'module:approvisionner', to: '/approvisionner', label: 'Appro' },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents terrain' },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-3 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-3 font-semibold transition-colors';
}

export function Sidebar({ projects = [], selectedProjectId, onProjectChange, onSignOut }: SidebarProps) {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));

  return (
    <aside className="hidden md:flex md:w-[300px] md:flex-shrink-0 md:h-screen md:border-r md:border-slate-200/70 md:bg-white/70 md:backdrop-blur-sm">
      <nav className="w-full h-full overflow-y-auto px-5 py-6 space-y-6" aria-label="Navigation principale modules et projets">
        <div className="space-y-3">
          {projects.length > 0 && onProjectChange ? (
            <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide bf-text-muted">
              Changer de projet
              <select
                value={selectedProjectId ?? projects[0]?.id ?? ''}
                onChange={(event) => onProjectChange(event.target.value)}
                className="bf-select rounded-xl px-3 py-2.5 text-sm font-semibold normal-case tracking-normal outline-none transition-colors"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}{project.code ? ` (${project.code})` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] bf-text-muted mb-2 font-bold">Modules</p>
          <div className="flex flex-col gap-2">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => viewLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </div>
        </div>

        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            className="bf-button-secondary w-full rounded-xl px-4 py-3 text-sm font-semibold text-left"
          >
            Deconnexion
          </button>
        ) : null}
      </nav>
    </aside>
  );
}


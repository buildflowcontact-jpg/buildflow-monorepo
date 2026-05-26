import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

interface SidebarProps {
  projects?: Array<{ id: string; name: string; code?: string }>;
  selectedProjectId?: string | null;
  onProjectChange?: (projectId: string) => void;
  onSignOut?: () => void;
  currentUser?: {
    name: string;
    email?: string;
    profile?: string;
  };
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

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Sidebar({ projects = [], selectedProjectId, onProjectChange, currentUser }: SidebarProps) {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));
  const initials = getInitials(currentUser?.name ?? 'Compte');

  return (
    <aside className="hidden md:flex md:w-[300px] md:flex-shrink-0 md:h-screen md:border-r md:border-slate-200/70 md:bg-white/70 md:backdrop-blur-sm">
      <nav className="flex h-full w-full flex-col overflow-y-auto px-5 py-6" aria-label="Navigation principale modules et projets">
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

        <div className="mt-6 flex-1">
          <p className="text-[11px] uppercase tracking-[0.12em] bf-text-muted mb-2 font-bold">Modules</p>
          <div className="flex flex-col gap-2">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => viewLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </div>
        </div>

        <div className="mt-6 border-t border-slate-200/80 pt-4">
          <NavLink
            to="/parametres"
            className={({ isActive }) => `${isActive ? 'bf-nav-link bf-nav-link-active' : 'bf-nav-link'} flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition-colors`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
              {initials}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-black bf-text-primary">{currentUser?.name ?? 'Compte utilisateur'}</span>
              <span className="block truncate text-xs bf-text-muted">
                {currentUser?.profile ?? currentUser?.email ?? 'Profil et preferences'}
              </span>
            </span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}


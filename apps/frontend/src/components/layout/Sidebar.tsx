import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardList, FileText, FolderKanban, Home, PackageSearch, Settings2, Users2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  icon: LucideIcon;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Tableau de bord', icon: Home },
  { permission: 'module:piloter', to: '/taches', label: 'Taches', icon: ClipboardList },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning', icon: CalendarDays },
  { permission: 'module:executer', to: '/documents', label: 'Documents', icon: FileText },
  { permission: 'module:equipe', to: '/equipe', label: 'Equipe', icon: Users2 },
  { permission: 'module:approvisionner', to: '/approvisionner', label: 'Approvisionnements', icon: PackageSearch },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents terrain', icon: AlertTriangle },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 font-semibold text-blue-700'
    : 'bf-nav-link rounded-xl border border-transparent px-3 py-2.5 font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900';
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
    <aside className="hidden md:flex md:h-screen md:w-[262px] md:flex-shrink-0 md:border-r md:border-slate-200 md:bg-white">
      <nav className="flex h-full w-full flex-col overflow-y-auto px-4 py-5" aria-label="Navigation principale modules et projets">
        <div className="px-2 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FolderKanban size={19} />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">BuildFlow</p>
              <p className="text-xs text-slate-500">Hub chantier</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {projects.length > 0 && onProjectChange ? (
            <label className="flex flex-col gap-1 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Projet actif
              <select
                value={selectedProjectId ?? projects[0]?.id ?? ''}
                onChange={(event) => onProjectChange(event.target.value)}
                className="bf-select rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none transition-colors"
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

        <div className="mt-5 flex-1">
          <div className="flex flex-col gap-1.5">
            {visibleEssentialItems.map((item) => (
              <NavLink key={`${item.to}-${item.label}`} to={item.to} className={({ isActive }) => `${viewLinkClass(isActive)} flex items-center gap-3`}>
                <item.icon size={16} className="shrink-0" />
                <span className="min-w-0 truncate text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <NavLink
            to="/parametres"
            className={({ isActive }) => `${isActive ? 'bf-nav-link bf-nav-link-active border-blue-200 bg-blue-50 text-blue-700' : 'bf-nav-link border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'} flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">
              {initials || <Settings2 size={18} />}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-black">{currentUser?.name ?? 'Compte utilisateur'}</span>
              <span className="block truncate text-xs text-slate-500">
                {currentUser?.profile ?? currentUser?.email ?? 'Profil et preferences'}
              </span>
            </span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}


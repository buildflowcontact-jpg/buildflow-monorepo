import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, Briefcase, CalendarDays, ClipboardList, FileText, FolderKanban, Home, PackageSearch, Settings2, ShieldCheck, Users2 } from 'lucide-react';
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
  { permission: 'module:dashboard', to: '/dashboard', label: 'Projets', icon: Briefcase },
  { permission: 'module:piloter', to: '/taches', label: 'Taches', icon: ClipboardList },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning', icon: CalendarDays },
  { permission: 'module:executer', to: '/documents', label: 'Documents', icon: FileText },
  { permission: 'module:equipe', to: '/equipe', label: 'Equipe', icon: Users2 },
  { permission: 'module:approvisionner', to: '/approvisionner', label: 'Approvisionnements', icon: PackageSearch },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents terrain', icon: AlertTriangle },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 font-semibold text-blue-700 shadow-[inset_3px_0_0_#2563eb]'
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

const RAIL_ITEMS = [Home, FolderKanban, ShieldCheck];

export function Sidebar({ projects = [], selectedProjectId, onProjectChange, currentUser }: SidebarProps) {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));
  const initials = getInitials(currentUser?.name ?? 'Compte');

  return (
    <aside className="hidden md:flex md:h-screen md:w-[292px] md:flex-shrink-0 md:overflow-hidden md:border-r md:border-slate-200 md:bg-white">
      <div className="flex h-full w-full">
        <div className="flex w-[72px] flex-col items-center gap-4 bg-[#081735] px-3 py-4 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_16px_30px_-20px_rgba(59,130,246,0.9)]">
            <FolderKanban size={20} />
          </div>
          <div className="mt-2 flex flex-col gap-3">
            {RAIL_ITEMS.map((Icon, index) => (
              <button
                key={`${Icon.displayName ?? 'rail'}-${index}`}
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${index === 0 ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
          <div className="mt-auto">
            <NavLink
              to="/parametres"
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings2 size={18} />
            </NavLink>
          </div>
        </div>

        <nav className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto bg-white px-4 py-5" aria-label="Navigation principale modules et projets">
          <div className="px-2 pb-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">BuildFlow</p>
                <p className="text-xs text-slate-500">Hub chantier</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {projects.length > 0 && onProjectChange ? (
              <label className="flex flex-col gap-1 px-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Projet actif
                <select
                  value={selectedProjectId ?? projects[0]?.id ?? ''}
                  onChange={(event) => onProjectChange(event.target.value)}
                  className="bf-select rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none transition-colors"
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

          <div className="mt-4 flex-1">
            <div className="flex flex-col gap-1.5">
              {visibleEssentialItems.map((item) => (
                <NavLink key={`${item.to}-${item.label}`} to={item.to} className={({ isActive }) => `${viewLinkClass(isActive)} flex items-center gap-3`}>
                  <item.icon size={16} className="shrink-0" />
                  <span className="min-w-0 truncate text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <NavLink
              to="/parametres"
              className={({ isActive }) => `${isActive ? 'bf-nav-link bf-nav-link-active border-blue-200 bg-blue-50 text-blue-700' : 'bf-nav-link border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'} flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
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
      </div>
    </aside>
  );
}


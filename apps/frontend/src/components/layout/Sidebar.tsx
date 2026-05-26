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
  section: 'pilotage' | 'terrain';
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Dashboard', icon: Home, section: 'pilotage' },
  { permission: 'module:piloter', to: '/taches', label: 'Taches', icon: ClipboardList, section: 'pilotage' },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning', icon: CalendarDays, section: 'pilotage' },
  { permission: 'module:executer', to: '/documents', label: 'Documents', icon: FileText, section: 'pilotage' },
  { permission: 'module:equipe', to: '/equipe', label: 'Equipe', icon: Users2, section: 'terrain' },
  { permission: 'module:approvisionner', to: '/approvisionner', label: 'Appro', icon: PackageSearch, section: 'terrain' },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents', icon: AlertTriangle, section: 'terrain' },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-2xl border border-cyan-400/20 bg-white text-slate-950 px-3.5 py-3 font-semibold shadow-[0_16px_32px_-20px_rgba(34,211,238,0.7)]'
    : 'bf-nav-link rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-3 font-semibold text-slate-200 transition-colors hover:border-cyan-400/15 hover:bg-white/[0.06] hover:text-white';
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
  const pilotageItems = visibleEssentialItems.filter((item) => item.section === 'pilotage');
  const terrainItems = visibleEssentialItems.filter((item) => item.section === 'terrain');
  const initials = getInitials(currentUser?.name ?? 'Compte');

  return (
    <aside className="hidden md:flex md:h-screen md:w-[248px] md:flex-shrink-0 md:border-r md:border-slate-900/80 md:bg-slate-950 md:text-white">
      <nav className="flex h-full w-full flex-col overflow-y-auto px-4 py-5" aria-label="Navigation principale modules et projets">
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.9)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
              <FolderKanban size={20} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">BuildFlow</p>
              <p className="mt-1 text-sm font-semibold text-white">Poste de pilotage</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/8 bg-slate-900/70 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Chantier actif</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-100">{projects.find((project) => project.id === selectedProjectId)?.name ?? projects[0]?.name ?? 'Aucun projet'}</p>
            <p className="mt-1 text-xs text-slate-400">Selection rapide et navigation modules</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {projects.length > 0 && onProjectChange ? (
            <label className="flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              Changer de projet
              <select
                value={selectedProjectId ?? projects[0]?.id ?? ''}
                onChange={(event) => onProjectChange(event.target.value)}
                className="bf-select rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-white outline-none transition-colors"
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

        <div className="mt-5 flex-1 space-y-5">
          <div>
            <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Pilotage</p>
            <div className="flex flex-col gap-2">
              {pilotageItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `${viewLinkClass(isActive)} flex items-center gap-3`}>
                  <item.icon size={17} className="shrink-0" />
                  <span className="min-w-0 truncate text-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>

          {terrainItems.length > 0 ? (
            <div>
              <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Terrain</p>
              <div className="flex flex-col gap-2">
                {terrainItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `${viewLinkClass(isActive)} flex items-center gap-3`}>
                    <item.icon size={17} className="shrink-0" />
                    <span className="min-w-0 truncate text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-5 border-t border-white/8 pt-4">
          <NavLink
            to="/parametres"
            className={({ isActive }) => `${isActive ? 'bf-nav-link bf-nav-link-active bg-white text-slate-950 border-cyan-400/20' : 'bf-nav-link border border-white/8 bg-white/[0.04] text-slate-100 hover:border-cyan-400/15 hover:bg-white/[0.06]'} flex w-full items-center gap-3 rounded-[22px] px-3.5 py-3 transition-colors`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-sm font-black text-cyan-100">
              {initials || <Settings2 size={18} />}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-black">{currentUser?.name ?? 'Compte utilisateur'}</span>
              <span className="block truncate text-xs text-slate-400">
                {currentUser?.profile ?? currentUser?.email ?? 'Profil et preferences'}
              </span>
            </span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}


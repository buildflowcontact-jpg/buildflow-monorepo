import React from 'react';
import { ProjectSwitcher } from '../shared/ProjectSwitcher';
import { SearchGlobal } from '../shared/SearchGlobal';
import { NotificationBell } from '../../modules/notifications/components/NotificationBell';
import { ThemePicker } from './ThemePicker';
import { OfflineBadge } from '../ui/OfflineBadge';

interface HeaderProps {
  userRole: string;
  email: string;
  onSignOut: () => void;
  statusLabel: string;
  projectId: string;
}

export function Header({ userRole, email, onSignOut, statusLabel, projectId }: HeaderProps) {
  const shortEmail = email.length > 28 ? `${email.slice(0, 25)}...` : email;

  return (
    <header className="bf-header sticky top-0 z-40">
      <div className="w-full px-4 md:px-8 xl:px-10 py-3 flex flex-wrap items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/logo.png" alt="BuildFlow" className="h-11 w-11 rounded-xl object-contain bf-logo" />
          <div className="min-w-0">
            <p className="text-lg leading-5 font-black bf-text-primary tracking-tight">BuildFlow</p>
            <p className="text-[11px] uppercase tracking-[0.12em] bf-text-muted">Cockpit operationnel chantier</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs min-w-0">
          <ProjectSwitcher />
          <SearchGlobal />
          <OfflineBadge />
          <NotificationBell projectId={projectId} />
          <ThemePicker />
          <span className="bf-badge bf-badge-status px-2 py-1 rounded-full font-semibold">{statusLabel}</span>
          <span className="bf-badge px-2 py-1 rounded-full font-semibold">{userRole}</span>
          <span className="bf-badge px-2 py-1 rounded-full max-w-[220px] truncate" title={email}>{shortEmail}</span>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onSignOut}
            className="bf-button-secondary rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
          >
            Sortir
          </button>
        </div>

        <div className="md:hidden w-full bf-header-mobile-panel rounded-2xl px-3 py-3 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="bf-badge bf-badge-status px-2 py-1 rounded-full font-semibold whitespace-nowrap">{statusLabel}</span>
            <span className="bf-badge px-2 py-1 rounded-full font-semibold whitespace-nowrap">{userRole}</span>
            <span className="bf-badge px-2 py-1 rounded-full max-w-[180px] truncate whitespace-nowrap" title={email}>{shortEmail}</span>
          </div>
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs bf-text-muted">
            <span className="bf-badge px-2 py-1 rounded-full font-semibold whitespace-nowrap">Vue mobile active</span>
            <span className="truncate">Recherche et alertes disponibles dans la barre principale desktop.</span>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="bf-button-secondary hidden md:inline-flex rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}

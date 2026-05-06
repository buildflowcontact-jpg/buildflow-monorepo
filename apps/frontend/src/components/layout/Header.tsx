import React from 'react';
import { SearchGlobal } from '../shared/SearchGlobal';
import { NotificationBell } from '../../modules/notifications/components/NotificationBell';
import { ThemePicker } from './ThemePicker';

interface HeaderProps {
  userRole: string;
  email: string;
  onSignOut: () => void;
  statusLabel: string;
  projectId: string;
}

export function Header({ userRole, email, onSignOut, statusLabel, projectId }: HeaderProps) {
  return (
    <header className="bf-header sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BuildFlow" className="h-11 w-11 rounded-xl object-contain bf-logo" />
          <div>
            <p className="text-lg leading-5 font-black bf-text-primary">BuildFlow</p>
            <p className="text-xs bf-text-muted">Cockpit operationnel chantier</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs">
          <SearchGlobal />
          <NotificationBell projectId={projectId} />
          <ThemePicker />
          <span className="bf-badge bf-badge-status px-2 py-1 rounded-full font-semibold">{statusLabel}</span>
          <span className="bf-badge px-2 py-1 rounded-full font-semibold">{userRole}</span>
          <span className="bf-badge px-2 py-1 rounded-full">{email}</span>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemePicker />
          <SearchGlobal />
        </div>

        <button
          onClick={onSignOut}
          className="bf-button-secondary rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
        >
          Deconnexion
        </button>
      </div>
    </header>
  );
}

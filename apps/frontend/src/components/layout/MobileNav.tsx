import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function MobileNav() {
  const { can } = usePermission();

  return (
    <nav className="bf-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 flex gap-1 overflow-x-auto">
      {can('module:dashboard')      && <NavLink to="/dashboard"      className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>🏠</NavLink>}
      {can('module:piloter')        && <NavLink to="/piloter"         className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Taches</NavLink>}
      {can('module:planifier')      && <NavLink to="/planifier"       className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Plan</NavLink>}
      {can('module:executer')       && <NavLink to="/executer"        className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Docs</NavLink>}
      {can('module:equipe')         && <NavLink to="/equipe"          className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Equipe</NavLink>}
      {can('module:approvisionner') && <NavLink to="/approvisionner"  className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Appro</NavLink>}
      {can('module:terrain')        && <NavLink to="/terrain"         className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Retour chantier</NavLink>}
    </nav>
  );
}


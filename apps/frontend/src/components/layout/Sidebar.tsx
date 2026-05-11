import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function Sidebar() {
  const { can } = usePermission();

  return (
    <nav className="hidden md:flex items-center gap-2 mb-6 flex-wrap">
      {can('module:dashboard')      && <NavLink to="/dashboard"      className={({ isActive }) => viewLinkClass(isActive)}>Tableau de bord</NavLink>}
      {can('module:piloter')        && <NavLink to="/taches"          className={({ isActive }) => viewLinkClass(isActive)}>Tâches</NavLink>}
      {can('module:planifier')      && <NavLink to="/planifier"       className={({ isActive }) => viewLinkClass(isActive)}>Planning</NavLink>}
      {can('module:executer')       && <NavLink to="/documents"       className={({ isActive }) => viewLinkClass(isActive)}>Documents</NavLink>}
      {can('module:equipe')         && <NavLink to="/equipe"          className={({ isActive }) => viewLinkClass(isActive)}>Equipe</NavLink>}
      {can('module:approvisionner') && <NavLink to="/approvisionner"  className={({ isActive }) => viewLinkClass(isActive)}>Appro</NavLink>}
      {can('module:terrain')        && <NavLink to="/retour-chantier" className={({ isActive }) => viewLinkClass(isActive)}>Retour chantier</NavLink>}
    </nav>
  );
}


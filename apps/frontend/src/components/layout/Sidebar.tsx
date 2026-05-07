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
      {can('module:dashboard')      && <NavLink to="/dashboard"       className={({ isActive }) => viewLinkClass(isActive)}>🌐 Dashboard</NavLink>}
      {can('module:terrain')        && <NavLink to="/terrain"         className={({ isActive }) => viewLinkClass(isActive)}>🚨 Terrain</NavLink>}
      {can('module:executer')       && <NavLink to="/executer"        className={({ isActive }) => viewLinkClass(isActive)}>Executer</NavLink>}
      {can('module:planifier')      && <NavLink to="/planifier"       className={({ isActive }) => viewLinkClass(isActive)}>Planifier</NavLink>}
      {can('module:piloter')        && <NavLink to="/piloter"         className={({ isActive }) => viewLinkClass(isActive)}>Piloter</NavLink>}
      {can('module:equipe')         && <NavLink to="/equipe"          className={({ isActive }) => viewLinkClass(isActive)}>Equipe</NavLink>}
      {can('module:approvisionner') && <NavLink to="/approvisionner"  className={({ isActive }) => viewLinkClass(isActive)}>Appro</NavLink>}
      {can('module:finance')        && <NavLink to="/finance"         className={({ isActive }) => viewLinkClass(isActive)}>Finance</NavLink>}
      {can('module:incidents')      && <NavLink to="/incidents"       className={({ isActive }) => viewLinkClass(isActive)}>Incidents</NavLink>}
      {can('module:rh')             && <NavLink to="/rh-securite"     className={({ isActive }) => viewLinkClass(isActive)}>RH</NavLink>}
      {can('module:commercial')     && <NavLink to="/commercial"      className={({ isActive }) => viewLinkClass(isActive)}>Commercial</NavLink>}
      {can('module:kpi')            && <NavLink to="/kpi"             className={({ isActive }) => viewLinkClass(isActive)}>KPI</NavLink>}
      {can('module:time')           && <NavLink to="/time-tracking"   className={({ isActive }) => viewLinkClass(isActive)}>Temps</NavLink>}
      {can('module:parametres')     && <NavLink to="/parametres"      className={({ isActive }) => viewLinkClass(isActive)}>Parametres</NavLink>}
      {can('module:audit')          && <NavLink to="/audit"           className={({ isActive }) => viewLinkClass(isActive)}>🔐 Audit</NavLink>}
    </nav>
  );
}


import React from 'react';
import { NavLink } from 'react-router-dom';

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function MobileNav() {
  return (
    <nav className="bf-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 flex gap-1">
      <NavLink to="/terrain" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>🚨</NavLink>
      <NavLink to="/executer" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Executer</NavLink>
      <NavLink to="/planifier" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Planifier</NavLink>
      <NavLink to="/piloter" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Piloter</NavLink>
      <NavLink to="/equipe" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Equipe</NavLink>
      <NavLink to="/approvisionner" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Appro</NavLink>
      <NavLink to="/finance" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Finance</NavLink>
      <NavLink to="/rh-securite" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>RH</NavLink>
      <NavLink to="/commercial" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Commercial</NavLink>
      <NavLink to="/kpi" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>KPI</NavLink>
      <NavLink to="/time-tracking" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Temps</NavLink>
      <NavLink to="/parametres" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>Params</NavLink>
      <NavLink to="/audit" className={({ isActive }) => `flex-1 text-xs text-center ${viewLinkClass(isActive)}`}>🔐</NavLink>
    </nav>
  );
}

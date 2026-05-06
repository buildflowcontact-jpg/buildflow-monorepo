import React from 'react';
import { NavLink } from 'react-router-dom';

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function Sidebar() {
  return (
    <nav className="hidden md:flex items-center gap-2 mb-6">
      <NavLink to="/terrain" className={({ isActive }) => viewLinkClass(isActive)}>🚨 Terrain</NavLink>
      <NavLink to="/executer" className={({ isActive }) => viewLinkClass(isActive)}>Executer</NavLink>
      <NavLink to="/planifier" className={({ isActive }) => viewLinkClass(isActive)}>Planifier</NavLink>
      <NavLink to="/piloter" className={({ isActive }) => viewLinkClass(isActive)}>Piloter</NavLink>
      <NavLink to="/equipe" className={({ isActive }) => viewLinkClass(isActive)}>Equipe</NavLink>
      <NavLink to="/approvisionner" className={({ isActive }) => viewLinkClass(isActive)}>Appro</NavLink>
      <NavLink to="/finance" className={({ isActive }) => viewLinkClass(isActive)}>Finance</NavLink>
      <NavLink to="/rh-securite" className={({ isActive }) => viewLinkClass(isActive)}>RH</NavLink>
      <NavLink to="/commercial" className={({ isActive }) => viewLinkClass(isActive)}>Commercial</NavLink>
      <NavLink to="/kpi" className={({ isActive }) => viewLinkClass(isActive)}>KPI</NavLink>
      <NavLink to="/time-tracking" className={({ isActive }) => viewLinkClass(isActive)}>Temps</NavLink>
      <NavLink to="/parametres" className={({ isActive }) => viewLinkClass(isActive)}>Parametres</NavLink>
      <NavLink to="/audit" className={({ isActive }) => viewLinkClass(isActive)}>🔐 Audit</NavLink>
    </nav>
  );
}

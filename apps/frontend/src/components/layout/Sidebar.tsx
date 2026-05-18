import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

type NavItem = {
  permission: Parameters<ReturnType<typeof usePermission>['can']>[0];
  to: string;
  label: string;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Tableau de bord' },
  { permission: 'module:piloter', to: '/taches', label: 'Taches' },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning' },
  { permission: 'module:planifier', to: '/schedule', label: 'Planning equipes' },
  { permission: 'module:executer', to: '/executer', label: 'Execution' },
  { permission: 'module:equipe', to: '/equipe', label: 'Equipe' },
  { permission: 'module:approvisionner', to: '/approvisionner', label: 'Appro' },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents terrain' },
];

const ADVANCED_ITEMS: NavItem[] = [
  { permission: 'module:finance', to: '/finance', label: 'Finance' },
  { permission: 'module:commercial', to: '/commercial', label: 'Commercial' },
  { permission: 'module:kpi', to: '/kpi', label: 'KPI' },
  { permission: 'module:time', to: '/time-tracking', label: 'Temps' },
  { permission: 'module:rh', to: '/rh-securite', label: 'RH securite' },
  { permission: 'module:audit', to: '/audit', label: 'Audit' },
  { permission: 'module:parametres', to: '/parametres', label: 'Parametres' },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function Sidebar() {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));
  const visibleAdvancedItems = ADVANCED_ITEMS.filter((item) => can(item.permission));

  return (
    <nav className="hidden md:block mb-6 space-y-3" aria-label="Navigation principale modules">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] bf-text-muted mb-2 font-bold">Essentiels</p>
        <div className="flex items-center gap-2 flex-wrap">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => viewLinkClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {visibleAdvancedItems.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] bf-text-muted mb-2 font-bold">Avances</p>
          <div className="flex items-center gap-2 flex-wrap">
            {visibleAdvancedItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => viewLinkClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}


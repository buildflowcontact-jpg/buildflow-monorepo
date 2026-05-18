import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '@/app/providers/PermissionProvider';

type NavItem = {
  permission: Parameters<ReturnType<typeof usePermission>['can']>[0];
  to: string;
  label: string;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Accueil' },
  { permission: 'module:piloter', to: '/taches', label: 'Taches' },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning' },
  { permission: 'module:executer', to: '/executer', label: 'Execution' },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents' },
];

const ADVANCED_ITEMS: NavItem[] = [
  { permission: 'module:finance', to: '/finance', label: 'Finance' },
  { permission: 'module:commercial', to: '/commercial', label: 'Commercial' },
  { permission: 'module:kpi', to: '/kpi', label: 'KPI' },
  { permission: 'module:time', to: '/time-tracking', label: 'Temps' },
  { permission: 'module:rh', to: '/rh-securite', label: 'RH' },
  { permission: 'module:audit', to: '/audit', label: 'Audit' },
  { permission: 'module:parametres', to: '/parametres', label: 'Reglages' },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function MobileNav() {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));
  const visibleAdvancedItems = ADVANCED_ITEMS.filter((item) => can(item.permission));

  return (
    <nav className="bf-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2 space-y-2" aria-label="Navigation mobile modules">
      <div className="space-y-1">
        <p className="px-1 text-[10px] uppercase tracking-[0.12em] bf-text-muted font-bold">Essentiels</p>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `text-xs text-center whitespace-nowrap ${viewLinkClass(isActive)}`}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {visibleAdvancedItems.length > 0 ? (
        <div className="space-y-1">
          <p className="px-1 text-[10px] uppercase tracking-[0.12em] bf-text-muted font-bold">Avances</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {visibleAdvancedItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `text-xs text-center whitespace-nowrap ${viewLinkClass(isActive)}`}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}


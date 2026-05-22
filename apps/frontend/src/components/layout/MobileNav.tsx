import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, BarChart3, Briefcase, CalendarDays, ClipboardList, Clock3, Home, Settings2, Shield, Wallet, Wrench } from 'lucide-react';
import { usePermission } from '@/app/providers/PermissionProvider';

type NavItem = {
  permission: Parameters<ReturnType<typeof usePermission>['can']>[0];
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Accueil', icon: Home },
  { permission: 'module:piloter', to: '/taches', label: 'Taches', icon: ClipboardList },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning', icon: CalendarDays },
  { permission: 'module:executer', to: '/executer', label: 'Execution', icon: Wrench },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents', icon: AlertTriangle },
];

const ADVANCED_ITEMS: NavItem[] = [
  { permission: 'module:finance', to: '/finance', label: 'Finance', icon: Wallet },
  { permission: 'module:commercial', to: '/commercial', label: 'Commercial', icon: Briefcase },
  { permission: 'module:kpi', to: '/kpi', label: 'KPI', icon: BarChart3 },
  { permission: 'module:time', to: '/time-tracking', label: 'Temps', icon: Clock3 },
  { permission: 'module:rh', to: '/rh-securite', label: 'RH', icon: Shield },
  { permission: 'module:audit', to: '/audit', label: 'Audit', icon: ClipboardList },
  { permission: 'module:parametres', to: '/parametres', label: 'Reglages', icon: Settings2 },
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
        <div className="bf-mobile-nav-scroller flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `bf-mobile-nav-tile text-xs text-center whitespace-nowrap snap-start min-w-[88px] ${viewLinkClass(isActive)}`}>
              <item.icon size={16} className="mx-auto mb-1.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {visibleAdvancedItems.length > 0 ? (
        <div className="space-y-1">
          <p className="px-1 text-[10px] uppercase tracking-[0.12em] bf-text-muted font-bold">Modules avances</p>
          <div className="bf-mobile-nav-scroller flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
            {visibleAdvancedItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `bf-mobile-nav-tile text-xs text-center whitespace-nowrap snap-start min-w-[88px] ${viewLinkClass(isActive)}`}>
                <item.icon size={16} className="mx-auto mb-1.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}


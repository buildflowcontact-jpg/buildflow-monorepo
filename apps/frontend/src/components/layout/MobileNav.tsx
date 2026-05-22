import React from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, CalendarDays, ClipboardList, FileText, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePermission } from '@/app/providers/PermissionProvider';

type NavItem = {
  permission: Parameters<ReturnType<typeof usePermission>['can']>[0];
  to: string;
  label: string;
  icon: LucideIcon;
};

const ESSENTIAL_ITEMS: NavItem[] = [
  { permission: 'module:dashboard', to: '/dashboard', label: 'Accueil', icon: Home },
  { permission: 'module:piloter', to: '/taches', label: 'Taches', icon: ClipboardList },
  { permission: 'module:planifier', to: '/planifier', label: 'Planning', icon: CalendarDays },
  { permission: 'module:executer', to: '/documents', label: 'Documents', icon: FileText },
  { permission: 'module:terrain', to: '/incidents', label: 'Incidents', icon: AlertTriangle },
];

function viewLinkClass(isActive: boolean) {
  return isActive
    ? 'bf-nav-link bf-nav-link-active rounded-xl px-4 py-2 font-semibold shadow-sm'
    : 'bf-nav-link rounded-xl px-4 py-2 font-semibold transition-colors';
}

export function MobileNav() {
  const { can } = usePermission();
  const visibleEssentialItems = ESSENTIAL_ITEMS.filter((item) => can(item.permission));

  return (
    <nav className="bf-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 py-2" aria-label="Navigation mobile modules">
      <div className="bf-mobile-nav-scroller flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {visibleEssentialItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `bf-mobile-nav-tile text-xs text-center whitespace-nowrap snap-start min-w-[88px] ${viewLinkClass(isActive)}`}>
              <item.icon size={16} className="mx-auto mb-1.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </div>
    </nav>
  );
}


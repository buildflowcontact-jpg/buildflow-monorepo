// modules/terrain/components/CriticalAlerts.tsx
import React from 'react';
import type { TerrainAlert } from '../types';

interface CriticalAlertsProps {
  alerts: TerrainAlert[];
}

const alertStyle: Record<TerrainAlert['type'], string> = {
  danger:  'bg-red-600/90 border-red-500',
  warning: 'bg-orange-600/80 border-orange-500',
  info:    'bg-blue-600/80 border-blue-500',
};

const alertIcon: Record<TerrainAlert['type'], string> = {
  danger:  '🚨',
  warning: '⚠️',
  info:    'ℹ️',
};

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="px-3 py-2 space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-sm font-bold text-white ${alertStyle[a.type]}`}
        >
          <span className="text-base shrink-0">{alertIcon[a.type]}</span>
          <span className="leading-tight">{a.label}</span>
        </div>
      ))}
    </div>
  );
};

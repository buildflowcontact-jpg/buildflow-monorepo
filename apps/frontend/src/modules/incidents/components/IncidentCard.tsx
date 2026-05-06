// modules/incidents/components/IncidentCard.tsx
import React from 'react';
import type { IncidentRow } from '../types';
import { formatDate, timeAgo } from '@/utils/date';
import { severityColor, statusColor } from '@/utils/helpers';

interface IncidentCardProps {
  incident: IncidentRow;
  onSelect?: (incident: IncidentRow) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onSelect }) => {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(incident)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {incident.title}
        </h3>
        <div className="flex gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor(incident.severity)}`}>
            {incident.severity ?? 'N/A'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(incident.status)}`}>
            {incident.status ?? 'N/A'}
          </span>
        </div>
      </div>
      {incident.description && (
        <p className="text-gray-500 text-xs mt-1 line-clamp-2">{incident.description}</p>
      )}
      <p className="text-gray-400 text-xs mt-2">{timeAgo(incident.created_at)}</p>
    </div>
  );
};

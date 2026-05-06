import React from 'react';
import { timeAgo } from '@/utils/date';
import type { ActivityTimelineItem } from '@/modules/audit/hooks/useActivityTimeline';

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  title?: string;
  emptyLabel?: string;
}

const ACTION_TONE: Record<string, string> = {
  incident_created: 'bg-red-100 text-red-700',
  incident_escalated: 'bg-orange-100 text-orange-700',
  task_completed: 'bg-emerald-100 text-emerald-700',
  task_validated: 'bg-blue-100 text-blue-700',
};

export function ActivityTimeline({
  items,
  title = 'Activité récente',
  emptyLabel = 'Aucune activité récente.'
}: ActivityTimelineProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">Timeline lisible dérivée de la couche activity_logs</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="pt-1">
                <span className="block w-2.5 h-2.5 rounded-full bg-slate-900" />
              </div>
              <div className="flex-1 min-w-0 border-l border-slate-200 pl-4 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_TONE[item.action] ?? 'bg-slate-100 text-slate-700'}`}>
                    {item.action}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(item.created_at)}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                ) : null}
                <div className="mt-1 text-xs text-slate-400 flex gap-3 flex-wrap">
                  <span>{item.entity_type}</span>
                  {item.entity_id ? <span className="font-mono">{item.entity_id.slice(0, 8)}…</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

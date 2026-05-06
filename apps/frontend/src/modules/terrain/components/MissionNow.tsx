// modules/terrain/components/MissionNow.tsx
// Affiche les 3 tâches actives du worker — action-first
import React from 'react';
import type { TerrainTask } from '../types';

interface MissionNowProps {
  tasks: TerrainTask[];
}

const priorityDot: Record<string, string> = {
  high:     'bg-red-500',
  medium:   'bg-yellow-500',
  low:      'bg-green-500',
  critical: 'bg-red-600',
};

export const MissionNow: React.FC<MissionNowProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-neutral-500 text-sm">Aucune tâche active.</p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-2 font-semibold">
        🎯 Ma mission maintenant
      </h3>

      <div className="space-y-2">
        {tasks.slice(0, 3).map((task) => (
          <div
            key={task.id}
            className="bg-neutral-800 border border-neutral-700 px-3 py-3 rounded-2xl flex items-center gap-3"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority ?? 'low'] ?? 'bg-neutral-500'}`}
            />
            <span className="text-sm text-neutral-100 leading-snug">{task.title}</span>
            {task.status === 'in_progress' && (
              <span className="ml-auto text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full shrink-0">
                en cours
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

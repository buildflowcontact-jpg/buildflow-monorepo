// modules/terrain/components/LiveFeed.tsx
// Fil d'événements terrain filtré — uniquement récent et utile
import React from 'react';
import type { TerrainFeedItem } from '../types';

interface LiveFeedProps {
  items: TerrainFeedItem[];
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ items }) => {
  return (
    <div className="px-3 py-2 flex-1 overflow-y-auto">
      <h3 className="text-xs text-neutral-400 uppercase tracking-wider mb-2 font-semibold">
        📡 Live chantier
      </h3>

      {items.length === 0 ? (
        <p className="text-neutral-600 text-sm">Aucun événement récent.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 text-sm text-neutral-200"
            >
              <span className="shrink-0 mt-0.5">{item.icon}</span>
              <span className="flex-1 leading-snug">{item.label}</span>
              <span className="text-neutral-500 text-xs shrink-0 mt-0.5">{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { PiloterDashboard } from './PiloterDashboard';

export function Piloter() {
  return (
    <div className="p-4">
      <h2 className="font-bold text-xl mb-4">Piloter (Dashboard)</h2>
      <PiloterDashboard />
    </div>
  );
}

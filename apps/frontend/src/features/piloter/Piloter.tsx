import React from 'react';
import { PiloterDashboard } from './PiloterDashboard';

export function Piloter({ projectName }: { projectName?: string }) {
  return (
    <div className="space-y-4">
      <h2 className="bf-text-primary font-black tracking-tight text-2xl">Piloter</h2>
      <p className="bf-text-muted text-sm">Indicateurs de pilotage, qualité d'exécution et suivi opérationnel.</p>
      <PiloterDashboard projectName={projectName} />
    </div>
  );
}

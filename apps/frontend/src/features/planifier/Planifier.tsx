import React from 'react';
import { Gantt } from './Gantt';

export function Planifier() {
  return (
    <div className="space-y-4">
      <h2 className="bf-text-primary font-black tracking-tight text-2xl">Planifier</h2>
      <p className="bf-text-muted text-sm">Vue Gantt simplifiée pour suivre l'avancement et les dépendances clés.</p>
      <div className="bf-card-soft p-4 md:p-5">
        <Gantt />
      </div>
    </div>
  );
}

import React from 'react';
import { Gantt } from './Gantt';

export function Planifier() {
  return (
    <div className="p-4">
      <h2 className="font-bold text-xl mb-4">Planifier (Gantt simplifié)</h2>
      <div className="bg-white rounded shadow p-4">
        <Gantt />
      </div>
    </div>
  );
}

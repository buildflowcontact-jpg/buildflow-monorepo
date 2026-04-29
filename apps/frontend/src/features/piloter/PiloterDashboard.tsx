import React from 'react';

const fakeStats = {
  budget: { prevu: 100000, reel: 112000 },
  incidents: 7,
  retards: 2,
  performance: 92,
};

export function PiloterDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded shadow p-4">
        <div className="font-bold text-lg">Budget</div>
        <div>Prévu : {fakeStats.budget.prevu.toLocaleString()} €</div>
        <div>Réel : <span className={fakeStats.budget.reel > fakeStats.budget.prevu ? 'text-red-600' : 'text-green-600'}>{fakeStats.budget.reel.toLocaleString()} €</span></div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="font-bold text-lg">Incidents</div>
        <div>{fakeStats.incidents} en cours</div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="font-bold text-lg">Retards</div>
        <div>{fakeStats.retards} tâches</div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <div className="font-bold text-lg">Performance équipes</div>
        <div>{fakeStats.performance} %</div>
      </div>
    </div>
  );
}

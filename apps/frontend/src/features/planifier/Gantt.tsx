import React from 'react';

const fakeTasks = [
  { id: 1, name: 'Terrassement', start: '2026-05-01', end: '2026-05-05', dependencies: [] },
  { id: 2, name: 'Fondations', start: '2026-05-06', end: '2026-05-10', dependencies: [1] },
  { id: 3, name: 'Élévation', start: '2026-05-11', end: '2026-05-20', dependencies: [2] },
  { id: 4, name: 'Toiture', start: '2026-05-21', end: '2026-05-25', dependencies: [3] },
];

export function Gantt() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            <th className="border p-2">Tâche</th>
            <th className="border p-2">Début</th>
            <th className="border p-2">Fin</th>
            <th className="border p-2">Dépendances</th>
          </tr>
        </thead>
        <tbody>
          {fakeTasks.map(task => (
            <tr key={task.id}>
              <td className="border p-2 font-bold">{task.name}</td>
              <td className="border p-2">{task.start}</td>
              <td className="border p-2">{task.end}</td>
              <td className="border p-2">{task.dependencies.map(dep => fakeTasks.find(t => t.id === dep)?.name).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-gray-500">(Gantt visuel à venir)</div>
    </div>
  );
}

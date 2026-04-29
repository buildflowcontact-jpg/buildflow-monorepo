import React from 'react';
import { EquipeList } from './EquipeList';

export function Equipe() {
  return (
    <div className="p-4">
      <h2 className="font-bold text-xl mb-4">Équipe</h2>
      <div className="bg-white rounded shadow p-4">
        <EquipeList />
      </div>
    </div>
  );
}

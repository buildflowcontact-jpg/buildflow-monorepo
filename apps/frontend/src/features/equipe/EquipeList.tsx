import React, { useState } from 'react';

const fakeMembers = [
  { id: 1, name: 'Alice Martin', role: 'Chef de chantier', present: true },
  { id: 2, name: 'Bob Dupont', role: 'Ouvrier', present: false },
  { id: 3, name: 'Carla BE', role: 'Bureau d’étude', present: true },
];

export function EquipeList() {
  const [members, setMembers] = useState(fakeMembers);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const addMember = () => {
    if (name && role) {
      setMembers([...members, { id: Date.now(), name, role, present: false }]);
      setName('');
      setRole('');
    }
  };
  const togglePresence = (id: number) => {
    setMembers(members.map(m => m.id === id ? { ...m, present: !m.present } : m));
  };
  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom" className="p-2 border rounded" />
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="Rôle" className="p-2 border rounded" />
        <button onClick={addMember} className="bg-blue-700 text-white px-3 py-1 rounded">Ajouter</button>
      </div>
      <ul className="space-y-2">
        {members.map(m => (
          <li key={m.id} className="bg-white rounded p-2 flex items-center gap-2">
            <span className="font-bold">{m.name}</span>
            <span className="text-xs text-gray-500">({m.role})</span>
            <button onClick={() => togglePresence(m.id)} className={m.present ? 'text-green-600' : 'text-gray-400'}>
              {m.present ? 'Présent' : 'Absent'}
            </button>
            <button onClick={() => removeMember(m.id)} className="text-xs text-red-600 underline ml-auto">Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

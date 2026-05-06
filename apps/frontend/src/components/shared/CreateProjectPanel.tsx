import React, { useState } from 'react';
import { useCreateProject } from '../../hooks/useCreateProject';

interface Props {
  onCreated: (projectId: string) => void;
}

export function CreateProjectPanel({ onCreated }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const createProject = useCreateProject();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    createProject.mutate(
      { name: name.trim(), code: code.trim().toUpperCase() },
      { onSuccess: (project) => onCreated(project.id) }
    );
  }

  return (
    <div className="surface-panel p-6 md:p-8">
      <h2 className="text-xl font-black tracking-tight bf-text-primary mb-1">Créer votre premier projet</h2>
      <p className="text-sm bf-text-muted mb-5">
        Aucun projet disponible. Créez-en un pour accéder à toutes les fonctionnalités.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold uppercase tracking-wide bf-text-muted mb-1">
            Nom du projet
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Construction Tour A"
            className="bf-input w-full rounded-xl px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="w-36">
          <label className="block text-xs font-bold uppercase tracking-wide bf-text-muted mb-1">
            Code projet
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex : PRJ-01"
            className="bf-input w-full rounded-xl px-3 py-2 text-sm"
            maxLength={12}
            required
          />
        </div>
        <button
          type="submit"
          disabled={createProject.isPending || !name.trim() || !code.trim()}
          className="bf-button-primary rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {createProject.isPending ? 'Création...' : 'Créer le projet'}
        </button>
      </form>
      {createProject.isError && (
        <p className="mt-3 text-sm text-red-600">
          Erreur : {(createProject.error as Error).message}
        </p>
      )}
    </div>
  );
}

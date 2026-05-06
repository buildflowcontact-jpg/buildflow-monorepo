// modules/incidents/components/IncidentForm.tsx
import React, { useState } from 'react';
import { useCreateIncident } from '../hooks/useCreateIncident';
import type { CreateIncidentPayload, IncidentSeverity } from '../types';

interface IncidentFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ projectId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');

  const { mutate, isPending, isError } = useCreateIncident();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload: CreateIncidentPayload = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
    };

    mutate(payload, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        setSeverity('medium');
        onSuccess?.();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Décrire l'incident en quelques mots"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Détails supplémentaires (optionnel)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sévérité</label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Faible</option>
          <option value="medium">Moyenne</option>
          <option value="high">Haute</option>
          <option value="critical">Critique</option>
        </select>
      </div>

      {isError && (
        <p className="text-red-600 text-sm">Erreur lors de la création. Réessayez.</p>
      )}

      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
      >
        {isPending ? 'Création...' : 'Signaler l\'incident'}
      </button>
    </form>
  );
};

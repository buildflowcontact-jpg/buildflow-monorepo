// modules/terrain/components/ActionSheet.tsx
// Bottom sheet terrain — zéro formulaire, actions directes
import React from 'react';
import { useCreateIncident } from '../../incidents/hooks/useCreateIncident';

interface ActionSheetProps {
  projectId: string;
  onClose: () => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({ projectId, onClose }) => {
  const { mutate: createIncident, isPending } = useCreateIncident();

  const handleImmediateIncident = () => {
    createIncident(
      {
        project_id: projectId,
        title: 'Incident signalé terrain',
        severity: 'high',
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-neutral-900 w-full px-4 pt-4 pb-8 rounded-t-3xl space-y-3 border-t border-neutral-700">
        <div className="w-10 h-1 bg-neutral-600 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-1">Nouvelle action</h2>

        {/* Photo rapide — natif HTML input */}
        <label className="w-full bg-blue-600 active:bg-blue-700 p-4 rounded-2xl text-white font-semibold text-base flex items-center gap-3 cursor-pointer transition-colors">
          <span className="text-2xl">📸</span>
          <span>Photo rapide</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onClose} />
        </label>

        {/* Vocal — lien natif media */}
        <label className="w-full bg-orange-600 active:bg-orange-700 p-4 rounded-2xl text-white font-semibold text-base flex items-center gap-3 cursor-pointer transition-colors">
          <span className="text-2xl">🎤</span>
          <span>Note vocale</span>
          <input type="file" accept="audio/*" className="hidden" onChange={onClose} />
        </label>

        {/* Incident immédiat */}
        <button
          onClick={handleImmediateIncident}
          disabled={isPending}
          className="w-full bg-red-600 active:bg-red-700 disabled:opacity-60 p-4 rounded-2xl text-white font-semibold text-base flex items-center gap-3 transition-colors"
        >
          <span className="text-2xl">🚨</span>
          <span>{isPending ? 'Envoi…' : 'Incident immédiat'}</span>
        </button>

        <button
          onClick={onClose}
          className="w-full bg-neutral-700 active:bg-neutral-600 p-4 rounded-2xl text-neutral-300 font-semibold text-base transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

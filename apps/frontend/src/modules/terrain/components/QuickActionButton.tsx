// modules/terrain/components/QuickActionButton.tsx
// Bouton principal terrain — grand, centré, une main
import React, { useState } from 'react';
import { ActionSheet } from './ActionSheet';

interface QuickActionButtonProps {
  projectId: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({ projectId }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-40 h-40 rounded-full bg-red-600 active:bg-red-700 text-white text-xl font-black shadow-2xl shadow-red-900/50 active:scale-95 transition-transform select-none"
        aria-label="Signaler une action terrain"
      >
        🚨<br />
        <span className="text-base">SIGNALER</span>
      </button>

      {open && <ActionSheet projectId={projectId} onClose={() => setOpen(false)} />}
    </>
  );
};

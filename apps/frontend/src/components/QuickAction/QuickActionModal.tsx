import React, { useState } from 'react';
import { Button } from 'shadcn-ui';
import { uploadImageToSupabase } from '../../modules/chantier/services/uploadImageToSupabase';
import { emit } from '../../lib/events';

export function QuickActionModal() {
  const [open, setOpen] = useState(false);
  // TODO: gestion des actions, upload, compression, offline, etc.
  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-blue-600 text-white w-16 h-16 flex items-center justify-center"
        aria-label="Action rapide"
        onClick={() => setOpen(true)}
      >
        +
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end md:items-center md:justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:w-96 max-w-full">
            <h2 className="text-lg font-bold mb-4">Nouvelle action</h2>
            {/* TODO: actions incident, photo, tâche terminée, livraison */}
            <button onClick={() => setOpen(false)} className="mt-4 w-full py-2 bg-gray-200 rounded">Annuler</button>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function EventModal({
  open,
  onClose,
  onSubmit,
  initialData
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: string; description?: string; metadata?: any }) => void;
  initialData?: { type: string; description?: string; metadata?: any };
}) {
  const [type, setType] = useState(initialData?.type || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [metadata, setMetadata] = useState(initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '');

  React.useEffect(() => {
    setType(initialData?.type || '');
    setDescription(initialData?.description || '');
    setMetadata(initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '');
  }, [initialData, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md border border-border text-foreground"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
        <h2 className="font-bold text-lg mb-4">{initialData ? 'Éditer l’événement' : 'Nouvel événement'}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            let meta = undefined;
            try { meta = metadata ? JSON.parse(metadata) : undefined; } catch { meta = undefined; }
            onSubmit({ type, description, metadata: meta });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium">Type</label>
            <input
              type="text"
              required
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-border rounded bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <textarea
              value={metadata}
              onChange={e => setMetadata(e.target.value)}
              className="w-full p-2 border border-border rounded font-mono text-xs bg-background text-foreground"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-muted text-muted-foreground rounded border border-border hover:bg-accent transition-colors">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded font-bold hover:bg-primary/90 transition-colors">
              {initialData ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

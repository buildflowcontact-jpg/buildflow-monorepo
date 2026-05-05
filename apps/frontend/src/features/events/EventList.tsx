import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProjectEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from './useProjectEvents';
import { EventModal } from './EventModal';
import { useToast } from '../../ui/ToastProvider';

export function EventList({ projectId }: { projectId: string }) {
  const { data: events, isLoading } = useProjectEvents(projectId);
  const createEvent = useCreateEvent(projectId);
  const updateEvent = useUpdateEvent(projectId);
  const deleteEvent = useDeleteEvent(projectId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const { showToast } = useToast();

  if (isLoading) return <div>Chargement des événements...</div>;

  return (
    <div>
      <button
        className="mb-4 w-full px-4 py-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg shadow-md active:scale-95 transition-colors hover:bg-primary/90"
        onClick={() => { setEditEvent(null); setModalOpen(true); }}
        style={{ minHeight: 56 }}
      >
        + Nouvel événement
      </button>
      {(!events || events.length === 0) ? (
        <div>Aucun événement pour ce projet.</div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {events.map((event: any) => (
              <motion.li
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="bg-card rounded-xl shadow p-4 flex flex-col gap-2 border border-border"
              >
                <div className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</div>
                <div className="font-bold text-primary">{event.type}</div>
                {event.description && <div className="text-foreground">{event.description}</div>}
                {event.metadata?.image_url && (
                  <img src={event.metadata.image_url} alt="photo" className="w-32 h-32 object-cover rounded" />
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    className="text-xs text-primary underline px-2 py-1 rounded hover:bg-accent transition-colors"
                    style={{ fontSize: 16 }}
                    onClick={() => { setEditEvent(event); setModalOpen(true); }}
                  >
                    Éditer
                  </button>
                  <button
                    className="text-xs text-destructive underline px-2 py-1 rounded hover:bg-accent transition-colors"
                    style={{ fontSize: 16 }}
                    onClick={() => {
                      if (window.confirm('Supprimer cet événement ?')) {
                        deleteEvent.mutate(event.id, {
                          onSuccess: () => showToast('Événement supprimé', 'success'),
                          onError: () => showToast('Erreur lors de la suppression', 'error'),
                        });
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editEvent ? { type: editEvent.type, description: editEvent.description, metadata: editEvent.metadata } : undefined}
        onSubmit={data => {
          if (editEvent) {
            updateEvent.mutate(
              { id: editEvent.id, ...data },
              {
                onSuccess: () => showToast('Événement modifié', 'success'),
                onError: () => showToast('Erreur lors de la modification', 'error'),
              }
            );
          } else {
            createEvent.mutate(
              data,
              {
                onSuccess: () => showToast('Événement créé', 'success'),
                onError: () => showToast('Erreur lors de la création', 'error'),
              }
            );
          }
          setModalOpen(false);
        }}
      />
    </div>
  );
}

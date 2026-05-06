// services/eventBus.ts
// Bus d'événements léger pour la communication inter-modules.
// Usage : eventBus.on('incident_created', cb) / eventBus.emit('incident_created', payload)

export type AppEvent =
  | 'incident_created'
  | 'incident_updated'
  | 'incident_escalated'
  | 'task_created'
  | 'task_updated'
  | 'project_updated'
  | 'delivery_received'
  | 'document_uploaded';

type Callback<T = unknown> = (payload: T) => void;

const listeners = new Map<AppEvent, Callback[]>();

export const eventBus = {
  on<T = unknown>(event: AppEvent, cb: Callback<T>): () => void {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event)!.push(cb as Callback);
    // Retourne une fonction de cleanup (utile dans useEffect)
    return () => {
      const cbs = listeners.get(event) ?? [];
      listeners.set(event, cbs.filter((fn) => fn !== cb));
    };
  },

  emit<T = unknown>(event: AppEvent, payload: T): void {
    (listeners.get(event) ?? []).forEach((cb) => cb(payload));
  },
};

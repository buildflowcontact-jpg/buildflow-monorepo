// services/offlineQueue.ts
// File d'attente pour les actions effectuées hors-ligne.
// Version simple (mémoire) — remplaçable par IndexedDB via Dexie.

export interface QueuedAction {
  id: string;
  mutationKey: string;
  payload: unknown;
  createdAt: number;
  retries: number;
}

let queue: QueuedAction[] = [];

export const offlineQueue = {
  add(mutationKey: string, payload: unknown): QueuedAction {
    const action: QueuedAction = {
      id: crypto.randomUUID(),
      mutationKey,
      payload,
      createdAt: Date.now(),
      retries: 0,
    };
    queue.push(action);
    return action;
  },

  remove(id: string): void {
    queue = queue.filter((a) => a.id !== id);
  },

  getAll(): QueuedAction[] {
    return [...queue];
  },

  async flush(
    executor: (action: QueuedAction) => Promise<void>,
    onError?: (action: QueuedAction, err: unknown) => void
  ): Promise<void> {
    const pending = [...queue];
    for (const action of pending) {
      try {
        await executor(action);
        offlineQueue.remove(action.id);
      } catch (err) {
        action.retries += 1;
        onError?.(action, err);
      }
    }
  },
};

// hooks/useOfflineQueue.ts
import { useEffect, useState } from 'react';

export function useOfflineQueue<T = any>() {
  const [queue, setQueue] = useState<T[]>([]);

  useEffect(() => {
    // TODO: implémenter la persistance IndexedDB
  }, []);

  const addToQueue = (item: T) => setQueue((q) => [...q, item]);
  const clearQueue = () => setQueue([]);

  return { queue, addToQueue, clearQueue };
}

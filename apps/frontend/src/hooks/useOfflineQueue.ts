import { useCallback, useEffect, useState } from 'react';

const DB_NAME = 'buildflow-offline';
const DB_VERSION = 1;

type OfflineQueueItem = {
  id: string;
};

interface UseOfflineQueueOptions<T extends OfflineQueueItem> {
  storeName: string;
  processItem?: (item: T) => Promise<void>;
  autoProcess?: boolean;
}

function openOfflineDb(storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        const currentVersion = database.version;
        database.close();
        const upgradeRequest = window.indexedDB.open(DB_NAME, currentVersion + 1);
        upgradeRequest.onupgradeneeded = () => {
          const upgradedDb = upgradeRequest.result;
          if (!upgradedDb.objectStoreNames.contains(storeName)) {
            upgradedDb.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result);
        upgradeRequest.onerror = () => reject(upgradeRequest.error);
        return;
      }

      resolve(database);
    };

    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  database: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    callback(store, resolve, reject);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getAllItems<T>(storeName: string): Promise<T[]> {
  const database = await openOfflineDb(storeName);
  try {
    return await withStore<T[]>(database, storeName, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result ?? []) as T[]);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function putItem<T>(storeName: string, item: T): Promise<void> {
  const database = await openOfflineDb(storeName);
  try {
    await withStore<void>(database, storeName, 'readwrite', (store, resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function deleteItem(storeName: string, id: string): Promise<void> {
  const database = await openOfflineDb(storeName);
  try {
    await withStore<void>(database, storeName, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

async function clearItems(storeName: string): Promise<void> {
  const database = await openOfflineDb(storeName);
  try {
    await withStore<void>(database, storeName, 'readwrite', (store, resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export function useOfflineQueue<T extends OfflineQueueItem>({
  storeName,
  processItem,
  autoProcess = true,
}: UseOfflineQueueOptions<T>) {
  const [queue, setQueue] = useState<T[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const refreshQueue = useCallback(async () => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      setQueue([]);
      setIsHydrating(false);
      return;
    }

    const items = await getAllItems<T>(storeName);
    setQueue(items);
    setIsHydrating(false);
  }, [storeName]);

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToQueue = useCallback(async (item: T) => {
    await putItem(storeName, item);
    await refreshQueue();
  }, [refreshQueue, storeName]);

  const clearQueue = useCallback(async () => {
    await clearItems(storeName);
    setQueue([]);
  }, [storeName]);

  const processQueue = useCallback(async () => {
    if (!processItem || isProcessing || !isOnline) {
      return;
    }

    setIsProcessing(true);
    try {
      const items = await getAllItems<T>(storeName);
      for (const item of items) {
        await processItem(item);
        await deleteItem(storeName, item.id);
      }
      await refreshQueue();
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, isProcessing, processItem, refreshQueue, storeName]);

  useEffect(() => {
    if (!autoProcess || !processItem || !isOnline || isHydrating) {
      return;
    }

    void processQueue();
  }, [autoProcess, isHydrating, isOnline, processItem, processQueue]);

  return { queue, addToQueue, clearQueue, processQueue, isHydrating, isProcessing, isOnline };
}

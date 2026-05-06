import { syncQueue } from "./syncEngine";

let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** Lance une synchronisation avec retry exponentiel si toujours hors ligne */
const scheduleRetry = (attempt = 0) => {
  const delays = [5_000, 15_000, 60_000];
  const delay = delays[Math.min(attempt, delays.length - 1)];

  retryTimer = setTimeout(async () => {
    if (navigator.onLine) {
      await syncQueue();
    } else {
      scheduleRetry(attempt + 1);
    }
  }, delay);
};

export const initNetworkListener = (): (() => void) => {
  const handleOnline = async () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    await syncQueue();
  };

  const handleOffline = () => {
    scheduleRetry();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Cleanup
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (retryTimer) clearTimeout(retryTimer);
  };
};

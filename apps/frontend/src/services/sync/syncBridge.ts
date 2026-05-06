/**
 * syncBridge.ts
 * Point d'entrée unique qui initialise :
 *  1. La sync offline au retour réseau (avec retry exponentiel)
 *  2. Les canaux Supabase Realtime → patch React Query
 *
 * Remplace `initNetworkListener`. À appeler une seule fois au démarrage.
 */
import { supabase } from "@/services/supabaseClient";
import { syncQueue } from "@/services/offline/syncEngine";
import { handleRealtimeEvent } from "./realtimeHandler";
import type { RealtimeChannel } from "@supabase/supabase-js";

const TABLES = ["incidents", "tasks", "project_events", "purchase_orders", "audit_logs"] as const;

let channel: RealtimeChannel | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

// ---------------------------------------------------------------------------
// Offline → online : sync queue
// ---------------------------------------------------------------------------

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

const handleOnline = async () => {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  await syncQueue();
};

const handleOffline = () => {
  scheduleRetry();
};

// ---------------------------------------------------------------------------
// Supabase Realtime : abonnement multi-table
// ---------------------------------------------------------------------------

const subscribeRealtime = () => {
  if (channel) return; // déjà abonné

  channel = supabase.channel("buildflow-global");

  for (const table of TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => handleRealtimeEvent(table, payload as Parameters<typeof handleRealtimeEvent>[1])
    );
  }

  channel.subscribe((status) => {
    if (status === "CHANNEL_ERROR") {
      // Réabonnement automatique après 5s en cas d'erreur
      setTimeout(() => {
        unsubscribeRealtime();
        subscribeRealtime();
      }, 5_000);
    }
  });
};

const unsubscribeRealtime = () => {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
};

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export const initSyncBridge = (): (() => void) => {
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  subscribeRealtime();

  // Sync initiale si déjà en ligne avec des actions en attente
  if (navigator.onLine) {
    void syncQueue();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (retryTimer) clearTimeout(retryTimer);
    unsubscribeRealtime();
  };
};

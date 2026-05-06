/**
 * safeWrite.ts
 * Wrapper d'écriture offline-first générique.
 * - Hors ligne : enfile dans IndexedDB, met à jour React Query de façon optimiste
 * - En ligne : écrit direct en Supabase, patch React Query avec la réponse serveur
 */
import { queryClient } from "@/app/providers";
import { addToQueue } from "@/services/offline/queue";
import { supabase } from "@/services/supabaseClient";

type SafeWriteTable = "incidents" | "tasks" | "purchase_orders" | "project_events";

interface SafeWriteOptions<T extends Record<string, unknown>> {
  /** Type d'action offline (ex: "incident_create") */
  actionType: string;
  /** Table Supabase cible */
  table: SafeWriteTable;
  /** Payload à envoyer */
  payload: T;
  /** Clé React Query à invalider/patcher après succès */
  queryKey: unknown[];
  /** Objet optimiste local (pour affichage immédiat hors ligne) */
  optimisticItem?: T;
}

export async function safeWrite<T extends Record<string, unknown>>(
  opts: SafeWriteOptions<T>
): Promise<{ data: T; offline: boolean }> {
  const { actionType, table, payload, queryKey, optimisticItem } = opts;

  // --- Hors ligne : update optimiste + enfile dans la queue ---
  if (!navigator.onLine) {
    const offlineItem = optimisticItem ?? { ...payload, id: `offline_${Date.now()}` };

    queryClient.setQueryData<T[]>(queryKey, (old) =>
      old ? [offlineItem as T, ...old] : [offlineItem as T]
    );

    await addToQueue(actionType, payload);

    return { data: offlineItem as T, offline: true };
  }

  // --- En ligne : écriture directe ---
  const { data, error } = await supabase
    .from(table)
    .insert(payload as never)
    .select()
    .single();

  if (error) throw error;

  const serverItem = data as unknown as T;

  // Patch React Query avec la vraie donnée serveur (remplace l'éventuel optimiste)
  queryClient.setQueryData<T[]>(queryKey, (old) => {
    if (!old) return [serverItem];
    const exists = old.some((item) => item.id === serverItem.id);
    return exists
      ? old.map((item) => (item.id === serverItem.id ? serverItem : item))
      : [serverItem, ...old];
  });

  return { data: serverItem, offline: false };
}

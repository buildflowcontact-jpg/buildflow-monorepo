// modules/incidents/api/createIncidentOffline.ts
import { supabase } from "@/services/supabaseClient";
import { addToQueue } from "@/services/offline";
import type { CreateIncidentPayload, IncidentRow } from "../types";

/**
 * Wrapper offline-first pour créer un incident.
 * - En ligne  → appel Supabase direct, retourne la ligne créée
 * - Hors ligne → enfile l'action dans IndexedDB, retourne un objet optimiste
 */
export async function createIncidentOffline(
  payload: CreateIncidentPayload
): Promise<IncidentRow & { offline?: boolean }> {
  if (!navigator.onLine) {
    const optimisticId = `offline_${Date.now()}`;
    await addToQueue("incident_create", {
      ...payload,
      status: "submitted",
      id: optimisticId,
    });
    // Retourne un objet optimiste pour que le UI réagisse immédiatement
    return {
      id: optimisticId,
      project_id: payload.project_id,
      title: payload.title,
      description: payload.description ?? null,
      severity: payload.severity ?? null,
      status: "submitted",
      reported_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offline: true,
    } as IncidentRow & { offline: true };
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({ ...payload, status: "submitted" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

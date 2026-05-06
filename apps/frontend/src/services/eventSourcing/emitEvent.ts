// services/eventSourcing/emitEvent.ts
// Point d'entrée unique pour émettre un événement métier.
//
// Stratégie :
//   • Online  → INSERT direct dans project_events → déclenche processEvent
//   • Offline → addToQueue("emit_event", ...) → replayed by syncEngine
//
// La table project_events (existante) stocke le DomainEvent complet
// dans la colonne event_data (jsonb).  Le event_type de surface
// correspond au DomainEventType.
// -----------------------------------------------------------------------

import { supabase } from "@/services/supabaseClient";
import { addToQueue } from "@/services/offline/queue";
import { processEvent, initWorkflowEngine } from "@/services/workflow/engine";
import type { DomainEvent, DomainEventType } from "./types";

// ---------------------------------------------------------------------------
// Sérialisation → format project_events
// ---------------------------------------------------------------------------
const toRow = <T extends DomainEventType>(event: DomainEvent<T>) => ({
  project_id: event.project_id,
  event_type: event.event_type,
  event_data: {
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    created_by: event.created_by,
    version: event.version ?? null,
    payload: event.payload,
  },
  created_at: event.created_at ?? new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// emitEvent interne — version avec contrôle de profondeur (cascade workflow)
// ---------------------------------------------------------------------------
const emitEventInternal = async (
  event: Record<string, unknown>,
  depth: number
): Promise<void> => {
  const domainEvent = event as unknown as DomainEvent<DomainEventType>;
  await emitEvent(domainEvent, depth);
};

// Injection de la référence dans executeActions (résout la circularité)
initWorkflowEngine(emitEventInternal);

// ---------------------------------------------------------------------------
// emitEvent — public API
// ---------------------------------------------------------------------------
export const emitEvent = async <T extends DomainEventType>(
  event: DomainEvent<T>,
  _depth = 0
): Promise<void> => {
  if (!navigator.onLine) {
    // Mise en file hors-ligne — haute priorité (traçabilité critique)
    await addToQueue("emit_event", {
      ...toRow(event),
      // On garde l'enveloppe complète pour le replay côté syncEngine
      _domainEvent: event as unknown as Record<string, unknown>,
    });
    return;
  }

  const { data, error } = await supabase
    .from("project_events")
    .insert(toRow(event))
    .select("id")
    .single();

  if (error) {
    console.error("[eventSourcing] emitEvent failed:", error.message);
    // Fallback offline en cas d'erreur réseau inattendue
    await addToQueue("emit_event", {
      ...toRow(event),
      _domainEvent: event as unknown as Record<string, unknown>,
    });
    return;
  }

  // 🔥 Déclenche le workflow engine (fire-and-forget — ne bloque pas l'UI)
  void processEvent({ ...event, id: data?.id }, _depth);
};

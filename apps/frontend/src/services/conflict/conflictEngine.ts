/**
 * services/conflict/conflictEngine.ts
 * Moteur de résolution de conflits :
 *  - détecte les champs divergents
 *  - merge automatique (safe fields)
 *  - classifie le conflit
 */
import {
  classifyConflict,
  type ConflictCategory,
  type ConflictRecord,
  type ConflictResolutionChoice,
} from "./types";

// ---------------------------------------------------------------------------
// Détection
// ---------------------------------------------------------------------------

/**
 * Retourne les clés qui diffèrent entre `local` et `server`,
 * en ignorant les champs purement techniques.
 */
const IGNORED_FIELDS = new Set(["updated_at", "updated_by", "created_at"]);

export const detectChangedFields = (
  local: Record<string, unknown>,
  server: Record<string, unknown>
): string[] => {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);
  return [...allKeys].filter(
    (key) =>
      !IGNORED_FIELDS.has(key) &&
      JSON.stringify(local[key]) !== JSON.stringify(server[key])
  );
};

export const hasConflict = (
  local: Record<string, unknown>,
  server: Record<string, unknown>
): boolean => detectChangedFields(local, server).length > 0;

// ---------------------------------------------------------------------------
// Merge automatique
// ---------------------------------------------------------------------------

/**
 * Merge safe : base = server (source de vérité), on garde les champs locaux
 * uniquement pour les types "auto_resolvable" non couverts.
 * Pour les tableaux (comments, attachments) → union déduplication par id.
 */
export const mergeAuto = <T extends Record<string, unknown>>(
  local: T,
  server: T
): T => {
  const merged = { ...server };

  // Union des tableaux identifiables
  for (const key of Object.keys(local) as (keyof T)[]) {
    const localVal = local[key];
    const serverVal = server[key];

    if (Array.isArray(localVal) && Array.isArray(serverVal)) {
      const ids = new Set(
        (serverVal as { id?: unknown }[]).map((item) => item?.id)
      );
      const extras = (localVal as { id?: unknown }[]).filter(
        (item) => !ids.has(item?.id)
      );
      (merged as Record<string, unknown>)[key as string] = [
        ...serverVal,
        ...extras,
      ];
    }
  }

  return merged as T;
};

// ---------------------------------------------------------------------------
// Résolution
// ---------------------------------------------------------------------------

export const resolveConflict = <T extends Record<string, unknown>>(
  local: T,
  server: T,
  choice: ConflictResolutionChoice
): T => {
  switch (choice) {
    case "local":
      return { ...server, ...local, updated_at: local.updated_at };
    case "server":
      return server;
    case "merge":
      return mergeAuto(local, server);
  }
};

// ---------------------------------------------------------------------------
// Factory : crée un ConflictRecord à partir des deux états
// ---------------------------------------------------------------------------

export const buildConflictRecord = <T extends Record<string, unknown>>(
  entityType: string,
  local: T,
  server: T
): ConflictRecord<T> => {
  const changedFields = detectChangedFields(local, server);
  const category: ConflictCategory = classifyConflict(changedFields);

  return {
    id: `conflict_${entityType}_${String(local.id)}_${Date.now()}`,
    entityType,
    entityId: String(local.id),
    local,
    server,
    changedFields,
    category,
    detectedAt: Date.now(),
  };
};

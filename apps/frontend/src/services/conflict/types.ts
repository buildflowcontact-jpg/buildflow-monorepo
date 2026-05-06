/**
 * services/conflict/types.ts
 * Types pour le système de résolution de conflits.
 */

export type ConflictResolutionChoice = "local" | "server" | "merge";

export type ConflictCategory =
  | "auto_resolvable"   // commentaires, logs, timestamps → merge silencieux
  | "semi_resolvable"   // statut, assignation → merge avec avertissement
  | "manual_required";  // budget, validation, suppression → modal obligatoire

/** Champs classifiés par catégorie pour les incidents */
export const INCIDENT_FIELD_CATEGORIES: Record<string, ConflictCategory> = {
  status: "semi_resolvable",
  severity: "semi_resolvable",
  title: "manual_required",
  description: "manual_required",
  reported_by: "auto_resolvable",
  updated_at: "auto_resolvable",
  updated_by: "auto_resolvable",
};

/** Classe le niveau de criticité d'un conflit en fonction des champs divergents */
export const classifyConflict = (
  changedFields: string[]
): ConflictCategory => {
  if (changedFields.some((f) => INCIDENT_FIELD_CATEGORIES[f] === "manual_required")) {
    return "manual_required";
  }
  if (changedFields.some((f) => INCIDENT_FIELD_CATEGORIES[f] === "semi_resolvable")) {
    return "semi_resolvable";
  }
  return "auto_resolvable";
};

export interface ConflictRecord<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  entityType: string;
  entityId: string;
  local: T;
  server: T;
  changedFields: string[];
  category: ConflictCategory;
  detectedAt: number;
}

export interface ConflictResolution<T extends Record<string, unknown> = Record<string, unknown>> {
  conflict: ConflictRecord<T>;
  choice: ConflictResolutionChoice;
  resolved: T;
}

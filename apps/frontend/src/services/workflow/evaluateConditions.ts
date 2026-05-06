// services/workflow/evaluateConditions.ts
// Moteur de conditions : évalue si un payload satisfait les règles d'un workflow.
//
// Formes supportées :
//   Simple   : { "severity": "critical" }
//   Valeurs  : { "severity": ["high", "critical"] }
//   AND      : { "all": [{ "severity": "critical" }, { "zone": "A" }] }
//   OR       : { "any": [{ "severity": "high" }, { "zone": "danger" }] }
//   Mixte    : { "all": [...], "any": [...] }  (AND + OR combinés)
// -----------------------------------------------------------------------

import type { SimpleCondition, CompoundCondition, WorkflowCondition } from "./types";

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------
const isCompound = (c: WorkflowCondition): c is CompoundCondition =>
  ("all" in c && Array.isArray((c as CompoundCondition).all)) ||
  ("any" in c && Array.isArray((c as CompoundCondition).any));

// ---------------------------------------------------------------------------
// Correspondance d'une règle simple
// ---------------------------------------------------------------------------
const matchSimple = (
  condition: SimpleCondition,
  payload: Record<string, unknown>
): boolean =>
  Object.entries(condition).every(([key, expected]) => {
    const actual = payload[key];
    if (Array.isArray(expected)) {
      return expected.includes(actual as string);
    }
    return actual === expected;
  });

// ---------------------------------------------------------------------------
// Évaluation d'une condition (récursive si composée)
// ---------------------------------------------------------------------------
export const evaluateConditions = (
  condition: WorkflowCondition | null | undefined,
  payload: Record<string, unknown>
): boolean => {
  if (!condition) return true;

  if (isCompound(condition)) {
    const compound = condition as CompoundCondition;

    // AND : tous doivent passer
    if (Array.isArray(compound.all)) {
      const allPass = compound.all.every((c) => matchSimple(c, payload));
      if (!allPass) return false;
    }

    // OR : au moins un doit passer (si présent)
    if (Array.isArray(compound.any)) {
      return compound.any.some((c) => matchSimple(c, payload));
    }

    return true;
  }

  // Condition simple (pas de "all" ni "any")
  return matchSimple(condition as SimpleCondition, payload);
};

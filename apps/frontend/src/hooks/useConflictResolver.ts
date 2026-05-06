/**
 * hooks/useConflictResolver.ts
 * Hook qui orchestre la résolution de conflits :
 *  - auto-merge silencieux pour les conflits "auto_resolvable"
 *  - merge avec toast pour "semi_resolvable"
 *  - modal bloquante pour "manual_required"
 */
import { useCallback } from "react";
import {
  buildConflictRecord,
  hasConflict,
  mergeAuto,
  resolveConflict,
} from "@/services/conflict/conflictEngine";
import { pushConflict } from "@/store/conflictStore";
import type { ConflictResolutionChoice } from "@/services/conflict/types";

export const useConflictResolver = () => {
  /**
   * Prend `local` (état édité) et `server` (état serveur actuel),
   * et retourne l'état final résolu.
   * - Si pas de conflit → retourne `local` tel quel
   * - auto_resolvable → merge silencieux
   * - semi_resolvable → merge auto (server base)
   * - manual_required → attend la décision de l'utilisateur via modal
   */
  const resolve = useCallback(
    async <T extends Record<string, unknown>>(
      entityType: string,
      local: T,
      server: T
    ): Promise<{ resolved: T; choice: ConflictResolutionChoice }> => {
      if (!hasConflict(local, server)) {
        return { resolved: local, choice: "local" };
      }

      const record = buildConflictRecord(entityType, local, server);

      switch (record.category) {
        case "auto_resolvable": {
          const resolved = mergeAuto(local, server);
          return { resolved, choice: "merge" };
        }

        case "semi_resolvable": {
          // Merge auto mais on le signale (le caller peut afficher un toast)
          const resolved = mergeAuto(local, server);
          return { resolved, choice: "merge" };
        }

        case "manual_required": {
          // Empile dans le store → la modal ConflictModal résout la Promise
          const choice = await pushConflict(record);
          const resolved = resolveConflict(local, server, choice);
          return { resolved, choice };
        }
      }
    },
    []
  );

  return { resolve };
};

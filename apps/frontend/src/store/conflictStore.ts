/**
 * store/conflictStore.ts
 * File d'attente des conflits en attente de résolution (Zustand).
 * Les conflits "manual_required" s'empilent ici et sont consommés par ConflictModal.
 */
import { create } from "zustand";
import type { ConflictRecord, ConflictResolutionChoice } from "@/services/conflict/types";

type Resolver = (choice: ConflictResolutionChoice) => void;

interface PendingConflict {
  conflict: ConflictRecord;
  resolve: Resolver;
}

interface ConflictStore {
  queue: PendingConflict[];
  /** Enfile un conflit et retourne une Promise qui se résout quand l'utilisateur choisit */
  push: (conflict: ConflictRecord) => Promise<ConflictResolutionChoice>;
  /** Résout le conflit en tête de file */
  respond: (choice: ConflictResolutionChoice) => void;
}

export const useConflictStore = create<ConflictStore>((set, get) => ({
  queue: [],

  push: (conflict) => {
    return new Promise<ConflictResolutionChoice>((resolve) => {
      set((state) => ({
        queue: [...state.queue, { conflict, resolve }],
      }));
    });
  },

  respond: (choice) => {
    const [head, ...rest] = get().queue;
    if (!head) return;
    head.resolve(choice);
    set({ queue: rest });
  },
}));

/** Accesseur direct (hors composant React) */
export const pushConflict = (
  conflict: ConflictRecord
): Promise<ConflictResolutionChoice> =>
  useConflictStore.getState().push(conflict);

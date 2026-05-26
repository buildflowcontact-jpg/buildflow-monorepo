/**
 * components/ui/ConflictModal.tsx
 * Modal de résolution de conflits — s'affiche automatiquement quand
 * conflictStore a un élément "manual_required" en file.
 */
import { useConflictStore } from "@/store/conflictStore";
import type { ConflictResolutionChoice } from "@/services/conflict/types";
import { BodyPortal } from "@/components/ui/BodyPortal";

const FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  description: "Description",
  status: "Statut",
  severity: "Sévérité",
  reported_by: "Signalé par",
};

const label = (key: string) => FIELD_LABELS[key] ?? key;

const formatValue = (val: unknown): string => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
};

export const ConflictModal = () => {
  const { queue, respond } = useConflictStore();
  const current = queue[0];

  if (!current) return null;

  const { conflict } = current;
  const { local, server, changedFields, entityType } = conflict;

  const handleChoice = (choice: ConflictResolutionChoice) => {
    respond(choice);
  };

  return (
    <BodyPortal>
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 shadow-2xl border border-orange-500/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 bg-orange-900/40 px-6 py-4 border-b border-orange-500/30">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-base font-bold text-white">Conflit détecté</h2>
            <p className="text-xs text-orange-300 mt-0.5">
              Un autre utilisateur a modifié ce{" "}
              <span className="font-semibold">{entityType}</span> pendant que
              vous l'éditiez.
            </p>
          </div>
          {queue.length > 1 && (
            <span className="ml-auto rounded-full bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white">
              +{queue.length - 1} en attente
            </span>
          )}
        </div>

        {/* Diff table */}
        <div className="px-6 py-4 overflow-y-auto max-h-72">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-700">
                <th className="pb-2 text-left font-medium w-1/4">Champ</th>
                <th className="pb-2 text-left font-medium w-[37.5%]">
                  Votre version
                </th>
                <th className="pb-2 text-left font-medium w-[37.5%]">
                  Version serveur
                </th>
              </tr>
            </thead>
            <tbody>
              {changedFields.map((field) => (
                <tr
                  key={field}
                  className="border-b border-neutral-800 align-top"
                >
                  <td className="py-2 pr-3 font-semibold text-neutral-300">
                    {label(field)}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="rounded bg-blue-900/40 px-1.5 py-0.5 text-blue-300 font-mono break-all">
                      {formatValue(local[field])}
                    </span>
                  </td>
                  <td className="py-2">
                    <span className="rounded bg-green-900/40 px-1.5 py-0.5 text-green-300 font-mono break-all">
                      {formatValue(server[field])}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t border-neutral-700 bg-neutral-950/50">
          <button
            onClick={() => handleChoice("local")}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            📱 Garder ma version
          </button>
          <button
            onClick={() => handleChoice("server")}
            className="flex-1 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
          >
            🌐 Garder version serveur
          </button>
          <button
            onClick={() => handleChoice("merge")}
            className="flex-1 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
          >
            🔀 Fusion automatique
          </button>
        </div>
        </div>
      </div>
    </BodyPortal>
  );
};

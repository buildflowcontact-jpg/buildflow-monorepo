// components/shared/ProjectSwitcher.tsx
// Dropdown de sélection du projet courant.
// S'intègre dans le Header — compact sur desktop, pleine largeur sur mobile.
// Utilise useAppContext pour accéder à la liste + switchProject.
// -----------------------------------------------------------------------

import React, { useRef, useState } from "react";
import { useAppContext } from "@/app/providers/AppContext";

const STATUS_COLOR: Record<string, string> = {
  active:      "bg-green-500",
  in_progress: "bg-blue-500",
  paused:      "bg-yellow-500",
  completed:   "bg-slate-400",
  archived:    "bg-slate-300",
};

export function ProjectSwitcher() {
  const { project, projects, switchProject, online } = useAppContext();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Ferme le menu si clic extérieur
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (projects.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bf-button-secondary rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors max-w-[200px]"
        title={project?.name ?? "Sélectionner un projet"}
      >
        {/* Indicateur statut */}
        <span
          className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
            STATUS_COLOR[project?.status ?? ""] ?? "bg-slate-400"
          } ${!online ? "opacity-50" : ""}`}
        />
        <span className="truncate">{project?.name ?? "—"}</span>
        <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl shadow-xl border bf-surface overflow-hidden">
          <p className="px-3 pt-3 pb-1 text-xs font-semibold bf-text-muted uppercase tracking-wide">
            Mes projets
          </p>
          <ul className="max-h-72 overflow-y-auto pb-2">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    switchProject(p.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                    p.id === project?.id ? "font-semibold bf-text-primary" : "bf-text-secondary"
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      STATUS_COLOR[p.status] ?? "bg-slate-400"
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  <span className="text-xs font-mono opacity-50 flex-shrink-0">{p.code}</span>
                  {p.id === project?.id && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { UITheme, uiThemeLabels, useUIStore } from '../../../store/uiStore';

const THEMES: Array<{ id: UITheme; description: string }> = [
  {
    id: 'industrial',
    description: 'Contraste eleve pour usage chantier et forte luminosite.',
  },
  {
    id: 'cockpit',
    description: 'Cockpit moderne et dense pour pilotage bureau.',
  },
  {
    id: 'streamline',
    description: 'Mode epure et mobile-first pour actions rapides.',
  },
];

export function AccountSettings() {
  const uiTheme = useUIStore((state) => state.uiTheme);
  const setUITheme = useUIStore((state) => state.setUITheme);
  const isThemeSyncing = useUIStore((state) => state.isThemeSyncing);
  const themeSyncError = useUIStore((state) => state.themeSyncError);
  const retryThemeSync = useUIStore((state) => state.retryThemeSync);

  const previewClassName = (theme: UITheme) => {
    if (theme === 'industrial') return 'bf-preview-card bf-preview-industrial';
    if (theme === 'streamline') return 'bf-preview-card bf-preview-streamline';
    return 'bf-preview-card bf-preview-cockpit';
  };

  return (
    <section className="space-y-5">
      <div className="surface-panel p-5 md:p-6">
        <h2 className="text-xl font-black tracking-tight bf-text-primary">Parametres du compte</h2>
        <p className="mt-1 text-sm bf-text-muted">
          Choisissez votre style d interface selon votre contexte d usage.
        </p>
        <p className="mt-2 text-xs bf-text-muted">
          {isThemeSyncing ? 'Synchronisation du style avec votre compte...' : 'Le style selectionne est memorise localement et synchronise avec votre compte.'}
        </p>
        {themeSyncError ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{themeSyncError}</span>
            <button
              type="button"
              onClick={retryThemeSync}
              disabled={isThemeSyncing}
              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
              Reessayer
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {THEMES.map((theme) => {
          const selected = uiTheme === theme.id;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setUITheme(theme.id)}
              className={`surface-panel p-4 text-left transition-all ${selected ? 'ring-2 ring-cyan-500' : 'hover:-translate-y-0.5'}`}
              aria-pressed={selected}
              disabled={isThemeSyncing}
            >
              <p className="text-sm font-black uppercase tracking-wide bf-text-primary">
                {uiThemeLabels[theme.id]}
              </p>
              <p className="mt-2 text-sm bf-text-muted">{theme.description}</p>

              <div className={`mt-4 p-3 ${previewClassName(theme.id)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Apercu</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${theme.id === 'industrial' ? 'bg-slate-900 text-amber-300' : theme.id === 'cockpit' ? 'bg-cyan-700 text-white' : 'bg-blue-600 text-white'}`}>Etat</span>
                </div>
                <div className={`mt-3 rounded-lg p-2 text-xs ${theme.id === 'industrial' ? 'border-2 border-slate-900 bg-white text-slate-900' : theme.id === 'cockpit' ? 'border border-cyan-100 bg-white/80 text-slate-700' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}>
                  Carte document / action / statut
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${theme.id === 'industrial' ? 'bg-amber-400' : theme.id === 'cockpit' ? 'bg-cyan-500' : 'bg-blue-500'}`} />
                  <div className={`h-8 flex-1 rounded-lg ${theme.id === 'industrial' ? 'border-2 border-slate-900 bg-slate-50' : theme.id === 'cockpit' ? 'border border-white/60 bg-white/70' : 'bg-white border border-slate-200'}`} />
                  <div className={`h-8 w-16 rounded-lg ${theme.id === 'industrial' ? 'bg-slate-900' : theme.id === 'cockpit' ? 'bg-cyan-700' : 'bg-blue-600'}`} />
                </div>
              </div>

              {selected ? (
                <p className="mt-3 text-xs font-bold text-emerald-700">Style actif</p>
              ) : (
                <p className="mt-3 text-xs font-semibold text-slate-500">Cliquer pour activer</p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

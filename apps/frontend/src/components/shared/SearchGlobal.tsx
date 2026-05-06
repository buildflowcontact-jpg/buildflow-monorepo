import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSearch, type SearchResult, type SearchResultType } from '../../hooks/useSearch';

const resultTypeLabel: Record<SearchResultType, string> = {
  project: 'Projet',
  document: 'Document',
  incident: 'Incident',
  task: 'Tache',
  supplier: 'Fournisseur',
  worker: 'Intervenant',
};

const resultTypeRoute: Record<SearchResultType, string> = {
  project: '/executer',
  document: '/executer',
  incident: '/executer',
  task: '/planifier',
  supplier: '/piloter',
  worker: '/equipe',
};

function SearchResultRow({ result, onSelect }: { result: SearchResult; onSelect: () => void }) {
  return (
    <Link
      to={resultTypeRoute[result.type]}
      onClick={onSelect}
      className="bf-search-result flex items-start justify-between gap-3 rounded-xl px-4 py-3"
    >
      <div className="min-w-0">
        <p className="bf-text-primary text-sm font-semibold truncate">{result.title}</p>
        {result.subtitle ? <p className="bf-text-muted text-xs truncate">{result.subtitle}</p> : null}
      </div>
      <span className="bf-badge shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
        {resultTypeLabel[result.type]}
      </span>
    </Link>
  );
}

export function SearchGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const { data = [], isFetching } = useSearch(deferredQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const groupedResults = useMemo(() => {
    return data.reduce<Record<string, SearchResult[]>>((accumulator, item) => {
      const group = resultTypeLabel[item.type];
      accumulator[group] = accumulator[group] ?? [];
      accumulator[group].push(item);
      return accumulator;
    }, {});
  }, [data]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bf-search-trigger flex items-center gap-2 rounded-xl px-3 py-2 text-sm bf-text-muted hover:opacity-95"
        aria-label="Ouvrir la recherche globale"
      >
        <Search size={16} />
        <span className="hidden md:inline">Rechercher</span>
        <span className="bf-keycap hidden md:inline rounded px-1.5 py-0.5 text-[10px] font-bold">Ctrl K</span>
      </button>

      {isOpen ? (
        <div className="bf-search-overlay fixed inset-0 z-[70] px-4 py-10" onClick={() => setIsOpen(false)}>
          <div className="bf-search-shell mx-auto max-w-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
              <Search size={18} className="bf-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher projets, documents, incidents, taches, fournisseurs, intervenants..."
                className="h-11 w-full bg-transparent text-sm bf-text-primary outline-none"
              />
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 bf-text-muted hover:bg-slate-200/60" aria-label="Fermer la recherche">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-4">
              {deferredQuery.trim().length < 2 ? (
                <p className="bf-text-muted text-sm">Saisissez au moins 2 caracteres.</p>
              ) : null}

              {deferredQuery.trim().length >= 2 && isFetching ? (
                <p className="bf-text-muted text-sm">Recherche en cours...</p>
              ) : null}

              {deferredQuery.trim().length >= 2 && !isFetching && data.length === 0 ? (
                <p className="bf-text-muted text-sm">Aucun resultat.</p>
              ) : null}

              <div className="space-y-4">
                {Object.entries(groupedResults).map(([group, results]) => (
                  <section key={group} className="space-y-2">
                    <h3 className="bf-section-eyebrow text-xs font-black uppercase tracking-wide">{group}</h3>
                    <div className="space-y-2">
                      {results.map((result) => (
                        <SearchResultRow key={`${result.type}-${result.id}`} result={result} onSelect={() => setIsOpen(false)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
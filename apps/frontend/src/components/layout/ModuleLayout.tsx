import React from 'react';

type LayoutVariant = '3col' | '2col';

interface ModuleLayoutProps {
  /** Titre affiché dans l'en-tête du module */
  title?: string;
  /** Description courte sous le titre */
  description?: string;
  /** Panneau gauche (navigation / filtres) */
  left: React.ReactNode;
  /** Zone de travail centrale */
  children: React.ReactNode;
  /** Panneau droit (actions rapides). Ignoré en layout 2col. */
  right?: React.ReactNode;
  /**
   * Variante de grille :
   * - `3col` (défaut) : col-3 / col-6 / col-3
   * - `2col` : col-4 / col-8 (ex. Incidents)
   */
  layout?: LayoutVariant;
  /** Classes CSS additionnelles sur l'élément racine */
  className?: string;
  /** Remplace les classes du panneau gauche (défaut: "bf-card-soft p-4 space-y-3") */
  leftClassName?: string;
  /** Remplace les classes du panneau droit (défaut: "bf-card-soft p-4 space-y-3 h-fit") */
  rightClassName?: string;
}

const COLS: Record<LayoutVariant, { left: string; center: string; right: string }> = {
  '3col': { left: 'xl:col-span-3', center: 'xl:col-span-6', right: 'xl:col-span-3' },
  '2col': { left: 'xl:col-span-4', center: 'xl:col-span-8', right: '' },
};

export function ModuleLayout({
  title,
  description,
  left,
  children,
  right,
  layout = '3col',
  className = '',
  leftClassName = 'bf-card-soft p-4 space-y-3',
  rightClassName = 'bf-card-soft p-4 space-y-3 h-fit',
}: ModuleLayoutProps) {
  const cols = COLS[layout];

  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && (
            <h2 className="bf-text-primary font-black tracking-tight text-2xl">{title}</h2>
          )}
          {description && (
            <p className="bf-text-muted text-sm">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section className={`${cols.left} ${leftClassName}`}>{left}</section>

        <section className={`${cols.center}`}>{children}</section>

        {layout === '3col' && right && (
          <aside className={`${cols.right} ${rightClassName}`}>{right}</aside>
        )}
      </div>
    </div>
  );
}

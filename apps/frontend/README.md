# BuildFlow Frontend

Frontend React de BuildFlow (Vite + Tailwind + Supabase + React Query + Apollo).

## Scripts

- `npm run dev`: demarrage local Vite
- `npm run build`: build production
- `npm run preview`: apercu local du build
- `npm run test:unit`: tests unitaires Jest
- `npm run test:e2e`: tests Playwright
- `npm run test:all`: unitaires + e2e
- `npm run typecheck`: verification TypeScript
- `npm run audit:prod`: audit securite dependances runtime
- `npm run check:bundle`: verifie les budgets de chunks et les preloads interdits
- `npm run check`: typecheck + tests unitaires

## Lancer l'application

Depuis la racine du repo:

```bash
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run dev
```

Preview du build (port fixe recommande):

```bash
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run build
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Si le port est deja pris, basculer sur 4174:

```bash
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run preview -- --host 127.0.0.1 --port 4174 --strictPort
```

## Garde-fou bundle

Le projet inclut un garde-fou CI pour eviter les regressions de poids JS:

```bash
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run build
npm --prefix c:/05_APPLICATIONS/BuildFlow/apps/frontend run check:bundle
```

Le script verifie:

- des limites de taille pour les chunks critiques (`index`, `dataVendor`, `supabaseVendor`, viewers lourds)
- l'absence de `modulepreload` HTML sur les chunks viewers volumineux (IFC/PDF)

En cas d'echec:

1. relancer `npm run build` puis `npm run check:bundle` pour reproduire localement
2. identifier le chunk en depassement dans la sortie du script
3. deplacer le module en lazy import ou raffiner `manualChunks` dans `vite.config.ts`
4. verifier que `dist/index.html` ne precharge pas les chunks viewers lourds

## Conventions UI

- Utiliser les classes utilitaires Tailwind et les surfaces communes (`surface-panel`).
- Conserver une hierarchie visuelle claire: titre, sous-titre, contenu.
- Garder les labels de formulaires explicites et accessibles.

## Conventions hooks et data

- Placer la logique data dans des hooks par feature (ex: `useProjectEvents`).
- Les composants restent principalement presentationnels.
- Ne pas instancier plusieurs clients Supabase: importer le client unique depuis `src/lib/supabase.ts`.

## Conventions API

- Supabase:
- Auth: `supabase.auth.*`
- Tables via `supabase.from('<table>')`
- Storage: `supabase.storage.from('<bucket>')`

- React Query:
- Query keys stables et explicites, ex: `['project-events', projectId]`
- Invalidation locale apres mutation

## Architecture rapide

- `src/App.tsx`: shell global + navigation principale
- `src/features/*`: domaines fonctionnels
- `src/modules/*`: modules metier
- `src/components/ui/*`: composants UI partages
- `src/i18n/*`: dictionnaires et helper i18n
- `docs/*`: audit et decisions d'architecture

## Qualite et CI

La CI frontend execute:

1. Install
2. Build
3. Tests unitaires
4. Playwright e2e
5. Deploy (branche main)

## Ressources

- Audit securite/performance: `docs/AUDIT_SECURITE_PERFORMANCE.md`
- Plan scalabilite: `docs/SCALABILITE.md`

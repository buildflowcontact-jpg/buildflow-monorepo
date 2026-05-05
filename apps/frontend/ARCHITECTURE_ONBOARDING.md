# BuildFlow – Architecture & Onboarding

## Architecture technique

- **React 18 + TypeScript (strict)** : SPA/PWA, composants fonctionnels, typage strict, aucune utilisation de `any`.
- **Vite** : Bundler, configuration alias `@`, variables d’environnement `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **TailwindCSS** : Styling 100% utilitaire, mobile-first, pas de fichiers CSS custom.
- **shadcn/ui** : Tous les composants UI (Button, Modal, Toast, etc.), base Radix, preset Lyra, tokens natifs pour dark mode.
- **Zustand** : State management global.
- **React Hook Form + Zod** : Tous les formulaires, validation, feedback, factorisés via `useZodForm`.
- **Supabase JS SDK** : Backend (API, Auth, Storage, Realtime, RLS).
- **React Router v6** : Routing SPA.
- **@tanstack/react-query** : Data fetching/caching.
- **Jest, Playwright, jest-axe** : Tests unitaires, e2e, accessibilité.
- **Vercel** : Déploiement.

## Structure des dossiers principaux

- `src/components/ui/` : Composants UI réutilisables (Button, Spinner, ToastProvider, AuthForm, etc.)
- `src/features/` : Modules métier (planifier, piloter, events, etc.)
- `src/modules/` : Sous-domaines (bureau-etudes, chantier, etc.)
- `src/hooks/` : Hooks utilitaires factorisés (`useZodForm`, etc.)
- `src/utils/` : Fonctions utilitaires, event bus, helpers
- `src/App.tsx` : Layout principal, navigation, providers globaux
- `src/main.tsx` : Entrée app, providers racine

## Patterns & conventions

- **UI** : Tous les composants utilisent les tokens Tailwind (`bg-card`, `text-foreground`, etc.) pour le dark mode natif.
- **Formulaires** : Utilisation systématique de `useZodForm` pour factoriser logique RHF + Zod.
- **Feedback** : Toasts globaux (`ToastProvider`), loaders (`Spinner`), feedback accessible.
- **Accessibilité** : Labels, aria, focus, navigation clavier, tests `jest-axe`.
- **Tests** : Mocks pour Supabase, ToastProvider, useAuth, QueryClientProvider, etc.
- **State** : Stores Zustand pour états globaux, contextes pour feedback.

## Onboarding développeur

1. **Cloner le repo**
2. `cd apps/frontend && npm install`
3. Copier `.env.local.example` → `.env.local` et renseigner les clés Supabase
4. `npm run dev` pour lancer l’app
5. `npm run test` pour lancer tous les tests (unitaires, accessibilité)
6. `npm run e2e` pour les tests end-to-end (Playwright)
7. Pour ajouter un formulaire :
   - Créer le schéma Zod
   - Utiliser `useZodForm(schema, { defaultValues })`
   - Utiliser les composants UI shadcn/ui
8. Pour ajouter un composant UI :
   - Placer dans `src/components/ui/`
   - Utiliser les tokens Tailwind et respecter l’accessibilité
9. Pour toute logique métier, créer un module dans `src/features/` ou `src/modules/`
10. Pour toute question, consulter la documentation dans ce fichier ou demander à l’équipe

---

**Contact technique** : lead-dev@buildflow.com

**Dernière mise à jour** : 05/05/2026

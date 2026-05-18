# BuildFlow Monorepo

Ce dépôt contient :
- `/apps/frontend` : Application React (Vite, Tailwind, Supabase, Apollo Client)
- `/apps/backend` : API Fastify + Apollo Server (Node.js)
- `/packages/common` : Types partagés (optionnel)

## Lancement rapide

1. Installez les dépendances dans chaque dossier (`frontend`, `backend`).
2. Configurez vos variables d'environnement (voir `.env.example`).
3. Lancez le frontend : `cd apps/frontend && npm run dev`
4. Lancez le backend : `cd apps/backend && npm run dev`

---

**Stack** :
- Frontend : React 18, Vite, TailwindCSS, Supabase JS, Apollo Client
- Backend : Fastify, Apollo Server, Supabase (DB, Auth, Storage)
- DB : PostgreSQL (hébergée sur Supabase)

---

## Checklist release (rapide)

Avant d'ouvrir une PR (ou de merger sur master), exécuter au minimum :

1. Frontend typecheck + tests unitaires

	- npm --prefix ./apps/frontend run check

2. Frontend build + budget bundle

	- npm --prefix ./apps/frontend run build
	- npm --prefix ./apps/frontend run check:bundle

3. Backend build

	- npm --prefix ./apps/backend run build

4. Audit runtime dépendances

	- npm --prefix ./apps/frontend audit --omit=dev
	- npm --prefix ./apps/backend audit --omit=dev

5. Vérification Git finale

	- git status -sb
	- vérifier qu'aucun artefact local (dist, node_modules) n'est inclus dans le commit

Si un check CI échoue après push, corriger uniquement la tranche en échec puis revalider localement la commande correspondante avant le prochain push.

---

Pour toute question, contactez l'équipe technique.

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

Pour toute question, contactez l'équipe technique.

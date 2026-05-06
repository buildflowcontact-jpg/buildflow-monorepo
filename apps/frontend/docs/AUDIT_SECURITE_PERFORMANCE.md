# Audit Securite et Performance - Frontend BuildFlow

Date: 2026-05-05
Perimetre: apps/frontend

## Resume executif

- Etat global: fonctionnel mais desameliorations sont necessaires sur la supply-chain et le poids des bundles.
- Risque principal securite: dependances transitives avec vulnerabilites `high` (via `tar` / `@mapbox/node-pre-gyp`).
- Risque principal performance: chunks JS tres volumineux (> 1 MB gzip pour un chunk, > 3 MB brut pour un autre).

## Constats securite

Commande executee:

```bash
npm audit --omit=dev --json
```

Resultat principal:

- 2 vulnerabilites `high` (transitives)
- Packages touches:
- `tar` (plusieurs advisories de path traversal / overwrite)
- `@mapbox/node-pre-gyp` (via `tar`)

Actions recommandees:

1. Mettre a jour le lockfile et appliquer les corrections disponibles:
- `npm audit fix`
- puis revalider `npm run audit:prod`
2. Surveiller la chaine native (`node-pre-gyp`) dans les dependances indirectes.
3. Garder les secrets uniquement en variables d'environnement (deja en place).

Renforcements appliques dans ce lot:

- Headers HTTP de base ajoutes dans `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Constats performance

Commande executee:

```bash
npm run build
```

Resultat principal:

- Chunks trop volumineux apres minification:
- `dist/assets/index-*.js` ~1.26 MB (372 kB gzip)
- `dist/assets/index-CTcFC28D.js` ~3.60 MB (643 kB gzip)

Actions recommandees:

1. Introduire du code-splitting (lazy loading) sur modules lourds:
- viewers PDF / IFC
- ecrans secondaires (Planifier, Piloter, Equipe)
2. Configurer `manualChunks` dans `vite.config.ts` pour isoler gros fournisseurs.
3. Mesurer un budget de performance en CI (Lighthouse CI ou seuil bundle).

## Verification continue proposee

Scripts utiles ajoutes:

- `npm run audit:prod`
- `npm run typecheck`
- `npm run check`

Pipeline recommande:

1. `npm ci`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run build`
5. `npm run audit:prod`

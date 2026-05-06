# Scalabilite et Evolutivite - Frontend BuildFlow

## Objectif

Etablir des conventions simples pour faire evoluer l'application sans regression lorsque le nombre d'ecrans, de roles et de projets augmente.

## Decisions appliquees

1. Socle i18n minimal ajoute:
- `src/i18n/fr.ts`
- `src/i18n/index.ts`
- Fonction `t(key)` et `setLocale(locale)`

2. Client Supabase unifie:
- Singleton global dans `src/lib/supabase.ts`
- `src/utils/supabaseClient.ts` conserve comme alias de compatibilite

3. Scripts de verification standardises:
- `typecheck`
- `check`

## Patterns recommandes

### Composants

- Presentation pure dans les composants UI.
- Logique data dans hooks `use*` par feature.
- Eviter les side effects dans le rendu.

### Donnees

- React Query pour la cohesion du cache.
- Hooks metier par feature:
- `useProjectDocuments`
- `useProjectEvents`

### Internationalisation

- Ajouter les nouvelles cles dans `src/i18n/fr.ts`.
- Utiliser `t('cle')` dans la couche UI.
- Quand l'anglais sera requis, ajouter `src/i18n/en.ts` puis brancher `setLocale('en')`.

### Extension des roles

- Centraliser la logique role dans un helper dedie (a introduire dans un prochain lot).
- Eviter les checks email disperses dans la UI.

## Prochaines etapes

1. Introduire `React.lazy` pour les modules lourds (PDF/IFC).
2. Ajouter ESLint + regles d'architecture (imports par feature).
3. Ajouter un dossier `src/features/<feature>/api` par domaine pour isoler les acces data.
4. Mettre en place un routeur explicite (React Router) si le nombre d'ecrans continue de croitre.

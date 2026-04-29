# BuildFlow - Supabase Schema

## Déploiement du schéma

1. Appliquer le schéma principal :

```sql
\i schema.sql
```

2. Appliquer les triggers :

```sql
\i triggers.sql
```

3. Appliquer les règles RLS :

```sql
\i rls.sql
```

## À faire côté Supabase
- Créer les tables `projects`, `documents` (structure minimale)
- Activer l'authentification (email/password, magic link)
- Créer le bucket `project-media` dans Storage
- Ajouter la table user_roles si gestion fine des droits
- Déployer la fonction Edge pour le daily_report automatique (cron 17h)

## Sécurité
- RLS stricte : les TECHNICIENS/SOUS_TRAITANTS ne voient que les plans BPE validés
- Les validations critiques passent par des fonctions RPC sécurisées

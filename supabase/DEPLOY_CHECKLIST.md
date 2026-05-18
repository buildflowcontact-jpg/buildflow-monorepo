# Supabase Scheduling Release Checklist

## 1) Pre-deploy
- Confirm target project ref and environment.
- Ensure you are authenticated as an admin role in Supabase.
- Notify team that scheduling migration is being applied.

## 2) Apply SQL in order
1. `\i schema.sql`
2. `\i triggers.sql`
3. `\i scheduling_schema.sql`
4. `\i scheduling_hotfix_2026_05_18.sql`
5. `\i rls.sql`

## 3) Post-deploy verification
Run:

```sql
select tablename
from pg_tables
where schemaname='public'
  and tablename in ('worker_schedules','schedule_collisions','collision_alerts')
order by tablename;
```

Expected: 3 rows.

## 4) RLS smoke checks
- Member can select/update own schedule entries.
- Non-member cannot read/update schedule entries.
- Authorized project owner can insert schedule collisions.
- Non-member cannot insert schedule collisions.
- Collision alert recipient can read own alert.
- Non-recipient cannot read alert.

## 5) Rollback strategy
- If deployment fails mid-run, re-run the same script sequence (idempotent statements are used).
- If behavior regression is detected, disable affected trigger/policy temporarily and restore previous function/policy definitions from VCS history.
- Record incident details and exact failing SQL in the release log.

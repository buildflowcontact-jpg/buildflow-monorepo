-- supabase/event_sourcing.sql
-- Améliore la table project_events existante pour l'event sourcing.
-- Cette migration est ADDITIVE — elle n'efface rien.
--
-- Exécuter via : Supabase Dashboard → SQL Editor

-- -------------------------------------------------------------------------
-- 1. Index de performance : lecture par entité (très fréquent)
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_events_entity
  ON project_events ((event_data->>'entity_id'), (event_data->>'entity_type'), created_at);

CREATE INDEX IF NOT EXISTS idx_project_events_project_type
  ON project_events (project_id, event_type, created_at);

-- -------------------------------------------------------------------------
-- 2. RLS : lecture réservée aux membres du projet
--    (même politique que incidents / tasks)
-- -------------------------------------------------------------------------
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

-- Lecture : membres du projet
CREATE POLICY "project_events_select"
  ON project_events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    )
  );

-- Insertion : tout utilisateur authentifié (append-only)
CREATE POLICY "project_events_insert"
  ON project_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Pas de UPDATE / DELETE → table immuable

-- -------------------------------------------------------------------------
-- 3. Vue helper : historique lisible pour l'audit UI
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW event_sourcing_log AS
SELECT
  pe.id,
  pe.project_id,
  pe.event_type,
  pe.event_data->>'entity_type'  AS entity_type,
  pe.event_data->>'entity_id'    AS entity_id,
  pe.event_data->>'created_by'   AS created_by,
  pe.event_data->'payload'       AS payload,
  pe.created_at
FROM project_events pe
WHERE pe.event_data->>'entity_id' IS NOT NULL
ORDER BY pe.created_at DESC;

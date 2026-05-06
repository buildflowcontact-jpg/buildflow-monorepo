-- supabase/final_industrial_backend.sql
-- Architecture SaaS industriel additive.
-- Ne casse pas l'existant : complète project_events/notifications et ajoute
-- activity_logs, snapshots, vue events et triggers de projection légère.

-- ---------------------------------------------------------------------------
-- 0. Compatibilité project_events legacy -> event sourcing
--    Schéma historique distant : type / description / metadata
--    Schéma attendu par le frontend : event_type / event_data
-- ---------------------------------------------------------------------------
ALTER TABLE project_events
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_data jsonb;

UPDATE project_events
SET
  event_type = COALESCE(event_type, type),
  event_data = COALESCE(
    event_data,
    jsonb_build_object(
      'description', description,
      'payload', COALESCE(metadata, '{}'::jsonb)
    )
  )
WHERE event_type IS NULL OR event_data IS NULL;

-- ---------------------------------------------------------------------------
-- 1. Vue canonique events (alias lisible de project_events)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW events AS
SELECT
  pe.id,
  pe.project_id,
  pe.event_data->>'entity_type' AS entity_type,
  pe.event_data->>'entity_id' AS entity_id,
  pe.event_type,
  COALESCE(pe.event_data->'payload', '{}'::jsonb) AS payload,
  NULLIF(pe.event_data->>'created_by', '')::uuid AS created_by,
  pe.created_at
FROM project_events pe;

-- ---------------------------------------------------------------------------
-- 2. Activity logs : timeline UX lisible
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  title text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_project_created_at
  ON activity_logs (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON activity_logs (entity_type, entity_id, created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_logs_select"
  ON activity_logs FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "activity_logs_insert"
  ON activity_logs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Snapshots : optimisation de rebuild event-sourcing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  based_on_event_id uuid REFERENCES project_events(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_entity_latest
  ON snapshots (entity_type, entity_id, version DESC);

ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select"
  ON snapshots FOR SELECT
  USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "snapshots_insert"
  ON snapshots FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Notifications : enrichissement du schéma existant
-- ---------------------------------------------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_notifications_project_priority
  ON notifications (project_id, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_select'
  ) THEN
    CREATE POLICY "notifications_select"
      ON notifications FOR SELECT
      USING (
        project_id IN (
          SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
        )
        AND (user_id IS NULL OR user_id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'notifications_insert'
  ) THEN
    CREATE POLICY "notifications_insert"
      ON notifications FOR INSERT
      WITH CHECK (
        project_id IN (
          SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Projection activity_logs depuis project_events (append-only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION project_event_to_activity_log()
RETURNS trigger AS $$
DECLARE
  entity_type_value text;
  entity_id_value uuid;
  action_value text;
  title_value text;
  description_value text;
  user_id_value uuid;
BEGIN
  entity_type_value := NEW.event_data->>'entity_type';
  entity_id_value := NULLIF(NEW.event_data->>'entity_id', '')::uuid;
  action_value := NEW.event_type;
  title_value := replace(initcap(replace(NEW.event_type, '_', ' ')), '  ', ' ');
  description_value := COALESCE(NEW.event_data->'payload'->>'title', NEW.event_data->'payload'->>'comment', NEW.event_type);
  user_id_value := NULLIF(NEW.event_data->>'created_by', '')::uuid;

  INSERT INTO activity_logs (project_id, entity_type, entity_id, action, title, description, user_id, created_at)
  VALUES (NEW.project_id, COALESCE(entity_type_value, 'project'), entity_id_value, action_value, title_value, description_value, user_id_value, NEW.created_at);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_project_events_to_activity_log ON project_events;
CREATE TRIGGER trg_project_events_to_activity_log
AFTER INSERT ON project_events
FOR EACH ROW
EXECUTE FUNCTION project_event_to_activity_log();

-- Scheduling module schema (worker schedules, collisions, alerts)
-- Idempotent script for Supabase SQL Editor

-- -----------------------------------------------------------------------------
-- 1) Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.worker_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  location text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  equipment_ids uuid[] NOT NULL DEFAULT '{}',
  is_tentative boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT worker_schedules_time_check CHECK (start_time < end_time),
  CONSTRAINT worker_schedules_location_len CHECK (char_length(location) <= 255),
  CONSTRAINT worker_schedules_notes_len CHECK (notes IS NULL OR char_length(notes) <= 500)
);

CREATE TABLE IF NOT EXISTS public.schedule_collisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_schedule_id uuid NOT NULL REFERENCES public.worker_schedules(id) ON DELETE CASCADE,
  conflicting_schedule_id uuid NOT NULL REFERENCES public.worker_schedules(id) ON DELETE CASCADE,
  collision_type text NOT NULL,
  severity text NOT NULL,
  overlap_minutes integer NOT NULL,
  suggested_resolution text,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_collisions_type_check CHECK (collision_type IN ('LOCATION_OVERLAP', 'EQUIPMENT_CONFLICT', 'TEAM_CONFLICT')),
  CONSTRAINT schedule_collisions_severity_check CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  CONSTRAINT schedule_collisions_overlap_check CHECK (overlap_minutes >= 0),
  CONSTRAINT schedule_collisions_distinct_schedule_check CHECK (primary_schedule_id <> conflicting_schedule_id),
  CONSTRAINT schedule_collisions_resolution_notes_len CHECK (resolution_notes IS NULL OR char_length(resolution_notes) <= 1000),
  CONSTRAINT schedule_collisions_unique UNIQUE (primary_schedule_id, conflicting_schedule_id, collision_type)
);

CREATE TABLE IF NOT EXISTS public.collision_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collision_id uuid NOT NULL REFERENCES public.schedule_collisions(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  acknowledged_at timestamptz,
  dismissal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT collision_alerts_unique UNIQUE (collision_id, recipient_id)
);

-- -----------------------------------------------------------------------------
-- 2) Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_worker_schedules_project_time
  ON public.worker_schedules (project_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_worker_schedules_worker_project_time
  ON public.worker_schedules (worker_id, project_id, start_time);

CREATE INDEX IF NOT EXISTS idx_worker_schedules_equipment
  ON public.worker_schedules USING gin (equipment_ids);

CREATE INDEX IF NOT EXISTS idx_schedule_collisions_primary
  ON public.schedule_collisions (primary_schedule_id);

CREATE INDEX IF NOT EXISTS idx_schedule_collisions_conflicting
  ON public.schedule_collisions (conflicting_schedule_id);

CREATE INDEX IF NOT EXISTS idx_schedule_collisions_resolved_at
  ON public.schedule_collisions (resolved_at);

CREATE INDEX IF NOT EXISTS idx_collision_alerts_recipient_ack
  ON public.collision_alerts (recipient_id, acknowledged_at, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3) updated_at trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_worker_schedules_updated_at ON public.worker_schedules;
CREATE TRIGGER trg_worker_schedules_updated_at
  BEFORE UPDATE ON public.worker_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

DROP TRIGGER IF EXISTS trg_schedule_collisions_updated_at ON public.schedule_collisions;
CREATE TRIGGER trg_schedule_collisions_updated_at
  BEFORE UPDATE ON public.schedule_collisions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_row_updated_at();

-- -----------------------------------------------------------------------------
-- 4) Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.worker_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_collisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collision_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS worker_schedules_select_policy ON public.worker_schedules;
CREATE POLICY worker_schedules_select_policy
  ON public.worker_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = worker_schedules.project_id
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS worker_schedules_insert_policy ON public.worker_schedules;
CREATE POLICY worker_schedules_insert_policy
  ON public.worker_schedules FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = worker_schedules.project_id
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS worker_schedules_update_policy ON public.worker_schedules;
CREATE POLICY worker_schedules_update_policy
  ON public.worker_schedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = worker_schedules.project_id
        AND pm.user_id = auth.uid()
    )
    AND (
      worker_schedules.worker_id = auth.uid()
      OR worker_schedules.created_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.project_members pm
        WHERE pm.project_id = worker_schedules.project_id
          AND pm.user_id = auth.uid()
          AND pm.role IN ('CHEF_PROJET', 'CHEF_CHANTIER', 'BE')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = worker_schedules.project_id
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS worker_schedules_delete_policy ON public.worker_schedules;
CREATE POLICY worker_schedules_delete_policy
  ON public.worker_schedules FOR DELETE
  USING (
    worker_schedules.created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = worker_schedules.project_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('CHEF_PROJET', 'CHEF_CHANTIER', 'BE')
    )
  );

DROP POLICY IF EXISTS schedule_collisions_select_policy ON public.schedule_collisions;
CREATE POLICY schedule_collisions_select_policy
  ON public.schedule_collisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.worker_schedules ws
      JOIN public.project_members pm
        ON pm.project_id = ws.project_id
      WHERE ws.id = schedule_collisions.primary_schedule_id
        AND pm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.worker_schedules ws
      JOIN public.project_members pm
        ON pm.project_id = ws.project_id
      WHERE ws.id = schedule_collisions.conflicting_schedule_id
        AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS schedule_collisions_update_policy ON public.schedule_collisions;
CREATE POLICY schedule_collisions_update_policy
  ON public.schedule_collisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.worker_schedules ws
      JOIN public.project_members pm
        ON pm.project_id = ws.project_id
      WHERE ws.id = schedule_collisions.primary_schedule_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('CHEF_PROJET', 'CHEF_CHANTIER', 'BE')
    )
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS collision_alerts_select_policy ON public.collision_alerts;
CREATE POLICY collision_alerts_select_policy
  ON public.collision_alerts FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS collision_alerts_update_policy ON public.collision_alerts;
CREATE POLICY collision_alerts_update_policy
  ON public.collision_alerts FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Scheduling hotfixes applied on 2026-05-18
-- Purpose: keep repository SQL in sync with production fixes.

-- -----------------------------------------------------------------------------
-- 1) Fix schedule audit trigger function for activity_logs schema compatibility
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id uuid;
  v_entity_id uuid;
  v_worker_id uuid;
  v_location text;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_equipment_ids uuid[];
  v_action text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
    v_entity_id := OLD.id;
    v_worker_id := OLD.worker_id;
    v_location := OLD.location;
    v_start_time := OLD.start_time;
    v_end_time := OLD.end_time;
    v_equipment_ids := OLD.equipment_ids;
    v_action := 'schedule_deleted';
  ELSIF TG_OP = 'INSERT' THEN
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_worker_id := NEW.worker_id;
    v_location := NEW.location;
    v_start_time := NEW.start_time;
    v_end_time := NEW.end_time;
    v_equipment_ids := NEW.equipment_ids;
    v_action := 'schedule_created';
  ELSE
    v_project_id := NEW.project_id;
    v_entity_id := NEW.id;
    v_worker_id := NEW.worker_id;
    v_location := NEW.location;
    v_start_time := NEW.start_time;
    v_end_time := NEW.end_time;
    v_equipment_ids := NEW.equipment_ids;
    v_action := 'schedule_updated';
  END IF;

  INSERT INTO public.activity_logs (
    project_id,
    user_id,
    action,
    entity_type,
    entity_id,
    title,
    description,
    created_at
  ) VALUES (
    v_project_id,
    auth.uid(),
    v_action,
    'worker_schedule',
    v_entity_id,
    'Schedule activity',
    format(
      'worker_id=%s location=%s start=%s end=%s equipment=%s',
      v_worker_id,
      coalesce(v_location, ''),
      v_start_time,
      v_end_time,
      coalesce(array_to_string(v_equipment_ids, ','), '')
    ),
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2) Remove recursive project_members policy logic
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = p_user_id
      AND lower(pm.role) IN ('owner', 'chef_projet', 'chef_chantier', 'be')
  );
$$;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_members', p.policyname);
  END LOOP;
END $$;

CREATE POLICY project_members_select_policy
  ON public.project_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_project_member(project_id, auth.uid())
  );

CREATE POLICY project_members_insert_policy
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_project_owner(project_id, auth.uid())
  );

CREATE POLICY project_members_update_policy
  ON public.project_members
  FOR UPDATE
  USING (public.is_project_owner(project_id, auth.uid()))
  WITH CHECK (public.is_project_owner(project_id, auth.uid()));

CREATE POLICY project_members_delete_policy
  ON public.project_members
  FOR DELETE
  USING (public.is_project_owner(project_id, auth.uid()));

-- -----------------------------------------------------------------------------
-- 3) Allow controlled INSERT on schedule_collisions for project owners
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS schedule_collisions_insert_policy ON public.schedule_collisions;
CREATE POLICY schedule_collisions_insert_policy
  ON public.schedule_collisions
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.worker_schedules ws_primary
      JOIN public.worker_schedules ws_conflict
        ON ws_conflict.id = schedule_collisions.conflicting_schedule_id
      WHERE ws_primary.id = schedule_collisions.primary_schedule_id
        AND ws_primary.project_id = ws_conflict.project_id
        AND public.is_project_owner(ws_primary.project_id, auth.uid())
    )
  );

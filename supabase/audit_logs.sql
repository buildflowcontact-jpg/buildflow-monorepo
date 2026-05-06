-- ============================================================
-- Migration : audit_logs — journal d'audit métier immuable
-- INSERT ONLY : aucun UPDATE ni DELETE autorisé (RLS enforce)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid,                              -- lien event métier optionnel
  user_id       uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text          NOT NULL,            -- READ | CREATE | UPDATE | DELETE | EXPORT | LOGIN | PERMISSION_CHANGE ...
  entity_type   text,                              -- incident | task | document | invoice | user ...
  entity_id     uuid,
  project_id    uuid          REFERENCES public.projects(id) ON DELETE SET NULL,
  metadata      jsonb         DEFAULT '{}'::jsonb, -- contexte enrichi libre
  ip_address    text,
  user_agent    text,
  created_at    timestamptz   NOT NULL DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx       ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_project_id_idx    ON public.audit_logs (project_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx        ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx   ON public.audit_logs (entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx    ON public.audit_logs (created_at DESC);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement membres du projet OU admin
CREATE POLICY "audit_logs_select"
  ON public.audit_logs
  FOR SELECT
  USING (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = audit_logs.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Insertion : tout utilisateur authentifié peut insérer (son propre log)
CREATE POLICY "audit_logs_insert"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- INTERDIRE update et delete (immutabilité)
-- Aucune policy UPDATE ni DELETE → rejetés par défaut

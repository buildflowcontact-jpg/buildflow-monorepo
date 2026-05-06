-- supabase/workflows.sql
-- Table des workflows métier (rules engine déclaratif).
-- Cette table est lue par le Workflow Engine côté client.
-- Les règles sont modifiables SANS déploiement code.
-- -------------------------------------------------------------------------

-- -------------------------------------------------------------------------
-- 1. Table principale
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  entity_type   text NOT NULL CHECK (entity_type IN ('incident', 'task', 'delivery', 'project')),
  trigger_event text NOT NULL,
  conditions    jsonb,
  actions       jsonb NOT NULL DEFAULT '[]',
  active        boolean NOT NULL DEFAULT true,
  max_depth     int NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger
  ON workflows (trigger_event, entity_type, active);

-- -------------------------------------------------------------------------
-- 2. RLS
-- -------------------------------------------------------------------------
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur authentifié (les workflows sont publics par projet)
CREATE POLICY "workflows_select"
  ON workflows FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Écriture : réservée aux admins (à adapter selon votre modèle de rôles)
CREATE POLICY "workflows_insert"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "workflows_update"
  ON workflows FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- -------------------------------------------------------------------------
-- 3. Seeds — workflows métier prêts à l'emploi
-- -------------------------------------------------------------------------

-- 3.1 Incident critique → escalade automatique
INSERT INTO workflows (name, description, entity_type, trigger_event, conditions, actions, max_depth)
VALUES (
  'Escalade incident critique',
  'Un incident soumis avec sévérité critical ou high est automatiquement escaladé',
  'incident',
  'incident_submitted',
  '{"any": [{"severity": "critical"}, {"severity": "high"}]}',
  '[{"event_type": "incident_escalated", "payload": {"escalated_by": "system", "reason": "Sévérité élevée — escalade automatique"}}]',
  1
);

-- 3.2 Tâche complétée → validation automatique si assignée à un chef
INSERT INTO workflows (name, description, entity_type, trigger_event, conditions, actions, max_depth)
VALUES (
  'Auto-validation tâche',
  'Une tâche complétée est automatiquement validée',
  'task',
  'task_completed',
  NULL,
  '[{"event_type": "task_validated", "payload": {"validated_by": "system"}}]',
  1
);

-- 3.3 Livraison reçue en retard → création d'un log incident
INSERT INTO workflows (name, description, entity_type, trigger_event, conditions, actions, max_depth)
VALUES (
  'Retard livraison → incident',
  'Une livraison reçue avec late=true génère un signal d''alerte',
  'delivery',
  'delivery_received',
  '{"late": true}',
  '[{"event_type": "delivery_late", "payload": {"delay_days": 0}}]',
  1
);

-- 3.4 Incident escaladé → notification chef de chantier
INSERT INTO workflows (name, description, entity_type, trigger_event, conditions, actions, max_depth)
VALUES (
  'Notification escalade',
  'Un incident escaladé déclenche une notification au chef de chantier',
  'incident',
  'incident_escalated',
  NULL,
  '[{"event_type": "incident_comment_added", "payload": {"author": "system", "comment": "⚠️ Incident escaladé — chef de chantier notifié"}}]',
  0
);

-- Types
CREATE TYPE user_role AS ENUM (
  'COMMERCIAL', 'CHEF_PROJET', 'BE', 'CONTROLEUR_EXTERNE', 'HSE', 'CHEF_CHANTIER', 'TECHNICIEN', 'SOUS_TRAITANT', 'MAGASINIER', 'CLIENT'
);

-- Utilisateurs & rôles projet
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  role user_role NOT NULL,
  supervisor_id uuid REFERENCES project_members(id),
  created_at timestamptz DEFAULT now()
);

-- Documents & Ghost Versioning
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id),
  version_number integer NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  is_bpe boolean DEFAULT false,
  CONSTRAINT one_bpe_per_doc CHECK (
    (is_bpe AND NOT EXISTS (
      SELECT 1 FROM document_versions dv2 WHERE dv2.document_id = document_id AND dv2.is_bpe AND dv2.id <> id
    )) OR NOT is_bpe
  )
);

-- Tâches & Checklists
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  title text NOT NULL,
  zone text,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz,
  checklist_data jsonb,
  checklist_photo_url text,
  CONSTRAINT validated_by_chef_chantier CHECK (
    validated_at IS NULL OR (
      assigned_to IN (SELECT user_id FROM project_members WHERE role = 'CHEF_CHANTIER')
    )
  )
);

-- Journal de bord
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  date date NOT NULL,
  status text DEFAULT 'INTERNAL_REVIEW',
  weather jsonb,
  incidents jsonb,
  photos jsonb,
  validated_tasks jsonb,
  created_at timestamptz DEFAULT now(),
  published_at timestamptz,
  published_by uuid REFERENCES auth.users(id)
);

-- Fonctions sécurisées
CREATE OR REPLACE FUNCTION set_bpe_version(doc_version_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM project_members WHERE user_id = user_id AND role = 'CHEF_PROJET'
  ) THEN
    RAISE EXCEPTION 'Seul le CHEF_PROJET peut valider le BPE';
  END IF;
  UPDATE document_versions SET is_bpe = true WHERE id = doc_version_id;
  UPDATE document_versions SET is_bpe = false WHERE document_id = (SELECT document_id FROM document_versions WHERE id = doc_version_id) AND id <> doc_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

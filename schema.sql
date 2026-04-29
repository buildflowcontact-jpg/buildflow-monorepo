-- Schéma SQL BuildFlow (à exécuter dans Supabase)

-- Table des projets
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  client_id UUID,
  status TEXT,
  budget_global NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des documents (conteneur)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'PLANS', 'CCTP', 'SÉCURITÉ'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des versions de documents (contenu)
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  storage_path TEXT NOT NULL, -- Chemin Supabase Storage
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
  is_bpe BOOLEAN DEFAULT FALSE, -- Bon Pour Exécution
  created_by UUID,
  validated_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index unique : Un seul BPE par document
CREATE UNIQUE INDEX one_bpe_per_document ON document_versions(document_id) WHERE is_bpe = TRUE;

-- Table des événements projet (Iceberg)
CREATE TABLE project_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID,
  type VARCHAR(50) NOT NULL, -- 'INCIDENT', 'TASK_DONE', 'DOC_VALIDATED', 'EXPENSE', etc.
  task_id UUID,
  blueprint_id UUID,
  budget_id UUID,
  location_id UUID,
  severity_level INT DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_events_type ON project_events(type);
CREATE INDEX idx_project_events_project ON project_events(project_id);

-- Sécurité RLS (exemple)
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
-- À compléter selon les rôles dans Supabase

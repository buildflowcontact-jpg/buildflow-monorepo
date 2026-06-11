-- ==========================================
-- 1. GESTION DES PROJETS & STRUCTURE
-- ==========================================

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  client_id UUID,
  status TEXT CHECK (status IN ('PROSPECTION', 'PLANIFICATION', 'EN_COURS', 'LIVRAISON', 'CLOTURE')),
  budget_global NUMERIC(15, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases du projet (ex: Terrassement, Gros Œuvre, Second Œuvre)
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tâches (WBS - Work Breakdown Structure)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('A_FAIRE', 'EN_COURS', 'TERMINE', 'BLOQUE')),
  priority INT DEFAULT 0,
  estimated_duration INT, -- en jours
  actual_duration INT,
  start_date DATE,
  end_date DATE,
  dependency_id UUID REFERENCES tasks(id), -- Pour le Gantt
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. RESSOURCES HUMAINES & ACCÈS
-- ==========================================

-- Rôles (RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL, -- 'ADMIN', 'CONDUCTEUR_TRAVAUX', 'CHEF_CHANTIER', 'OUVRIER'
  permissions JSONB DEFAULT '{}'
);

-- Profils utilisateurs (liés à Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role_id UUID REFERENCES roles(id),
  phone TEXT,
  email TEXT,
  hourly_rate NUMERIC(10, 2), -- Coût horaire pour le calcul de rentabilité
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affectations (Qui travaille sur quel projet)
CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_on_project TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. SUIVI DE CHANTIER & TEMPS
-- ==========================================

-- Pointages (Timesheets)
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_worked NUMERIC(4, 2) NOT NULL,
  comment TEXT,
  validated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rapports Journaliers (Journal de Chantier)
CREATE TABLE IF NOT EXISTS site_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  report_date DATE NOT NULL,
  weather TEXT,
  manpower_count INT,
  events TEXT, -- Événements marquants de la journée
  incidents TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. GESTION DOCUMENTAIRE (Améliorée)
-- ==========================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'PLANS', 'CCTP', 'SÉCURITÉ', 'CONTRATS'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected')),
  is_bpe BOOLEAN DEFAULT FALSE, -- Bon Pour Exécution
  created_by UUID REFERENCES profiles(id),
  validated_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX one_bpe_per_document ON document_versions(document_id) WHERE is_bpe = TRUE;

-- ==========================================
-- 5. FINANCE & LOGISTIQUE
-- ==========================================

-- Lignes budgétaires
CREATE TABLE IF NOT EXISTS budget_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  estimated_cost NUMERIC(15, 2),
  actual_cost NUMERIC(15, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dépenses (Achats, Sous-traitance)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_line_id UUID REFERENCES budget_lines(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  vendor TEXT,
  invoice_ref TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventaire Matériel
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  status TEXT CHECK (status IN ('DISPONIBLE', 'AFFECTÉ', 'EN_PANNE')),
  current_project_id UUID REFERENCES projects(id),
  last_maintenance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. ÉVÉNEMENTS & LOGS (Iceberg)
-- ==========================================

CREATE TABLE IF NOT EXISTS project_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  type VARCHAR(50) NOT NULL, -- 'INCIDENT', 'TASK_DONE', 'DOC_VALIDATED', 'EXPENSE', 'DELAY'
  task_id UUID REFERENCES tasks(id),
  severity_level INT DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_events_type ON project_events(type);
CREATE INDEX idx_project_events_project ON project_events(project_id);
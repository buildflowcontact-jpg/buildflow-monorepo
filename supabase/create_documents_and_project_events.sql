-- Table documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Table project_events
CREATE TABLE IF NOT EXISTS project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  type text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

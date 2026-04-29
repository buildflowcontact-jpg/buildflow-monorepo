-- RLS pour documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_read" ON documents
  FOR SELECT USING (true);

-- RLS pour project_events
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_events_read" ON project_events
  FOR SELECT USING (true);

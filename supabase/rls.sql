-- RLS pour project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_member_own" ON project_members
  USING (user_id = auth.uid());

-- RLS pour document_versions
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bpe_only_for_tech" ON document_versions
  FOR SELECT USING (
    is_bpe OR (
      EXISTS (SELECT 1 FROM project_members WHERE user_id = auth.uid() AND role IN ('CHEF_PROJET', 'BE', 'CHEF_CHANTIER', 'COMMERCIAL', 'MAGASINIER', 'CLIENT'))
    )
  );

-- RLS pour tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "task_visible_to_assigned" ON tasks
  USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR (
      EXISTS (SELECT 1 FROM project_members WHERE user_id = auth.uid() AND role IN ('CHEF_CHANTIER', 'CHEF_PROJET'))
    )
  );

-- RLS pour daily_reports
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_visible_to_project" ON daily_reports
  USING (
    EXISTS (SELECT 1 FROM project_members WHERE user_id = auth.uid() AND project_id = project_id)
  );

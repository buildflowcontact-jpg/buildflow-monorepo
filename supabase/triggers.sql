-- Trigger pour générer le numéro de version
CREATE OR REPLACE FUNCTION increment_version_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number := COALESCE((SELECT MAX(version_number) FROM document_versions WHERE document_id = NEW.document_id), 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_version_number ON document_versions;
CREATE TRIGGER set_version_number
  BEFORE INSERT ON document_versions
  FOR EACH ROW EXECUTE FUNCTION increment_version_number();

-- Trigger pour générer le daily_report à 17h
-- (À implémenter côté backend ou via Supabase Edge Function/cron)

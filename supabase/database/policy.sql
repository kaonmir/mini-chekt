

DROP POLICY IF EXISTS "Allow only specific email domain" ON auth.users;
CREATE POLICY "Allow only specific email domain"
  ON auth.users
  FOR ALL
  USING (email LIKE '%@chekt.com');


-- Enable RLS on all tables
ALTER TABLE site ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridge ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarm ENABLE ROW LEVEL SECURITY;
ALTER TABLE response ENABLE ROW LEVEL SECURITY;

-- Site table policies
DROP POLICY IF EXISTS "Allow authenticated users to view sites" ON site;
CREATE POLICY "Allow authenticated users to view sites"
  ON site
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert sites" ON site;
CREATE POLICY "Allow authenticated users to insert sites"
  ON site
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update sites" ON site;
CREATE POLICY "Allow authenticated users to update sites"
  ON site
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete sites" ON site;
CREATE POLICY "Allow authenticated users to delete sites"
  ON site
  FOR DELETE
  TO authenticated
  USING (true);

-- Bridge table policies
DROP POLICY IF EXISTS "Allow authenticated users to view bridges" ON bridge;
CREATE POLICY "Allow authenticated users to view bridges"
  ON bridge
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert bridges" ON bridge;
CREATE POLICY "Allow authenticated users to insert bridges"
  ON bridge
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update bridges" ON bridge;
CREATE POLICY "Allow authenticated users to update bridges"
  ON bridge
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete bridges" ON bridge;
CREATE POLICY "Allow authenticated users to delete bridges"
  ON bridge
  FOR DELETE
  TO authenticated
  USING (true);

-- Camera table policies
DROP POLICY IF EXISTS "Allow authenticated users to view cameras" ON camera;
CREATE POLICY "Allow authenticated users to view cameras"
  ON camera
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert cameras" ON camera;
CREATE POLICY "Allow authenticated users to insert cameras"
  ON camera
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update cameras" ON camera;
CREATE POLICY "Allow authenticated users to update cameras"
  ON camera
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete cameras" ON camera;
CREATE POLICY "Allow authenticated users to delete cameras"
  ON camera
  FOR DELETE
  TO authenticated
  USING (true);

-- Alarm table policies
DROP POLICY IF EXISTS "Allow authenticated users to view alarms" ON alarm;
CREATE POLICY "Allow authenticated users to view alarms"
  ON alarm
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert alarms" ON alarm;
CREATE POLICY "Allow authenticated users to insert alarms"
  ON alarm
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update alarms" ON alarm;
CREATE POLICY "Allow authenticated users to update alarms"
  ON alarm
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete alarms" ON alarm;
CREATE POLICY "Allow authenticated users to delete alarms"
  ON alarm
  FOR DELETE
  TO authenticated
  USING (true);

-- Response table policies
DROP POLICY IF EXISTS "Allow authenticated users to view responses" ON response;
CREATE POLICY "Allow authenticated users to view responses"
  ON response
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert responses" ON response;
CREATE POLICY "Allow authenticated users to insert responses"
  ON response
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update responses" ON response;
CREATE POLICY "Allow authenticated users to update responses"
  ON response
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete responses" ON response;
CREATE POLICY "Allow authenticated users to delete responses"
  ON response
  FOR DELETE
  TO authenticated
  USING (true);
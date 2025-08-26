-- Create storage bucket for site logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-logos',
  'site-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for the site-logos bucket
CREATE POLICY "Users can upload their own site logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view all site logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-logos');

CREATE POLICY "Users can update their own site logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'site-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own site logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );


INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alarm-snapshots',
  'alarm-snapshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
-- Create RLS policies for the alarm-snapshots bucket
CREATE POLICY "Anyone can upload alarm snapshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'alarm-snapshots'
  );

CREATE POLICY "Users can view all alarm snapshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'alarm-snapshots' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update alarm snapshots" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'alarm-snapshots' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete alarm snapshots" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'alarm-snapshots' AND
    auth.role() = 'authenticated'
  );

-- Create the 'properties' storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'properties',
    'properties',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public read access on properties bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'properties');

-- Allow uploads (insert) for all roles
CREATE POLICY "Allow uploads to properties bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'properties');

-- Allow updates
CREATE POLICY "Allow updates to properties bucket"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'properties');

-- Allow deletes
CREATE POLICY "Allow deletes from properties bucket"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'properties');

-- Create Storage Bucket for Company Images
-- 1. New Storage Bucket: company-images - Public bucket for storing company logos/images
-- 2. Security: Enable public access for reading images
-- Only authenticated users can upload/update/delete their own images
-- File size limit: 5MB, Allowed file types: image/*

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-images',
  'company-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view company images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-images');

CREATE POLICY "Authenticated users can upload company images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-images' AND auth.uid() = owner);

CREATE POLICY "Users can update own company images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'company-images' AND auth.uid() = owner);

CREATE POLICY "Users can delete own company images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-images' AND auth.uid() = owner);
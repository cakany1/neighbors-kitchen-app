-- Add is_read field to messages table
ALTER TABLE public.messages 
ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false;

-- Create storage bucket for chef gallery images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Storage policies for gallery bucket
CREATE POLICY "Users can view all gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery');

CREATE POLICY "Users can upload their own gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
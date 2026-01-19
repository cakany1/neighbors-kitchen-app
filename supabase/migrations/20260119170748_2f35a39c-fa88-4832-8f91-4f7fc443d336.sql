-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own avatar
CREATE POLICY "Users can upload own avatar" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to update their own avatar
CREATE POLICY "Users can update own avatar" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for users to delete their own avatar
CREATE POLICY "Users can delete own avatar" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatars are publicly viewable (for profile display)
CREATE POLICY "Avatars are publicly viewable" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'avatars');
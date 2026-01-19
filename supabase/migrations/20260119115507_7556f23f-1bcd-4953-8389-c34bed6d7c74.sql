-- Create private bucket for ID documents (only admins can access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add dedicated id_document_url column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- RLS: Only the user can upload their own ID document
CREATE POLICY "Users can upload their own ID document"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can update/delete their own ID documents
CREATE POLICY "Users can manage their own ID documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'id-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own ID documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Only admins can view ID documents (for verification review)
CREATE POLICY "Admins can view all ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Function to delete ID document after approval (security cleanup)
CREATE OR REPLACE FUNCTION public.delete_id_document_after_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- If verification was approved and there's an ID document
  IF NEW.verification_status = 'approved' AND OLD.id_document_url IS NOT NULL THEN
    -- Delete the file from storage
    DELETE FROM storage.objects 
    WHERE bucket_id = 'id-documents' 
    AND name LIKE NEW.id || '%';
    
    -- Clear the URL from profile
    NEW.id_document_url := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-delete ID document after approval
DROP TRIGGER IF EXISTS trigger_delete_id_document ON public.profiles;
CREATE TRIGGER trigger_delete_id_document
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.verification_status IS DISTINCT FROM NEW.verification_status)
  EXECUTE FUNCTION public.delete_id_document_after_approval();
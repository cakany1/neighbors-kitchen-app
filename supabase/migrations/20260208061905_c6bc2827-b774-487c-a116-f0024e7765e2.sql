
-- Create admin_reads table to audit admin access to sensitive user data
CREATE TABLE IF NOT EXISTS public.admin_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL DEFAULT 'view', -- view, export, etc.
  fields_accessed TEXT[] NOT NULL DEFAULT '{}', -- which sensitive fields were accessed
  context TEXT, -- page/function where read occurred
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on admin_id for quick lookup of admin's actions
CREATE INDEX idx_admin_reads_admin_id ON public.admin_reads(admin_id);
CREATE INDEX idx_admin_reads_target_user_id ON public.admin_reads(target_user_id);
CREATE INDEX idx_admin_reads_created_at ON public.admin_reads(created_at DESC);

-- Enable RLS on admin_reads
ALTER TABLE public.admin_reads ENABLE ROW LEVEL SECURITY;

-- Only admins can insert logs (system/SECURITY DEFINER only)
CREATE POLICY "Admins can view all admin reads"
ON public.admin_reads FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to fetch user sensitive data and log the read
CREATE OR REPLACE FUNCTION public.admin_view_user_sensitive_data(
  p_target_user_id UUID,
  p_context TEXT DEFAULT 'admin_panel'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_user_data JSON;
  v_fields_accessed TEXT[];
BEGIN
  -- Verify caller is admin
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Admin access required');
  END IF;

  -- Fetch sensitive user data
  SELECT json_build_object(
    'id', p.id,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone_number', p.phone_number,
    'private_address', p.private_address,
    'private_city', p.private_city,
    'private_postal_code', p.private_postal_code,
    'iban', p.iban,
    'id_document_url', p.id_document_url,
    'partner_id_document_url', p.partner_id_document_url,
    'age', p.age,
    'gender', p.gender,
    'id_verified', p.id_verified,
    'photo_verified', p.photo_verified,
    'partner_photo_verified', p.partner_photo_verified,
    'verification_status', p.verification_status::text,
    'partner_verification_status', p.partner_verification_status::text,
    'rejection_reason', p.rejection_reason,
    'rejection_details', p.rejection_details
  ) INTO v_user_data
  FROM public.profiles p
  WHERE p.id = p_target_user_id;

  IF v_user_data IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Determine which fields were accessed (all non-null sensitive fields)
  v_fields_accessed := ARRAY[
    'first_name', 'last_name', 'phone_number', 'private_address', 'private_city',
    'private_postal_code', 'iban', 'id_document_url', 'partner_id_document_url',
    'age', 'gender', 'id_verified', 'photo_verified', 'partner_photo_verified',
    'verification_status', 'partner_verification_status', 'rejection_reason',
    'rejection_details'
  ];

  -- Log the read
  INSERT INTO public.admin_reads (
    admin_id,
    target_user_id,
    action,
    fields_accessed,
    context,
    created_at
  ) VALUES (
    v_admin_id,
    p_target_user_id,
    'view',
    v_fields_accessed,
    p_context,
    now()
  );

  RETURN json_build_object(
    'success', true,
    'data', v_user_data,
    'logged_at', now()
  );
END;
$$;

-- Function to log admin data exports
CREATE OR REPLACE FUNCTION public.admin_log_user_export(
  p_target_user_id UUID,
  p_export_format TEXT DEFAULT 'json',
  p_context TEXT DEFAULT 'admin_export'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
BEGIN
  -- Verify caller is admin
  IF NOT has_role(v_admin_id, 'admin'::app_role) THEN
    RETURN json_build_object('success', false, 'message', 'Unauthorized: Admin access required');
  END IF;

  -- Log the export
  INSERT INTO public.admin_reads (
    admin_id,
    target_user_id,
    action,
    fields_accessed,
    context,
    created_at
  ) VALUES (
    v_admin_id,
    p_target_user_id,
    'export_' || p_export_format,
    ARRAY[
      'first_name', 'last_name', 'phone_number', 'private_address', 'private_city',
      'private_postal_code', 'iban', 'id_document_url', 'email', 'created_at',
      'verification_status', 'successful_pickups', 'no_shows', 'karma'
    ],
    p_context || ' (' || p_export_format || ')',
    now()
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Export logged successfully',
    'export_id', (
      SELECT id FROM public.admin_reads 
      WHERE admin_id = v_admin_id AND target_user_id = p_target_user_id
      ORDER BY created_at DESC LIMIT 1
    )
  );
END;
$$;

-- Create view for admin read audit summary
CREATE OR REPLACE VIEW public.admin_reads_summary AS
SELECT 
  ar.id,
  ar.admin_id,
  ap.first_name as admin_first_name,
  ap.last_name as admin_last_name,
  ar.target_user_id,
  tp.first_name as target_first_name,
  tp.last_name as target_last_name,
  ar.action,
  array_length(ar.fields_accessed, 1) as fields_count,
  ar.context,
  ar.created_at,
  ar.notes
FROM public.admin_reads ar
JOIN public.profiles ap ON ar.admin_id = ap.id
JOIN public.profiles tp ON ar.target_user_id = tp.id
ORDER BY ar.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.admin_reads TO authenticated;
GRANT SELECT ON public.admin_reads_summary TO authenticated;

-- Create release_checks table for QA checklist
CREATE TABLE public.release_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  release_version TEXT NOT NULL,
  check_key TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  checked_by UUID REFERENCES public.profiles(id),
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(release_version, check_key)
);

-- Enable RLS
ALTER TABLE public.release_checks ENABLE ROW LEVEL SECURITY;

-- Only admins can view release checks
CREATE POLICY "Admins can view release checks"
ON public.release_checks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert release checks
CREATE POLICY "Admins can insert release checks"
ON public.release_checks
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update release checks
CREATE POLICY "Admins can update release checks"
ON public.release_checks
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete release checks
CREATE POLICY "Admins can delete release checks"
ON public.release_checks
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_release_checks_updated_at
BEFORE UPDATE ON public.release_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
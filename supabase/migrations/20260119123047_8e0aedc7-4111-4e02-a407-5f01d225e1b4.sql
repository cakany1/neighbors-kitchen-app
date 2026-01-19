-- Create FAQ requests table
CREATE TABLE public.faq_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'published', 'rejected')),
  admin_answer TEXT,
  answered_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  similar_count INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.faq_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit questions (even guests)
CREATE POLICY "Anyone can submit FAQ questions"
ON public.faq_requests
FOR INSERT
WITH CHECK (true);

-- Users can view their own requests
CREATE POLICY "Users can view their own FAQ requests"
ON public.faq_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all FAQ requests"
ON public.faq_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Admins can update requests (answer, publish, reject)
CREATE POLICY "Admins can update FAQ requests"
ON public.faq_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for status filtering
CREATE INDEX idx_faq_requests_status ON public.faq_requests(status);
CREATE INDEX idx_faq_requests_created_at ON public.faq_requests(created_at DESC);
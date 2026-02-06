-- Create admin_actions audit log table
CREATE TABLE public.admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_actions
CREATE POLICY "Only admins can view admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert admin_actions (via their own actions)
CREATE POLICY "Only admins can log actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    AND actor_id = auth.uid()
);

-- Create index for faster queries
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_actor_id ON public.admin_actions(actor_id);
CREATE INDEX idx_admin_actions_target_id ON public.admin_actions(target_id);
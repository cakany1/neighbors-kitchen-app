-- Table to track profile reminder emails sent to users
CREATE TABLE public.profile_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_count INTEGER NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profile_reminders ENABLE ROW LEVEL SECURITY;

-- Only system/service role can access this table (used by edge function)
CREATE POLICY "Service role only" ON public.profile_reminders
  FOR ALL USING (false);

-- Index for efficient querying
CREATE INDEX idx_profile_reminders_user_id ON public.profile_reminders(user_id);
CREATE INDEX idx_profile_reminders_last_sent ON public.profile_reminders(last_sent_at);
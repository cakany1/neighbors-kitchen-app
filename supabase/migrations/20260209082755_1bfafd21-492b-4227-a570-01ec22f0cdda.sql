-- Create table for native device push tokens (FCM/APNs)
CREATE TABLE public.device_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can view their own push tokens"
ON public.device_push_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
ON public.device_push_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.device_push_tokens
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.device_push_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all tokens (for debugging)
CREATE POLICY "Admins can view all push tokens"
ON public.device_push_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for efficient lookups
CREATE INDEX idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);
CREATE INDEX idx_device_push_tokens_environment ON public.device_push_tokens(environment);
CREATE INDEX idx_device_push_tokens_platform ON public.device_push_tokens(platform);
CREATE INDEX idx_device_push_tokens_active ON public.device_push_tokens(is_active) WHERE is_active = true;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_device_push_token_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_device_push_tokens_updated_at
BEFORE UPDATE ON public.device_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_device_push_token_timestamp();

-- Create table for push notification logs (for debugging and health checks)
CREATE TABLE public.push_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  token_id UUID REFERENCES public.device_push_tokens(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on logs
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view push logs
CREATE POLICY "Admins can view push notification logs"
ON public.push_notification_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Index for recent logs
CREATE INDEX idx_push_notification_logs_created_at ON public.push_notification_logs(created_at DESC);
CREATE INDEX idx_push_notification_logs_type ON public.push_notification_logs(notification_type);
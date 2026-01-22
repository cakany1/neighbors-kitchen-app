-- Fix security definer view by setting to SECURITY INVOKER
ALTER VIEW public.profiles_public SET (security_invoker = on);
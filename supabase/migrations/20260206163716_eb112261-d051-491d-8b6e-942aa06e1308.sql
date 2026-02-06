-- Add notification preference for same-address-only notifications
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_same_address_only boolean DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.notify_same_address_only IS 'When true, user only receives notifications for meals from their same address_id (building/block)';
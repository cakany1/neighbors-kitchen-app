-- Create household_links table for partner/household linking
CREATE TABLE public.household_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_confirmed BOOLEAN NOT NULL DEFAULT false,
    invitee_confirmed BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(requester_id, invitee_email)
);

-- Enable RLS
ALTER TABLE public.household_links ENABLE ROW LEVEL SECURITY;

-- Users can view links they're involved in (as requester or invitee)
CREATE POLICY "Users can view their own household links"
ON public.household_links FOR SELECT
TO authenticated
USING (
    auth.uid() = requester_id 
    OR auth.uid() = invitee_id
    OR auth.email() = invitee_email
);

-- Users can create links (invitations)
CREATE POLICY "Users can create household link invitations"
ON public.household_links FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Users can update links they're involved in (for confirmations)
CREATE POLICY "Users can update their own household links"
ON public.household_links FOR UPDATE
TO authenticated
USING (
    auth.uid() = requester_id 
    OR auth.uid() = invitee_id
    OR auth.email() = invitee_email
);

-- Users can delete/cancel links they created
CREATE POLICY "Users can delete their own household links"
ON public.household_links FOR DELETE
TO authenticated
USING (auth.uid() = requester_id);

-- Create index for faster lookups
CREATE INDEX idx_household_links_requester ON public.household_links(requester_id);
CREATE INDEX idx_household_links_invitee ON public.household_links(invitee_id);
CREATE INDEX idx_household_links_invitee_email ON public.household_links(invitee_email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_household_link_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- Auto-set confirmed_at when both parties confirm
    IF NEW.requester_confirmed = true AND NEW.invitee_confirmed = true AND OLD.status != 'active' THEN
        NEW.status = 'active';
        NEW.confirmed_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_household_links_updated_at
BEFORE UPDATE ON public.household_links
FOR EACH ROW
EXECUTE FUNCTION public.update_household_link_updated_at();
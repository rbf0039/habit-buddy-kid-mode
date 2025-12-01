-- Add icon and child_id columns to rewards table
ALTER TABLE public.rewards 
ADD COLUMN icon text NOT NULL DEFAULT '🎁',
ADD COLUMN child_id uuid REFERENCES public.children(id) ON DELETE CASCADE;

-- Create index for child_id lookups
CREATE INDEX idx_rewards_child_id ON public.rewards(child_id);
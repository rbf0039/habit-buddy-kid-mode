-- Add frequency configuration columns to habits table
ALTER TABLE public.habits 
ADD COLUMN times_per_period integer NOT NULL DEFAULT 1,
ADD COLUMN cooldown_minutes integer NOT NULL DEFAULT 0,
ADD COLUMN allowed_days text[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.habits.frequency IS 'daily, weekly, or custom';
COMMENT ON COLUMN public.habits.times_per_period IS 'Number of times habit can be completed per period';
COMMENT ON COLUMN public.habits.cooldown_minutes IS 'Minutes to wait between completions (for multi-completion habits)';
COMMENT ON COLUMN public.habits.allowed_days IS 'Array of allowed days for custom frequency (mon, tue, wed, thu, fri, sat, sun)';
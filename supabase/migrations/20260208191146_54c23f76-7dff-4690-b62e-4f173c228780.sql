-- Add timezone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/New_York';
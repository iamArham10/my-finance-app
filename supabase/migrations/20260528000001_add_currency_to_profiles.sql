-- Add currency preference to user profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PKR';

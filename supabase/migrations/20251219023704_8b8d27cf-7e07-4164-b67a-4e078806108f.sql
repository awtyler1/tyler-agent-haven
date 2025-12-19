-- Add is_test column to profiles table for test agent support
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
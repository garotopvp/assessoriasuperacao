-- Migration to add sisrun_bot_status and sisrun_bot_error to profiles

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sisrun_bot_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sisrun_bot_error text;

COMMENT ON COLUMN public.profiles.sisrun_bot_status IS 'Status of the SisRUN bot creation (pending, success, error)';
COMMENT ON COLUMN public.profiles.sisrun_bot_error IS 'Error message from the SisRUN bot if creation failed';

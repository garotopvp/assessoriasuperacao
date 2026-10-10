-- Add improvement_suggestions column to weekly_feedbacks table
ALTER TABLE public.weekly_feedbacks
ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT;

COMMENT ON COLUMN public.weekly_feedbacks.improvement_suggestions IS 'Suggestions for improvement from the user';

-- Add new columns for enhanced feedback details
ALTER TABLE public.weekly_feedbacks 
ADD COLUMN IF NOT EXISTS pain_area TEXT[], -- Array of body areas
ADD COLUMN IF NOT EXISTS pain_intensity INTEGER CHECK (pain_intensity BETWEEN 0 AND 10),
ADD COLUMN IF NOT EXISTS missed_workout_reason TEXT; -- Reason for low adherence

-- Update validation comments
COMMENT ON COLUMN public.weekly_feedbacks.pain_area IS 'Array of body areas where pain was felt';
COMMENT ON COLUMN public.weekly_feedbacks.pain_intensity IS 'Pain intensity scale 0-10';
COMMENT ON COLUMN public.weekly_feedbacks.missed_workout_reason IS 'Reason for missing workouts if adherence is low';

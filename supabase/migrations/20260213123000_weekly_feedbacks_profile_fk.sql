-- Add FK to profiles for easy joining
ALTER TABLE public.weekly_feedbacks
ADD CONSTRAINT fk_weekly_feedbacks_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

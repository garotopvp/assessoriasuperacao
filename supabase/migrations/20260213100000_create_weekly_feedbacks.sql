-- Drop previous table if exists (since we are changing the strategy)
DROP TABLE IF EXISTS public.workout_logs;

-- Create weekly_feedbacks table
CREATE TABLE IF NOT EXISTS public.weekly_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Week Reference (optional, but good for tracking)
    week_start_date DATE DEFAULT CURRENT_DATE,

    -- Quantitative Questions
    intensity_level INTEGER CHECK (intensity_level BETWEEN 1 AND 5), -- 1: Muito Leve, 5: Muito Forte
    adherence_level INTEGER CHECK (adherence_level BETWEEN 1 AND 4), -- 1: Nenhum, 4: Todos
    feeling_level INTEGER CHECK (feeling_level BETWEEN 1 AND 5), -- 1: Muito Cansado, 5: Excelente

    -- Qualitative Questions
    pain_discomfort BOOLEAN DEFAULT FALSE,
    pain_details TEXT,
    comments TEXT
);

-- RLS Policies
ALTER TABLE public.weekly_feedbacks ENABLE ROW LEVEL SECURITY;

-- User can manage their own feedbacks
CREATE POLICY "Users can view their own feedbacks" 
ON public.weekly_feedbacks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedbacks" 
ON public.weekly_feedbacks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedbacks" 
ON public.weekly_feedbacks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedbacks" 
ON public.weekly_feedbacks FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all weekly feedbacks" 
ON public.weekly_feedbacks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Realtime
alter publication supabase_realtime add table public.weekly_feedbacks;

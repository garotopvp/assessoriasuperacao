-- Create workout_logs table
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    workout_type TEXT NOT NULL, -- 'Leve', 'Moderado', 'Forte', 'Longo', 'Tiro', 'Prova'
    distance_km NUMERIC(5, 2), -- Allow for distances like 42.195
    duration_minutes INTEGER, -- Total minutes
    pace TEXT, -- String explicitly for user input like '5:30', or calculate from distance/time
    rpe INTEGER CHECK (rpe >= 0 AND rpe <= 10), -- 0-10 Scale
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can insert own logs" ON public.workout_logs;
CREATE POLICY "Users can insert own logs" ON public.workout_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own logs" ON public.workout_logs;
CREATE POLICY "Users can view own logs" ON public.workout_logs 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own logs" ON public.workout_logs;
CREATE POLICY "Users can update own logs" ON public.workout_logs 
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own logs" ON public.workout_logs;
CREATE POLICY "Users can delete own logs" ON public.workout_logs 
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all logs" ON public.workout_logs;
CREATE POLICY "Admins can view all logs" ON public.workout_logs 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add real-time support
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;

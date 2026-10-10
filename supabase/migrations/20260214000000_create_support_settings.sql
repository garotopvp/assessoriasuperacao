-- Create support_settings table for Chatbot Configuration
CREATE TABLE IF NOT EXISTS public.support_settings (
    key text PRIMARY KEY,
    value jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can read support_settings" ON public.support_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can update support_settings" ON public.support_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can insert support_settings" ON public.support_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Service Role (functions)
CREATE POLICY "Service role full access on support_settings" ON public.support_settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

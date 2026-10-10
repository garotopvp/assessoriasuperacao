-- Create a debug_logs table for troubleshooting webhook issues
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB
);

-- Allow public insert/select for debugging purposes (temporary)
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for debug_logs" ON public.debug_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Grant access to anon and authenticated
GRANT ALL ON public.debug_logs TO anon, authenticated, service_role;

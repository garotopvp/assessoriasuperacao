-- Create support_sessions table for WhatsApp Chatbot Hub
CREATE TABLE IF NOT EXISTS public.support_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_phone VARCHAR(20) NOT NULL,
    admin_phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING_MENU', -- WAITING_MENU, ACTIVE, CLOSED
    sector VARCHAR(50), -- FINANCEIRO, TREINOS, LOJA
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_support_sessions_student_phone ON public.support_sessions(student_phone) WHERE status != 'CLOSED';
CREATE INDEX IF NOT EXISTS idx_support_sessions_admin_phone ON public.support_sessions(admin_phone) WHERE status = 'ACTIVE';

-- RLS
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on support_sessions" ON public.support_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Admin can view (if they have admin role)
CREATE POLICY "Admins can view support_sessions" ON public.support_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

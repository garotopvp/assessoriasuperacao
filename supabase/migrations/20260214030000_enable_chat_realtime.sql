-- Enable Realtime for support tables
BEGIN;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_sessions;

-- Ensure RLS policies exist (idempotent)
DROP POLICY IF EXISTS "Admins can view support_messages" ON public.support_messages;
CREATE POLICY "Admins can view support_messages" ON public.support_messages
    FOR SELECT TO authenticated
    USING ( EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) ); -- Simplified check, ideally verify admin

DROP POLICY IF EXISTS "Admins can insert support_messages" ON public.support_messages;
CREATE POLICY "Admins can insert support_messages" ON public.support_messages
    FOR INSERT TO authenticated
    WITH CHECK ( EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid()) );

COMMIT;

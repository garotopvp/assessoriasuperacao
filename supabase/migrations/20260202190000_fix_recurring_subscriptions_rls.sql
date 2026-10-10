-- Ensure user_roles is readable by everyone (needed for the subquery in policies)
DROP POLICY IF EXISTS "Public read access" ON public.user_roles;
CREATE POLICY "Public read access" ON public.user_roles FOR SELECT USING (true);

-- Grant admin role to the main admin email if not already present
-- This ensures the admin user can actually pass the RLS check
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'boracorrerclub@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Fix recurring_subscriptions policies
ALTER TABLE public.recurring_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Service role can select subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.recurring_subscriptions;
DROP POLICY IF EXISTS "Service role full access" ON public.recurring_subscriptions;

-- Policy for users to view their own
CREATE POLICY "Users can view their own subscriptions"
ON public.recurring_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view ALL
CREATE POLICY "Admins can view all subscriptions"
ON public.recurring_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy for admins to insert/update (just in case they use the dashboard for edits)
CREATE POLICY "Admins can insert subscriptions"
ON public.recurring_subscriptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update subscriptions"
ON public.recurring_subscriptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Explicitly allow service role (though usually automatic, good for explicit access)
CREATE POLICY "Service role full access"
ON public.recurring_subscriptions FOR ALL
USING (auth.role() = 'service_role');

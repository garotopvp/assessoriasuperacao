-- =====================================================
-- CORREÇÃO FINAL: Garantir que webhook possa UPDATE
-- Data: 08/02/2026
-- Problema: RLS bloqueando UPDATE mesmo com service_role
-- =====================================================

-- 1. Garantir que RLS está habilitado
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. DROPAR TODAS as políticas existentes (inclusive manuais)
DROP POLICY IF EXISTS "orders_authenticated_all" ON public.orders;
DROP POLICY IF EXISTS "orders_automated_update_all" ON public.orders;
DROP POLICY IF EXISTS "orders_service" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all_operations" ON public.orders;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_user_id" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_email" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_v2" ON public.orders;

-- 3. Criar política COMPLETA para service_role (webhook precisa disso)
-- Esta policy permite TODAS as operações (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "orders_service_role_all"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Permitir SELECT para usuários autenticados (visualizar seus pedidos)
CREATE POLICY "orders_select_authenticated"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = customer_email
);

-- 5. Permitir INSERT para usuários autenticados (criar pedidos)
CREATE POLICY "orders_insert_authenticated"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR 
  user_id IS NULL
);

-- 6. Verificar políticas criadas
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Políticas RLS aplicadas com sucesso!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'service_role: Pode fazer TUDO (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE 'authenticated: Pode SELECT e INSERT seus próprios pedidos';
  RAISE NOTICE '==============================================';
END $$;

-- 7. Teste rápido: confirmar que as policies foram criadas
SELECT 
  policyname as "Policy",
  cmd as "Operation",
  roles as "Role"
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'orders'
ORDER BY policyname;

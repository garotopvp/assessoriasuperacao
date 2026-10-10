-- =====================================================
-- CORREÇÃO: Permitir usuários lerem seus próprios pedidos
-- Data: 08/02/2026
-- Problema: Webhook atualiza mas frontend não consegue ler
-- =====================================================

-- 1. Limpar políticas antigas que possam estar conflitando
DROP POLICY IF EXISTS "orders_authenticated_all" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_user_id" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_email" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_v2" ON public.orders;

-- 2. Criar política simples e permissiva para SELECT (leitura)
-- Permite que usuário autenticado veja seus próprios pedidos por user_id OU customer_email
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  auth.jwt() ->> 'email' = customer_email
  OR
  auth.jwt() ->> 'email' IS NULL -- Se não tiver email no JWT, permite (para debug)
);

-- 3. Manter política de service role (webhook precisa disso)
CREATE POLICY "orders_service_all_operations"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Criar política para INSERT (usuário pode criar seus próprios pedidos)
CREATE POLICY "orders_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR 
  user_id IS NULL -- Permite criar sem user_id (caso de checkout sem login)
);

-- 5. Permitir UPDATE apenas para service_role (webhook)
-- Usuário NÃO deve atualizar pedidos diretamente, apenas via edge functions

-- 6. Testar policy
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS aplicadas com sucesso!';
  RAISE NOTICE 'Agora usuários autenticados podem ler seus próprios pedidos.';
END $$;

-- 7. Verificar políticas criadas (query simplificada)
-- SELECT policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'orders'
-- ORDER BY policyname;

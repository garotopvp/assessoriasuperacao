-- DIAGNÓSTICO E CORREÇÃO COMPLETA DAS POLÍTICAS RLS
-- Execute no SQL Editor: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql

-- ========================================
-- PARTE 1: DIAGNÓSTICO
-- ========================================

-- Verificar se você é admin
SELECT 
    'Admin Check' as verificacao,
    u.id as user_id,
    u.email,
    ur.role,
    CASE 
        WHEN ur.role = 'admin' THEN '✅ É ADMIN'
        ELSE '❌ NÃO É ADMIN - PRECISA CORRIGIR'
    END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'boracorrerclub@gmail.com';

-- Verificar políticas ativas na tabela orders
SELECT 
    'Políticas RLS' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as usando_clausula,
    with_check as com_check_clausula
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'orders';

-- Verificar se conseguimos ver pedidos
SELECT 
    'Teste de Visibilidade' as verificacao,
    COUNT(*) as total_pedidos_no_banco
FROM public.orders;

-- ========================================
-- PARTE 2: CORREÇÃO
-- ========================================

-- 1. GARANTIR QUE VOCÊ É ADMIN
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'boracorrerclub@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. REMOVER POLÍTICAS ANTIGAS QUE PODEM ESTAR CAUSANDO CONFLITO
DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_select_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_user_id" ON public.orders;
DROP POLICY IF EXISTS "orders_user_select_by_email" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all" ON public.orders;
DROP POLICY IF EXISTS "orders_service_all_v2" ON public.orders;

-- 3. CRIAR POLÍTICAS NOVAS - MAIS PERMISSIVAS PARA ADMIN
-- Admin pode ver TODOS os pedidos
CREATE POLICY "orders_admin_all"
ON public.orders
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Usuários podem ver apenas seus próprios pedidos
CREATE POLICY "orders_user_own"
ON public.orders
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR customer_email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
    )
);

-- Service role tem acesso total
CREATE POLICY "orders_service_role"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- PARTE 3: MESMO PARA ORDER_ITEMS
-- ========================================

-- Limpar políticas antigas de order_items
DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_user_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_service_all" ON public.order_items;

-- Admin pode ver todos os itens
CREATE POLICY "order_items_admin_all"
ON public.order_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Usuários veem itens de seus pedidos
CREATE POLICY "order_items_user_own"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (
            orders.user_id = auth.uid() 
            OR orders.customer_email IN (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    )
);

-- Service role
CREATE POLICY "order_items_service_role"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ========================================
-- PARTE 4: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar as novas políticas
SELECT 
    'Políticas Atualizadas' as verificacao,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- Testar visualização de pedidos
SELECT 
    'Pedidos Visíveis Agora' as verificacao,
    id::text,
    created_at,
    customer_email,
    total,
    status
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

-- Mensagem final
SELECT '✅ CORREÇÃO CONCLUÍDA! Atualize a página /admin?tab=pedidos (Ctrl+F5)' as resultado;

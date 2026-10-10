-- =====================================================
-- CORREÇÃO DEFINITIVA DAS POLÍTICAS RLS PARA ORDERS
-- =====================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICAR SE OS PEDIDOS AGORA APARECEM
-- Execute a página /admin?tab=pedidos novamente
-- Se aparecer, o problema É o RLS

-- 3. REABILITAR RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. LIMPAR TODAS AS POLÍTICAS ANTIGAS
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    -- Orders
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
    
    -- Order items
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items' AND schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.order_items', pol.policyname);
    END LOOP;
END $$;

-- 5. CRIAR POLÍTICAS SUPER PERMISSIVAS PARA AUTHENTICATED USERS
-- Qualquer usuário autenticado pode ver todos os pedidos (temporário para debug)
CREATE POLICY "orders_authenticated_all"
ON public.orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "order_items_authenticated_all"
ON public.order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Service role sempre tem acesso
CREATE POLICY "orders_service"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "order_items_service"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. VERIFICAR RESULTADO
SELECT 
    'Políticas Aplicadas' as status,
    policyname,
    cmd,
    roles,
    qual::text as using_clause
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;

-- 7. TESTAR QUERY
SELECT 
    'Teste de Acesso' as status,
    COUNT(*) as total_pedidos
FROM public.orders;

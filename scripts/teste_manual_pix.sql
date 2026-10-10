-- TESTE MANUAL: Verificar se pagamento PIX está sendo confirmado
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Limpar pedidos antigos de teste (CUIDADO: só em desenvolvimento!)
-- DELETE FROM orders WHERE customer_email LIKE '%@teste%';

-- 2. Ver pedidos recentes e seus status
SELECT 
    id,
    created_at,
    status,
    payment_method,
    payment_provider,
    total,
    customer_email,
    correlation_id,
    updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver logs do webhook OpenPix
SELECT 
    created_at,
    message,
    details
FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Simular atualização manual de um pedido (use o ID real do seu pedido)
-- CUIDADO: Substitua 'SEU_ORDER_ID_AQUI' pelo ID real
/*
UPDATE orders 
SET 
    status = 'paid',
    updated_at = NOW()
WHERE id = 'SEU_ORDER_ID_AQUI';
*/

-- 5. Verificar policies RLS da tabela orders
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'orders';

-- 6. Testar se você consegue ler seus próprios pedidos
-- (Execute logado no site, com seu token)
SELECT * FROM orders WHERE user_id = auth.uid() LIMIT 5;

-- 7. Ver o último pedido criado e todos os seus dados
SELECT * 
FROM orders 
ORDER BY created_at DESC 
LIMIT 1;

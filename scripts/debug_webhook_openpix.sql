-- DEBUG: Verificar se o webhook está funcionando

-- 1. Ver últimos pedidos criados e seus correlation_id
SELECT 
    id,
    created_at,
    status,
    correlation_id,
    openpix_correlation_id,
    payment_provider,
    customer_email
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver logs do webhook OpenPix (se está sendo chamado)
SELECT 
    created_at,
    message,
    details::text as details_text
FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 30;

-- 3. Verificar se existe algum pedido SEM correlation_id
SELECT COUNT(*) as pedidos_sem_correlation_id
FROM orders
WHERE correlation_id IS NULL;

-- 4. Ver o formato do correlation_id do último pedido
SELECT 
    correlation_id,
    LENGTH(correlation_id) as tamanho,
    SPLIT_PART(correlation_id, '_', 1) as tipo,
    SPLIT_PART(correlation_id, '_', 2) as parte2
FROM orders
WHERE correlation_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

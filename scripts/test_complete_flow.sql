-- ==========================================
-- TESTE COMPLETO DO FLUXO PIX
-- ==========================================

-- 1. Ver o último pedido criado
SELECT 
    id,
    correlation_id,
    status,
    payment_provider,
    total,
    created_at,
    updated_at
FROM orders
WHERE payment_provider = 'openpix'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Ver os logs do webhook dos últimos 10 minutos
SELECT 
    created_at,
    message,
    details
FROM debug_logs
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 3. Verificar se há pedidos "pending" há mais de 5 minutos
SELECT 
    id,
    correlation_id,
    status,
    created_at,
    NOW() - created_at as "tempo_pendente"
FROM orders
WHERE status = 'pending'
  AND payment_provider = 'openpix'
  AND created_at > NOW() - INTERVAL '30 minutes'
ORDER BY created_at DESC;

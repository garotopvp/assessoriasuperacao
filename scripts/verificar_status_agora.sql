-- 🔍 VERIFICAÇÃO RÁPIDA - Execute no Supabase SQL Editor

-- 1. Ver se webhook foi chamado nos últimos 10 minutos
SELECT 
    created_at,
    message,
    details
FROM debug_logs 
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 2. Ver últimos pedidos criados
SELECT 
    id,
    correlation_id,
    status,
    payment_method,
    created_at,
    updated_at,
    NOW() - created_at as tempo_esperando
FROM orders 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- 3. Verificar se há pedidos pendentes
SELECT 
    id,
    correlation_id,
    status,
    customer_email,
    total,
    created_at
FROM orders 
WHERE status = 'pending'
  AND payment_method = 'pix'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

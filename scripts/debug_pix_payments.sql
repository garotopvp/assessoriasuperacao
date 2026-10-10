-- 🔍 Script para Debug de Pagamentos PIX
-- Execute no SQL Editor do Supabase

-- ========================================
-- 1. VER ÚLTIMOS PEDIDOS PIX
-- ========================================
SELECT 
    id,
    user_id,
    customer_email,
    status,
    payment_method,
    payment_provider,
    total,
    correlation_id,
    openpix_correlation_id,
    created_at,
    updated_at,
    (updated_at - created_at) as tempo_para_confirmar
FROM orders 
WHERE payment_method = 'pix'
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================
-- 2. VERIFICAR PEDIDOS PENDENTES
-- ========================================
SELECT 
    id,
    customer_email,
    status,
    total,
    correlation_id,
    created_at,
    NOW() - created_at as tempo_esperando
FROM orders 
WHERE status = 'pending' 
  AND payment_method = 'pix'
ORDER BY created_at DESC;

-- ========================================
-- 3. VER LOGS DO WEBHOOK
-- ========================================
SELECT 
    created_at,
    source,
    message,
    details
FROM debug_logs 
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC 
LIMIT 20;

-- ========================================
-- 4. BUSCAR PEDIDO ESPECÍFICO POR CORRELATION_ID
-- ========================================
-- Substitua 'order_USER_ID_TIMESTAMP' pelo seu correlationID
SELECT * FROM orders 
WHERE correlation_id = 'order_USER_ID_TIMESTAMP';

-- ========================================
-- 5. CONFIRMAR PEDIDO MANUALMENTE (EMERGÊNCIA)
-- ========================================
-- ⚠️ USE APENAS SE CONFIRMOU QUE O PAGAMENTO FOI REALIZADO!
-- Substitua 'ORDER_ID_AQUI' pelo ID do pedido

-- UPDATE orders 
-- SET 
--     status = 'paid',
--     updated_at = NOW()
-- WHERE id = 'ORDER_ID_AQUI';

-- Verificar após update:
-- SELECT id, status, updated_at FROM orders WHERE id = 'ORDER_ID_AQUI';

-- ========================================
-- 6. VERIFICAR PEDIDOS COM PROBLEMA DE CORRELATION_ID
-- ========================================
-- Pedidos onde correlation_id não bate com openpix_correlation_id
SELECT 
    id,
    correlation_id,
    openpix_correlation_id,
    status
FROM orders 
WHERE payment_method = 'pix'
  AND correlation_id IS NOT NULL
  AND openpix_correlation_id IS NOT NULL
  AND correlation_id != openpix_correlation_id;

-- ========================================
-- 7. ESTATÍSTICAS DE PAGAMENTOS PIX
-- ========================================
SELECT 
    status,
    COUNT(*) as total,
    SUM(total) as valor_total,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as tempo_medio_segundos
FROM orders 
WHERE payment_method = 'pix'
GROUP BY status;

-- ========================================
-- 8. PEDIDOS PIX HOJE
-- ========================================
SELECT 
    id,
    customer_email,
    status,
    total,
    created_at,
    updated_at
FROM orders 
WHERE payment_method = 'pix'
  AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;

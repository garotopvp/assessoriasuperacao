-- 🔍 CONSULTA EM TEMPO REAL - Logs do Webhook OpenPix
-- Execute no SQL Editor do Supabase enquanto testa um pagamento

-- ========================================
-- 📊 VER ÚLTIMOS LOGS DO WEBHOOK (TEMPO REAL)
-- ========================================
-- Atualize esta query várias vezes enquanto faz um teste de pagamento
SELECT 
    created_at,
    message,
    details
FROM debug_logs 
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC 
LIMIT 30;

-- ========================================
-- ✅ VERIFICAR SE WEBHOOK RECEBEU O PAGAMENTO
-- ========================================
-- Procure por estas mensagens específicas:
SELECT 
    created_at,
    message,
    details
FROM debug_logs 
WHERE source = 'openpix-webhook'
  AND message IN (
    'PAYLOAD COMPLETO RECEBIDO',
    'Processando PEDIDO DE LOJA',
    '✅ PEDIDO ENCONTRADO!',
    '✅ PEDIDO ATUALIZADO COM SUCESSO!',
    'Pedido processado com sucesso!'
  )
ORDER BY created_at DESC;

-- ========================================
-- 🔴 VERIFICAR ERROS
-- ========================================
SELECT 
    created_at,
    message,
    details
FROM debug_logs 
WHERE source = 'openpix-webhook'
  AND (message LIKE '%❌%' OR message LIKE '%ERRO%' OR message LIKE '%erro%')
ORDER BY created_at DESC;

-- ========================================
-- 🎯 ACOMPANHAR UM PEDIDO ESPECÍFICO
-- ========================================
-- Substitua 'SEU_CORRELATION_ID' pelo correlation_id do teste
-- Ex: order_userid_1234567890
SELECT 
    dl.created_at,
    dl.message,
    dl.details,
    o.status as order_status,
    o.updated_at as order_updated
FROM debug_logs dl
LEFT JOIN orders o ON o.correlation_id LIKE '%' || 
    (SELECT SUBSTRING(dl.details::text FROM 'correlationID":"([^"]+)')) || '%'
WHERE dl.source = 'openpix-webhook'
  AND dl.details::text LIKE '%SEU_CORRELATION_ID%'
ORDER BY dl.created_at DESC;

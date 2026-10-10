-- TESTE MANUAL: Simular o que o webhook deveria fazer

-- 1. Ver o último pedido criado
SELECT 
    id,
    status,
    correlation_id,
    created_at,
    updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- 2. Copie o ID e o correlation_id do pedido acima

-- 3. Tente atualizar o pedido (igual ao webhook faz)
-- SUBSTITUA os valores abaixo:
UPDATE orders
SET
    status = 'paid',
    stripe_session_id = 'openpix_order_XXXXX', -- cole correlation_id aqui
    total_amount = 99.90, -- ajuste o valor
    total = 99.90, -- ajuste o valor  
    updated_at = NOW()
WHERE id = 'COLE_O_ID_AQUI'
RETURNING id, status, updated_at;

-- 4. Verificar se atualizou
SELECT id, status, updated_at
FROM orders  
WHERE id = 'COLE_O_ID_AQUI';

-- 5. Testar se a query do webhook funciona
-- (substitua pelo correlation_id real do seu pedido)
SELECT id, status, items, customer_email
FROM orders
WHERE correlation_id = 'order_XXXXXXX'
LIMIT 1;

-- 6. Se a query acima não retornar nada, veja todos os correlation_id:
SELECT id, correlation_id, status
FROM orders
ORDER BY created_at DESC
LIMIT 10;

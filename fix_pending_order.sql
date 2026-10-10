-- Atualizar pedido específico de Pendente para Pago
-- ID do pedido: 3cdf1494 (09/02/2026 13:53)
-- Cliente: boracorrerclub@gmail.com

UPDATE orders 
SET 
  status = 'paid',
  updated_at = NOW()
WHERE 
  customer_email = 'boracorrerclub@gmail.com'
  AND DATE(created_at) = '2026-02-09'
  AND DATE_PART('hour', created_at) = 13
  AND DATE_PART('minute', created_at) = 53
  AND status = 'pending';

-- Verificar o resultado
SELECT id, customer_email, status, total, created_at, updated_at
FROM orders
WHERE customer_email = 'boracorrerclub@gmail.com'
ORDER BY created_at DESC
LIMIT 5;

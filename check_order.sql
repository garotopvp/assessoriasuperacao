-- Verificar se o pedido foi atualizado
SELECT 
  id,
  status,
  correlation_id,
  updated_at,
  created_at
FROM orders 
WHERE correlation_id = 'order_938d8d46-83e9-4472-a742-5077b0849552_1770512867347';
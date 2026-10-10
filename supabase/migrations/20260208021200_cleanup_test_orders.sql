-- Migration: Deletar pedidos de teste com valor incorreto
-- Deleta apenas pedidos com total <= R$ 1.00 (valores claramente de teste)

DELETE FROM orders 
WHERE total <= 1.00 
  AND payment_provider = 'openpix'
  AND created_at >= '2026-02-07';

-- Comentário
COMMENT ON TABLE orders IS 'Pedidos de teste com valores incorretos foram removidos em 08/02/2026';

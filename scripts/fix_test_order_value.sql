-- Atualizar o pedido de teste com o valor correto
UPDATE public.orders
SET total = 59.90, total_amount = 59.90
WHERE customer_email = 'boracorrerclub@gmail.com'
AND total = 59.90 -- Só atualizar se ainda estiver com o valor original
RETURNING id::text, customer_email, total, status;

-- Ver todos os pedidos
SELECT 
    id::text,
    created_at,
    customer_email,
    total,
    status,
    payment_method,
    items::text
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

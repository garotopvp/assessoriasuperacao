-- Verificar todos os pedidos (executar no SQL Editor do Supabase)
-- https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql

SELECT 
    id::text as pedido_id,
    created_at as criado_em,
    customer_email as cliente,
    total as valor_total,
    status,
    payment_provider as provedor,
    payment_method as metodo,
    (items->0->>'name') as primeiro_item,
    (items->0->>'quantity') as quantidade
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;

-- Verificar itens dos pedidos
SELECT 
    oi.id::text as item_id,
    oi.order_id::text as pedido_id,
    oi.product_name as produto,
    oi.product_size as tamanho,
    oi.quantity as quantidade,
    oi.price as preco,
    oi.created_at as criado_em
FROM public.order_items oi
ORDER BY oi.created_at DESC
LIMIT 10;

-- Estatísticas
SELECT 
    status,
    COUNT(*) as total,
    SUM(total) as valor_total
FROM public.orders
GROUP BY status
ORDER BY total DESC;


-- Execute este SQL no Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql

-- Criar pedido de teste
DO $$
DECLARE
    v_user_id uuid;
    v_order_id uuid;
BEGIN
    -- Buscar ID do usuário admin
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'boracorrerclub@gmail.com'
    LIMIT 1;

    -- Se não encontrar, criar um pedido sem user_id (guest)
    IF v_user_id IS NULL THEN
        v_user_id := NULL;
    END IF;

    -- Criar pedido
    INSERT INTO public.orders (
        user_id,
        customer_email,
        status,
        total,
        total_amount,
        items,
        payment_method,
        payment_provider,
        stripe_session_id
    ) VALUES (
        v_user_id,
        'boracorrerclub@gmail.com',
        'pending',
        59.90,
        59.90,
        '[{"id":3,"name":"Boné Essential Cap - Teste","price":59.90,"quantity":1,"size":"M"}]'::jsonb,
        'card',
        'stripe',
        'test_' || floor(random() * 1000000)::text
    ) RETURNING id INTO v_order_id;

    -- Criar item
    INSERT INTO public.order_items (order_id, product_name, product_size, price, quantity)
    VALUES (v_order_id, 'Boné Essential Cap - Teste', 'M', 59.90, 1);

    -- Mostrar resultado
    RAISE NOTICE '✅ Pedido criado: %', v_order_id;
END $$;

-- Verificar o pedido criado
SELECT 
    id::text as order_id,
    created_at,
    customer_email,
    total,
    status,
    payment_provider,
    (items->0->>'name') as first_item
FROM public.orders
ORDER BY created_at DESC
LIMIT 1;

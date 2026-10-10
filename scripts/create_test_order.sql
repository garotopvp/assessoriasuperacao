-- =====================================================
-- CRIAR PEDIDO DE TESTE
-- =====================================================
-- Este SQL cria um pedido de teste para validar o sistema

-- Primeiro, vamos buscar o user_id do admin
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

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário admin não encontrado. Usando UUID aleatório.';
        v_user_id := gen_random_uuid();
    ELSE
        RAISE NOTICE 'Usuário admin encontrado: %', v_user_id;
    END IF;

    -- Criar pedido de teste
    INSERT INTO public.orders (
        user_id,
        customer_email,
        customer_name,
        status,
        total,
        total_amount,
        items,
        payment_method,
        payment_provider,
        stripe_session_id,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'boracorrerclub@gmail.com',
        'Administrador Teste',
        'pending',
        59.90,
        59.90,
        '[
            {
                "id": 3,
                "name": "Boné Essential Cap - Teste",
                "price": 59.90,
                "quantity": 1,
                "size": "M"
            }
        ]'::jsonb,
        'card',
        'stripe',
        'test_session_' || extract(epoch from now())::text,
        now(),
        now()
    ) RETURNING id INTO v_order_id;

    RAISE NOTICE '✅ Pedido criado com sucesso!';
    RAISE NOTICE '🆔 ID: %', v_order_id;
    RAISE NOTICE '📧 Email: boracorrerclub@gmail.com';
    RAISE NOTICE '💰 Total: R$ 59.90';
    RAISE NOTICE '📦 Status: pending';

    -- Criar item do pedido
    INSERT INTO public.order_items (
        order_id,
        product_name,
        product_size,
        price,
        quantity
    ) VALUES (
        v_order_id,
        'Boné Essential Cap - Teste',
        'M',
        59.90,
        1
    );

    RAISE NOTICE '✅ Item adicionado ao pedido';

END $$;

-- Verificar pedidos criados
SELECT 
    id,
    created_at,
    customer_email,
    total,
    status,
    payment_provider
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;

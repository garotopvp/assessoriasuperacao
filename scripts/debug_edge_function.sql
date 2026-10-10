-- Verificar últimos logs das Edge Functions
-- Execute no Supabase Dashboard > Logs > Edge Functions

-- Procure por logs de create-openpix-order e veja:
-- 1. Se a função está sendo chamada
-- 2. Qual erro exato está acontecendo
-- 3. Se as env vars estão definidas

-- ALTERNATIVAMENTE, teste as credenciais:

-- 1. Verificar se OPENPIX_APP_ID está configurado
SELECT 'Verificar no Supabase Dashboard > Project Settings > Edge Functions';

-- 2. Verificar se SERVICE_ROLE_KEY está configurado
SELECT 'Verificar em Project Settings > API > service_role key';

-- 3. Teste manual de criação de pedido usando SERVICE_ROLE
-- Este insert DEVE funcionar se as políticas RLS estão corretas

INSERT INTO public.orders (
    user_id,
    customer_email,
    status,
    total,
    total_amount,
    items,
    payment_method,
    payment_provider,
    correlation_id
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'boracorrerclub@gmail.com' LIMIT 1),
    'teste@example.com',
    'pending',
    50.00,
    50.00,
    '[{"name":"Teste","quantity":1,"price":50}]'::jsonb,
    'pix',
    'openpix',
    'test_manual_' || floor(random() * 1000000)::text
) RETURNING id, customer_email, total, status;

-- Se este insert funcionar, o problema é na Edge Function
-- Se não funcionar, o problema ainda é RLS

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tdzdureusnszdzvsoomr.supabase.co";

// Para criar pedidos, precisamos das credenciais de service role
// Como não temos no .env (e não deveria ter), vamos fazer o SQL aparecer para execução manual

console.log("🧪 CRIANDO PEDIDO DE TESTE\n");
console.log("=".repeat(70));

const testOrderSQL = `
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
`;

console.log("\n📋 COPIE E EXECUTE O SQL ABAIXO:\n");
console.log(testOrderSQL);
console.log("\n" + "=".repeat(70));

console.log("\n🌐 PASSOS:");
console.log("1. Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql");
console.log("2. Cole o SQL acima no editor");
console.log("3. Clique em 'Run' ou pressione Ctrl+Enter");
console.log("4. Aguarde a confirmação ✅");
console.log("5. Execute: npx tsx scripts/check_orders.ts");
console.log("\n" + "=".repeat(70));

// Salvar SQL em arquivo para facilitar
import { writeFileSync } from "fs";
const sqlPath = path.join(process.cwd(), "scripts", "_temp_create_order.sql");
writeFileSync(sqlPath, testOrderSQL);
console.log(`\n💾 SQL salvo em: ${sqlPath}`);
console.log("   Você pode executar: Get-Content scripts/_temp_create_order.sql\n");

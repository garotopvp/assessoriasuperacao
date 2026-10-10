-- Migration: Corrigir RLS definitivamente para orders
-- Drop policies conflitantes e criar uma política clara

-- Dropar policies antigas de SELECT
DROP POLICY IF EXISTS "orders_select_authenticated" ON orders;
DROP POLICY IF EXISTS "admins_select_all_orders" ON orders;

-- Criar policy unificada: admins veem tudo, users veem só os seus
CREATE POLICY "orders_select_unified" ON orders
FOR SELECT
TO authenticated
USING (
  -- Admin pode ver TUDO (checando diretamente na tabela profiles)
  (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  -- OU é o próprio usuário do pedido
  OR (auth.uid() = user_id)
  -- OU é o email do cliente
  OR (auth.jwt() ->> 'email' = customer_email)
);

-- Comentário
COMMENT ON POLICY "orders_select_unified" ON orders IS 
'Admins veem todos os pedidos, usuários comuns veem apenas os próprios';

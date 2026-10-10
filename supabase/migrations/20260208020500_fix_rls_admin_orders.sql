-- Migration: Permitir que admins vejam TODOS os pedidos no painel admin
-- Created: 2026-02-08
-- Reason: Painel admin não mostra pedidos porque RLS bloqueia SELECT

-- Criar policy para admins verem todos os pedidos
CREATE POLICY "admins_select_all_orders" ON orders
FOR SELECT
TO authenticated
USING (
  -- Admin pode ver todos os pedidos
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
  -- OU é o próprio usuário
  OR auth.uid() = user_id
  -- OU é o email do pedido
  OR auth.jwt() ->> 'email' = customer_email
);

-- Comentário explicativo
COMMENT ON POLICY "admins_select_all_orders" ON orders IS 
'Permite que admins vejam todos os pedidos no painel, enquanto usuários comuns veem apenas os próprios';

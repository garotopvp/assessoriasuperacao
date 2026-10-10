-- 1. LIMPEZA TOTAL DE POLÍTICAS ANTIGAS NA TABELA ORDERS
DO $$ 
DECLARE 
  pol RECORD;
BEGIN
  FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
  END LOOP;
END $$;

-- 2. GARANTIR COLUNAS NECESSÁRIAS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. SINCRONIZAR TOTAIS
UPDATE public.orders SET total_amount = total WHERE total_amount IS NULL;

-- 4. CONFIGURAR RLS DE FORMA ROBUSTA
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins: Ver tudo (Baseado em user_roles)
CREATE POLICY "orders_admin_select_v2" ON public.orders
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Usuários: Ver próprios pedidos
CREATE POLICY "orders_user_select_v2" ON public.orders
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Sistema: Acesso total para funções e webhooks
CREATE POLICY "orders_service_all_v2" ON public.orders
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- 5. GARANTIR QUE O USUÁRIO PRINCIPAL SEJA ADMIN
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'boracorrerclub@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. PERMISSÕES DE TABELA
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

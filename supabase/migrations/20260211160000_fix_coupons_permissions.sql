-- Adicionar coluna is_admin se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Atualizar o usuário admin específico (fazendo join com auth.users para achar pelo email)
-- Isso resolve o problema de não ter o email na tabela profiles
UPDATE profiles
SET is_admin = true
FROM auth.users
WHERE profiles.user_id = auth.users.id
AND auth.users.email = 'boracorrerclub@gmail.com';

-- Garante tabela de cupons
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  max_discount_amount DECIMAL(10,2),
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  applicable_plans TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Limpar politicas antigas
DROP POLICY IF EXISTS "Admins can manage coupons" ON discount_coupons;
DROP POLICY IF EXISTS "Anyone can validate active coupons" ON discount_coupons;

-- Politica CORRIGIDA (usando user_id em vez de id e verificando email no JWT)
CREATE POLICY "Admins can manage coupons" ON discount_coupons
  FOR ALL USING (
    -- Opção 1: O usuário é admin no perfil (usando user_id em vez de id)
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR
    -- Opção 2: O email do token JWT é o email master (fallback seguro)
    (auth.jwt() ->> 'email') = 'boracorrerclub@gmail.com'
  );

CREATE POLICY "Anyone can validate active coupons" ON discount_coupons
  FOR SELECT USING (active = true);

-- Permissões
GRANT ALL ON discount_coupons TO authenticated;
GRANT SELECT ON discount_coupons TO anon;
GRANT ALL ON discount_coupons TO service_role;

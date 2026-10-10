-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY, -- Slug like 'mensal', 'anual'
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  monthly_price TEXT, -- Display formatted monthly price
  description TEXT,
  features TEXT[],
  highlight BOOLEAN DEFAULT false,
  cta TEXT,
  hidden BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" ON plans
  FOR SELECT USING (true);

CREATE POLICY "Admin full access" ON plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
    OR
    (auth.jwt() ->> 'email') = 'boracorrerclub@gmail.com'
  );

-- Function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_plans_timestamp
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed data (Upsert to avoid duplicates but update values)
INSERT INTO plans (id, name, price, monthly_price, description, features, highlight, cta, hidden, position)
VALUES 
  ('anual', 'ANUAL', 1319.64, '109,97', 'Compromisso total com sua performance.', ARRAY['Acesso ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte direto com Coach', 'Acesso à Comunidade', 'Camiseta Exclusiva do Clube'], true, 'ACESSAR O SISTEMA', false, 1),
  ('semestral', 'SEMESTRAL', 779.82, '129,97', 'Mais economia para sua evolução.', ARRAY['Acesso ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte direto com Coach', 'Acesso à Comunidade'], false, 'OTIMIZAR AGORA', false, 2),
  ('trimestral', 'TRIMESTRAL', 419.91, '139,97', 'Um bom começo para um compromisso firme.', ARRAY['Acesso ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte direto com Coach', 'Acesso à Comunidade'], false, 'INICIAR CONSULTORIA', false, 3),
  ('mensal', 'MENSAL', 149.97, '149,97', 'Flexibilidade para o seu dia a dia.', ARRAY['Acesso ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte direto com Coach', 'Acesso à Comunidade'], false, 'INICIAR CONSULTORIA', false, 4),
  ('plano_teste', 'PLANO TESTE', 9.97, '9,97', 'Experimente o clube por 1 mês sem compromisso.', ARRAY['Acesso ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte básico', 'Acesso à Comunidade'], false, 'EXPERIMENTAR AGORA', false, 5),
  ('parceria', 'Parceria', 0, '0,00', 'Plano exclusivo para parceiros e influencers.', ARRAY['Acesso total ao aplicativo SisRUNNER', 'Treinos Presenciais', 'Suporte VIP', 'Acesso à Comunidade'], false, 'CADASTRAR PARCEIRO', true, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  monthly_price = EXCLUDED.monthly_price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  highlight = EXCLUDED.highlight,
  cta = EXCLUDED.cta,
  hidden = EXCLUDED.hidden,
  position = EXCLUDED.position;

-- Grant permissions
GRANT ALL ON plans TO authenticated;
GRANT SELECT ON plans TO anon;
GRANT ALL ON plans TO service_role;

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Saúde', 'Equipamentos', 'Provas', 'Serviços'
  discount TEXT NOT NULL, -- '20% OFF', 'Frete Grátis'
  code TEXT, -- Cupom opcional
  url TEXT, -- Link para o site
  image_url TEXT, -- Logo
  active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read active partners" ON partners
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage partners" ON partners
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'boracorrerclub@gmail.com'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_partners_timestamp
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Seed data example (Optional)
INSERT INTO partners (name, category, discount, description, active)
VALUES 
('Loja Exemplo', 'Equipamentos', '15% OFF', 'Desconto em tênis e vestuário para membros.', true),
('FisioSports', 'Saúde', '1ª Sessão Grátis', 'Avaliação biomecânica gratuita.', true);

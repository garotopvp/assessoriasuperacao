-- Migration: Create discount_coupons table
-- Created: 2026-01-26

-- Create discount_coupons table
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  
  -- Tipo de desconto: 'percentage' ou 'fixed'
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  
  -- Valor do desconto (% ou R$)
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  
  -- Para desconto percentual, limite máximo em R$
  max_discount_amount DECIMAL(10,2),
  
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  
  -- Planos específicos (null = todos os planos)
  applicable_plans TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_coupons_code ON discount_coupons(code);
CREATE INDEX idx_coupons_active ON discount_coupons(active);
CREATE INDEX idx_coupons_type ON discount_coupons(discount_type);
CREATE INDEX idx_coupons_valid_until ON discount_coupons(valid_until);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_coupons_updated_at
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_coupons_updated_at();

-- RLS (Row Level Security)
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar cupons (criar, editar, deletar)
CREATE POLICY "Admins can manage coupons" ON discount_coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Qualquer um pode validar cupons ativos (necessário para checkout público)
CREATE POLICY "Anyone can validate active coupons" ON discount_coupons
  FOR SELECT USING (active = true);

-- Comentários na tabela
COMMENT ON TABLE discount_coupons IS 'Cupons de desconto criados pelo admin para links personalizados';
COMMENT ON COLUMN discount_coupons.discount_type IS 'Tipo de desconto: percentage (%) ou fixed (R$)';
COMMENT ON COLUMN discount_coupons.discount_value IS 'Valor do desconto (porcentagem ou valor fixo em reais)';
COMMENT ON COLUMN discount_coupons.max_discount_amount IS 'Limite máximo de desconto em R$ (apenas para tipo percentage)';
COMMENT ON COLUMN discount_coupons.applicable_plans IS 'Array de IDs de planos aplicáveis (null = todos os planos)';

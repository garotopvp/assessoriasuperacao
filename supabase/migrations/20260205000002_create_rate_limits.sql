-- Migration: Criar tabela de rate limiting
-- Data: 2026-02-05
-- Descrição: Sistema de controle de taxa de requisições

-- Criar tabela de rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL UNIQUE, -- action:userId ou action:ip
  count INTEGER NOT NULL DEFAULT 0,
  first_request TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX idx_rate_limits_first_request ON rate_limits(first_request);
CREATE INDEX idx_rate_limits_blocked_until ON rate_limits(blocked_until) WHERE blocked_until IS NOT NULL;

-- Comentários
COMMENT ON TABLE rate_limits IS 'Controle de taxa de requisições (rate limiting)';
COMMENT ON COLUMN rate_limits.identifier IS 'Identificador único: action:userId ou action:ip';
COMMENT ON COLUMN rate_limits.count IS 'Número de requisições na janela de tempo';
COMMENT ON COLUMN rate_limits.blocked_until IS 'Data/hora até quando o usuário está bloqueado';

-- Função para limpar rate limits expirados
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE first_request < NOW() - INTERVAL '24 hours';
  
  RAISE NOTICE 'Rate limits expirados deletados em %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Service role pode tudo
CREATE POLICY "Service role pode gerenciar rate limits"
  ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Conceder permissões
GRANT ALL ON rate_limits TO service_role;

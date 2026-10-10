-- Adicionar campos de status de assinatura na tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN profiles.subscription_status IS 'Status da assinatura: active, blocked, canceled';
COMMENT ON COLUMN profiles.blocked_at IS 'Data em que o acesso foi bloqueado por falta de pagamento';

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

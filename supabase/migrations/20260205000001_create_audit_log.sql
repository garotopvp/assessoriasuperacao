-- Migration: Criar tabela de auditoria
-- Data: 2026-02-05
-- Descrição: Cria sistema de auditoria para rastrear ações críticas

-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PURCHASE', 'SUBSCRIPTION', 'ADMIN_ACTION')),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para melhorar performance de queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_record_id ON audit_log(record_id);

-- Comentários para documentação
COMMENT ON TABLE audit_log IS 'Registro de auditoria de ações críticas do sistema';
COMMENT ON COLUMN audit_log.action IS 'Tipo de ação realizada: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PURCHASE, SUBSCRIPTION, ADMIN_ACTION';
COMMENT ON COLUMN audit_log.table_name IS 'Nome da tabela afetada pela ação';
COMMENT ON COLUMN audit_log.record_id IS 'ID do registro afetado (texto para flexibilidade)';
COMMENT ON COLUMN audit_log.old_data IS 'Estado anterior dos dados (JSON)';
COMMENT ON COLUMN audit_log.new_data IS 'Novo estado dos dados (JSON)';

-- RLS (Row Level Security)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ler logs
CREATE POLICY "Admin pode ler logs"
  ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Service role pode inserir logs
CREATE POLICY "Service role pode inserir logs"
  ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- Função para deletar logs antigos (manter 90 dias)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Log da limpeza
  RAISE NOTICE 'Logs antigos deletados em %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar limpeza diária às 2h da manhã (requer extensão pg_cron)
-- Comentado por padrão - habilitar manualmente se pg_cron estiver disponível
-- SELECT cron.schedule('delete-old-audit-logs', '0 2 * * *', 'SELECT delete_old_audit_logs()');

-- Função helper para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_data,
    p_new_data,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION delete_old_audit_logs TO postgres;

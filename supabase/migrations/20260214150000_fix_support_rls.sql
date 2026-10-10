
-- Liberar acesso total para usuarios autenticados nas tabelas de suporte
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- REMOVE politicas antigas para garantir
DROP POLICY IF EXISTS "Enable read access for all users" ON support_sessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON support_sessions;
DROP POLICY IF EXISTS "Enable update for all users" ON support_sessions;

DROP POLICY IF EXISTS "Enable read access for all users" ON support_messages;
DROP POLICY IF EXISTS "Enable insert for all users" ON support_messages;

-- CRIA novas politicas permissivas
-- Sessions
CREATE POLICY "Permitir leitura para autenticados" ON support_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir insert para autenticados" ON support_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir update para autenticados" ON support_sessions FOR UPDATE TO authenticated USING (true);

-- Messages
CREATE POLICY "Permitir leitura para autenticados" ON support_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir insert para autenticados" ON support_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir update para autenticados" ON support_messages FOR UPDATE TO authenticated USING (true);

-- Permissao publica para inserir via webhook (anon)
CREATE POLICY "Permitir anonimo inserir msg" ON support_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir anonimo ler sessao" ON support_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir anonimo inserir sessao" ON support_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir anonimo atualizar sessao" ON support_sessions FOR UPDATE TO anon USING (true);

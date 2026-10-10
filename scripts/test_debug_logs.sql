-- ✅ QUERY SIMPLES PARA COMEÇAR
-- Execute esta no SQL Editor do Supabase

-- Ver se a tabela existe e está vazia
SELECT COUNT(*) as total_logs FROM debug_logs;

-- Ver logs mais recentes (se houver)
SELECT 
    created_at,
    source,
    message,
    details
FROM debug_logs 
ORDER BY created_at DESC 
LIMIT 10;

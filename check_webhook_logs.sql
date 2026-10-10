-- Ver logs do webhook (últimos 5 minutos)
SELECT 
  created_at,
  message,
  details
FROM debug_logs 
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
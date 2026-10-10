-- ⚠️ IMPORTANTE: 
-- Substitua [SERVICE_ROLE_KEY] pela sua chave real antes de executar!
-- Você encontra ela em: Supabase Dashboard > Project Settings > API > service_role (secret)

-- 1. Habilitar extensão para agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Limpar jobs antigos se existirem
SELECT cron.unschedule('generate-monthly-invoices');
SELECT cron.unschedule('send-payment-reminders');

-- 3. Agendar: Gerar faturas mensais (Todo dia às 00:00)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/generate-monthly-invoices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  ) AS request_id;
  $$
);

-- 4. Agendar: Enviar lembretes e bloquear acesso (Todo dia às 10:00)
SELECT cron.schedule(
  'send-payment-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  ) AS request_id;
  $$
);

-- 5. Verificar agendamentos
SELECT * FROM cron.job;

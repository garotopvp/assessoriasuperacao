-- Função RPC para configurar Cron Jobs com a chave de serviço
create or replace function setup_cron_jobs(service_key text)
returns void
language plpgsql
security definer
as $$
begin
  -- Tentar agendar Jobs (assumindo que pg_cron já está habilitada)
  -- Se pg_cron não estiver habilitada, isso vai falhar, e o usuário precisará habilitar no Dashboard.

  -- Agendar jobs (cron.schedule atualiza se já existir com o mesmo nome)

  -- Agendar: Gerar faturas mensais (Todo dia às 00:00)
  perform cron.schedule(
    'generate-monthly-invoices',
    '0 0 * * *',
    format(
      'select net.http_post(
          url:=''https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/generate-monthly-invoices'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb
      ) as request_id;',
      service_key
    )
  );

  -- Agendar: Enviar lembretes e bloquear acesso (Todo dia às 10:00)
  perform cron.schedule(
    'send-payment-reminders',
    '0 10 * * *',
    format(
      'select net.http_post(
          url:=''https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-payment-reminders'',
          headers:=''{"Content-Type": "application/json", "Authorization": "Bearer %s"}''::jsonb
      ) as request_id;',
      service_key
    )
  );
end;
$$;

# Deploy das Edge Functions

## Pré-requisitos

1. Supabase CLI instalado
2. Autenticado no Supabase
3. API Key do Resend configurada

## Comandos de Deploy

```bash
# 1. Fazer login no Supabase (se ainda não fez)
npx supabase login

# 2. Linkar com seu projeto
npx supabase link --project-ref [SEU-PROJECT-REF]

# 3. Deploy das Edge Functions
npx supabase functions deploy create-subscription
npx supabase functions deploy generate-monthly-invoices
npx supabase functions deploy send-payment-reminders
npx supabase functions deploy abacate-webhook

# 4. Verificar deploy
npx supabase functions list
```

## Aplicar Migrations

```bash
# Aplicar migrations do banco de dados
npx supabase db push
```

## Configurar Cron Jobs

Execute no SQL Editor do Supabase:

```sql
-- Habilitar extensão pg_cron (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Gerar faturas mensais (todo dia às 00:00)
SELECT cron.schedule(
  'generate-monthly-invoices',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://[SEU-PROJECT-REF].supabase.co/functions/v1/generate-monthly-invoices',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE-ROLE-KEY]"}'::jsonb
  ) AS request_id;
  $$
);

-- Enviar lembretes (todo dia às 10:00)
SELECT cron.schedule(
  'send-payment-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://[SEU-PROJECT-REF].supabase.co/functions/v1/send-payment-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE-ROLE-KEY]"}'::jsonb
  ) AS request_id;
  $$
);

-- Verificar cron jobs criados
SELECT * FROM cron.job;
```

## Testar Manualmente

```bash
# Testar criação de assinatura
curl -X POST https://[SEU-PROJECT-REF].supabase.co/functions/v1/create-subscription \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON-KEY]" \
  -d '{
    "studentName": "Teste Silva",
    "studentEmail": "teste@email.com",
    "planId": "mensal",
    "planName": "Plano Mensal",
    "amount": 149.97
  }'

# Testar geração de faturas
curl -X POST https://[SEU-PROJECT-REF].supabase.co/functions/v1/generate-monthly-invoices \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]"

# Testar envio de lembretes
curl -X POST https://[SEU-PROJECT-REF].supabase.co/functions/v1/send-payment-reminders \
  -H "Authorization: Bearer [SERVICE-ROLE-KEY]"
```

## Troubleshooting

### Erro: "RESEND_API_KEY not found"

- Verifique se configurou a secret no Supabase Dashboard
- Faça redeploy da função após adicionar a secret

### Erro: "Function not found"

- Verifique se o deploy foi bem-sucedido
- Confira o nome da função no comando

### Cron Job não executa

- Verifique se pg_cron está habilitado
- Confira os logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

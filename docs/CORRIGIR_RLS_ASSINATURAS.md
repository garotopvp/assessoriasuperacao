# Aplicar Correção de RLS para Assinaturas

## Problema

As assinaturas não estão sendo criadas porque a política RLS (Row Level Security) da tabela `recurring_subscriptions` está bloqueando inserções via Edge Function.

## Solução

Execute o seguinte SQL no **SQL Editor do Supabase**:

1. Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql/new

2. Cole e execute este SQL:

```sql
-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON recurring_subscriptions;
DROP POLICY IF EXISTS "Service role can select subscriptions" ON recurring_subscriptions;

-- Adicionar política para permitir inserção via service role
CREATE POLICY "Service role can insert subscriptions"
  ON recurring_subscriptions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Adicionar política para permitir leitura via service role
CREATE POLICY "Service role can select subscriptions"
  ON recurring_subscriptions FOR SELECT
  TO service_role
  USING (true);
```

3. Clique em "Run" para executar

## Resultado

Após executar, as Edge Functions poderão criar assinaturas na tabela `recurring_subscriptions`.

## Teste

Após aplicar, tente criar uma nova conta pelo link de cadastro e verifique se a assinatura aparece na aba "Assinaturas" do Admin.

# ✅ CHECKLIST: Resolver problema de pagamento PIX não confirmando

## 🎯 OBJETIVO

Garantir que pagamentos PIX sejam confirmados automaticamente após o usuário pagar no banco.

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### FASE 1: Configuração no Dashboard OpenPix

#### ☑️ 1.1 - Acessar Dashboard

- [ ] Acesse [https://app.openpix.com.br/](https://app.openpix.com.br/)
- [ ] Faça login com suas credenciais
- [ ] Confirme que está na conta correta (produção, não sandbox)

#### ☑️ 1.2 - Verificar API Key

- [ ] Vá em **API/Integrações** → **API Keys**
- [ ] Confirme que sua `App ID` está correta
- [ ] Deve ser a mesma do `.env`: `Q2xpZW50X0lkXzdiM2Q2ZDc1LTIxZTktNDU3MC1hMTBhLTA5NmY5OGM3OTcwOTpDbGllbnRfU2VjcmV0X2dlbmZScW42QlhxM2F2aDlMNGhKbk9wWUs4bVJubkF0M2tRZXU1OWcxMGc9`

#### ☑️ 1.3 - Configurar Webhook

- [ ] Vá em **API/Integrações** → **Webhooks**
- [ ] Clique em **"+ Novo Webhook"** (ou edite existente)
- [ ] Preencha os campos:

| Campo         | Valor Exato                                                             |
| ------------- | ----------------------------------------------------------------------- |
| Nome          | `Webhook BoraCorrer - Produção`                                         |
| URL           | `https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook` |
| Evento        | `OPENPIX:CHARGE_COMPLETED` ✅                                           |
| Authorization | _(em branco)_                                                           |
| Ativo         | ✅ SIM                                                                  |

- [ ] Clique em **"Salvar"**
- [ ] Aguarde mensagem de sucesso

#### ☑️ 1.4 - Testar Webhook

- [ ] Clique no botão **"Testar Webhook"** ao lado do webhook criado
- [ ] Verifique se aparece: ✅ **Status 200 OK**
- [ ] Se aparecer erro, anote a mensagem e corrija

---

### FASE 2: Verificação no Supabase

#### ☑️ 2.1 - Verificar Tabelas

Execute no **SQL Editor** do Supabase:

```sql
-- Verificar se tabela debug_logs existe
SELECT COUNT(*) FROM debug_logs;

-- Verificar se tabela orders tem correlation_id
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders';
```

**Resultado esperado:**

- [ ] `debug_logs` não retorna erro
- [ ] `orders` tem coluna `correlation_id` (tipo text/varchar)

#### ☑️ 2.2 - Verificar Edge Function

```bash
# No terminal, na pasta do projeto:
cd supabase/functions/openpix-webhook
```

Verifique se o arquivo `index.ts` existe:

```bash
ls -la
```

**Resultado esperado:**

- [ ] Arquivo `index.ts` existe
- [ ] Tamanho > 0 bytes (não está vazio)

#### ☑️ 2.3 - Deploy da Edge Function

```bash
# Deploy com --no-verify-jwt para aceitar webhooks sem auth
supabase functions deploy openpix-webhook --no-verify-jwt
```

**Resultado esperado:**

- [ ] Deploy concluído sem erros
- [ ] Mensagem: `✅ Deployed Function openpix-webhook`

---

### FASE 3: Teste Completo do Fluxo

#### ☑️ 3.1 - Criar Pedido de Teste

1. [ ] Acesse o site: [http://localhost:5173](http://localhost:5173) (ou produção)
2. [ ] Faça login com um usuário teste
3. [ ] Adicione um produto ao carrinho
4. [ ] Vá para o checkout
5. [ ] Selecione **"Pagar com PIX"**
6. [ ] Aguarde QR Code aparecer

**Resultado esperado:**

- [ ] QR Code aparece na tela
- [ ] Console mostra: `✅ COBRANÇA PIX CRIADA`
- [ ] Console mostra: `🔄 POLLING INICIADO`

#### ☑️ 3.2 - Verificar Pedido no Banco

Abra outra aba e execute no SQL Editor:

```sql
-- Ver último pedido criado
SELECT
  id,
  user_id,
  status,
  correlation_id,
  payment_provider,
  created_at,
  updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**

- [ ] Pedido aparece na tabela
- [ ] `status` = `pending`
- [ ] `correlation_id` começa com `order_`
- [ ] `payment_provider` = `openpix`

#### ☑️ 3.3 - Simular Pagamento (Ambiente de Teste)

**Opção A: Pagar de verdade no PIX (se for conta real)**

- [ ] Copie o código PIX (Pix Copia e Cola)
- [ ] Abra app do banco
- [ ] Cole o código e confirme pagamento
- [ ] Aguarde 5-10 segundos

**Opção B: Simular webhook manualmente (teste)**

Execute no terminal:

```bash
curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "OPENPIX:CHARGE_COMPLETED",
    "charge": {
      "status": "COMPLETED",
      "correlationID": "COLE_AQUI_O_CORRELATION_ID_DO_PEDIDO",
      "transactionID": "txn_test_123"
    }
  }'
```

**Substitua** `COLE_AQUI_O_CORRELATION_ID_DO_PEDIDO` pelo valor da coluna `correlation_id` do pedido criado.

**Resultado esperado:**

- [ ] Comando retorna status 200
- [ ] Não retorna erro

#### ☑️ 3.4 - Verificar Se Webhook Foi Recebido

Execute no SQL Editor:

```sql
-- Ver logs do webhook
SELECT
  created_at,
  message,
  details
FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:**

- [ ] Aparecem logs novos (timestamp recente)
- [ ] Mensagens incluem:
  - `Webhook recebido (bruto)`
  - `Event recebido: OPENPIX:CHARGE_COMPLETED`
  - `Pedido encontrado e atualizado` ou similar

#### ☑️ 3.5 - Verificar Se Status Foi Atualizado

Execute no SQL Editor:

```sql
-- Ver se o pedido foi atualizado
SELECT
  id,
  status,
  correlation_id,
  updated_at
FROM orders
WHERE correlation_id = 'COLE_AQUI_O_CORRELATION_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**

- [ ] `status` mudou de `pending` para `paid` ✅
- [ ] `updated_at` é recente (segundos atrás)

#### ☑️ 3.6 - Verificar Frontend

Volte para a aba do navegador com a página de pagamento:

**Resultado esperado:**

- [ ] Console mostra: `✅ PAGAMENTO CONFIRMADO!`
- [ ] Página redireciona para `/shop-sucesso`
- [ ] Toast mostra: "✅ Pagamento confirmado!"
- [ ] Carrinho foi limpo

---

### FASE 4: Validação de Produção

#### ☑️ 4.1 - Testar em Produção

- [ ] Deploy do código no Vercel/hosting
- [ ] Crie pedido real em produção
- [ ] Faça pagamento PIX real
- [ ] Confirme que funciona em < 10 segundos

#### ☑️ 4.2 - Monitorar Logs em Produção

Configure alerta no Supabase:

```sql
-- Ver todos os webhooks das últimas 24h
SELECT
  DATE_TRUNC('hour', created_at) as hora,
  COUNT(*) as total_webhooks,
  COUNT(CASE WHEN message LIKE '%atualizado%' THEN 1 END) as sucesso,
  COUNT(CASE WHEN message LIKE '%erro%' THEN 1 END) as erros
FROM debug_logs
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hora DESC;
```

**Resultado esperado:**

- [ ] Número de `sucesso` > 0
- [ ] Número de `erros` = 0 (ou muito baixo)

---

## 🚨 TROUBLESHOOTING

### ❌ Webhook não aparece nos logs

**Causa:** Webhook não está configurado ou URL errada

**Solução:**

1. Volte para **FASE 1.3** e confira URL letra por letra
2. Certifique-se que está em `https://` (não `http://`)
3. Não deve ter `/` no final da URL
4. Clique em "Testar Webhook" no dashboard OpenPix

---

### ❌ Erro 401/403 ao testar webhook

**Causa:** Edge Function exige autenticação

**Solução:**

```bash
# Re-deploy sem verificação JWT
supabase functions deploy openpix-webhook --no-verify-jwt
```

---

### ❌ Logs mostram "Pedido não encontrado"

**Causa:** `correlation_id` não está batendo

**Solução:**

1. Verifique formato do correlation_id no banco:

```sql
SELECT correlation_id FROM orders ORDER BY created_at DESC LIMIT 5;
```

2. Compare com o correlation_id que o webhook recebe:

```sql
SELECT details->>'charge'->>'correlationID' as correlation_id_webhook
FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 5;
```

3. Se forem diferentes, ajuste a lógica de matching no webhook.

---

### ❌ Polling não detecta mudança

**Causa:** Frontend não está consultando o pedido correto

**Solução:**

1. Abra DevTools → Console
2. Procure por logs como:

```
[PIX POLLING 1/60] 🔍 Verificando status...
📋 Order ID: <algum_id>
```

3. Confirme se o `Order ID` bate com o `id` da tabela orders:

```sql
SELECT id, status, correlation_id FROM orders WHERE id = 'COLE_AQUI_O_ORDER_ID';
```

---

## ✅ CHECKLIST FINAL

Antes de considerar o problema resolvido:

- [ ] ✅ Webhook configurado no dashboard OpenPix
- [ ] ✅ URL correta (HTTPS, sem / no final)
- [ ] ✅ Evento: `OPENPIX:CHARGE_COMPLETED`
- [ ] ✅ Webhook ativo
- [ ] ✅ Teste manual retorna 200 OK
- [ ] ✅ Edge Function deployada com `--no-verify-jwt`
- [ ] ✅ Tabela `debug_logs` recebe logs do webhook
- [ ] ✅ Status do pedido muda de `pending` para `paid`
- [ ] ✅ Frontend detecta mudança em < 10 segundos
- [ ] ✅ Redireciona para página de sucesso
- [ ] ✅ Testado em produção com pagamento real

---

## 🎉 SUCESSO!

Se todos os checkboxes acima estão marcados, **o pagamento PIX agora está funcionando corretamente!**

**Tempo esperado de confirmação:**

- ⚡ **5-10 segundos** após o pagamento ser processado pelo banco

---

## 📊 MÉTRICAS DE SUCESSO

Configure dashboard no Supabase para monitorar:

```sql
-- Taxa de sucesso de confirmações (últimas 24h)
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') as pagos,
  COUNT(*) FILTER (WHERE status = 'pending') as pendentes,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'paid') / COUNT(*), 2) as taxa_sucesso_pct
FROM orders
WHERE payment_provider = 'openpix'
  AND created_at > NOW() - INTERVAL '24 hours';
```

**Meta:** Taxa de sucesso > 95%

---

## 📞 SUPORTE

Se após completar TODO este checklist o problema persistir, forneça:

1. ✅ Print do webhook no dashboard OpenPix
2. ✅ Resultado de todos os SQLs deste documento
3. ✅ Logs do console do navegador (DevTools)
4. ✅ Confirmação de que seguiu TODOS os passos acima

**Documentos relacionados:**

- [Como configurar webhook](./CONFIGURAR_WEBHOOK_OPENPIX.md)
- [Por que SDK não detecta pagamento](./PORQUE_SDK_NAO_DETECTA_PAGAMENTO.md)

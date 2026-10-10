# 🧪 SCRIPT DE TESTE RÁPIDO

Execute no SQL Editor do Supabase:

```sql
-- Ver os 5 últimos pedidos criados COM o formato e timestamp
SELECT
  id,
  correlation_id,
  status,
  payment_provider,
  created_at,
  CASE
    WHEN correlation_id LIKE 'order_%' THEN '✅ Formato correto'
    ELSE '❌ Formato ERRADO'
  END as formato_check
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**

- Pedidos novos (após hoje): `✅ Formato correto`
- Pedidos antigos: `❌ Formato ERRADO`

---

## 🔬 TESTE COMPLETO DO FLUXO

### 1️⃣ Criar novo pedido

1. Acesse o site
2. Adicione produto ao carrinho
3. Vá para checkout
4. Clique "Pagar com PIX"
5. **AGUARDE QR Code aparecer**

### 2️⃣ Verificar correlation_id

Execute IMEDIATAMENTE após criar:

```sql
-- Pegar o último pedido criado (deve ser o seu)
SELECT
  id,
  correlation_id,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**ANOTE** o `correlation_id` aqui: ******\_\_\_\_******

Ele deve começar com `order_` ✅

### 3️⃣ Simular Webhook

Substitua o `CORRELATION_ID` abaixo pelo que você anotou:

```bash
curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "OPENPIX:CHARGE_COMPLETED",
    "charge": {
      "status": "COMPLETED",
      "correlationID": "CORRELATION_ID_AQUI",
      "transactionID": "test_txn_123",
      "value": 10000
    }
  }'
```

### 4️⃣ Verificar se funcionou

```sql
-- Ver se o status mudou para 'paid'
SELECT
  id,
  correlation_id,
  status,
  updated_at
FROM orders
WHERE correlation_id = 'CORRELATION_ID_AQUI';
```

**Resultado esperado:**

- `status` = `'paid'` ✅
- `updated_at` = timestamp recente (segundos atrás)

### 5️⃣ Ver logs do webhook

```sql
SELECT
  created_at,
  message,
  details
FROM debug_logs
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

**Resultado esperado:**

- Múltiplos logs com timestamps recentes
- Mensagem: `"Pedido encontrado!"` ou `"Pedido atualizado com sucesso!"`

---

## ⚠️ SE O CORRELATION_ID AINDA ESTIVER ERRADO

Significa que você está usando código **antigo** em algum lugar.

Execute este comando para encontrar:

```powershell
# Procurar por código que gera UUIDs para correlation_id
Get-ChildItem -Recurse -Include *.tsx,*.ts,*.js -Path src,supabase | Select-String -Pattern "correlationID.*uuid|correlation_id.*crypto.randomUUID" -Context 2
```

O problema pode estar em:

- ❌ Código antigo em cache do navegador
- ❌ Build antigo do Vite
- ❌ Edge Function antiga não deployada

**Solução:**

```bash
# 1. Rebuild frontend
npm run build

# 2. Redeploy Edge Functions
npx supabase functions deploy create-openpix-order --no-verify-jwt
npx supabase functions deploy openpix-webhook --no-verify-jwt

# 3. Limpar cache do navegador (Ctrl+Shift+Delete)

# 4. Testar novamente
```

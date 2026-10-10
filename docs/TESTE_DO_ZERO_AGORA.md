# 🧪 TESTE DO ZERO - PASSO A PASSO

## FASE 1: Criar Novo Pedido (2 minutos)

### 1. Acesse o site

```
http://localhost:5173
```

### 2. Faça login (se necessário)

### 3. Adicione produto ao carrinho

- Vá em "Shop" ou "Produtos"
- Clique em qualquer produto
- Adicione ao carrinho

### 4. Vá para checkout

- Clique no ícone do carrinho
- Clique em "Finalizar compra"

### 5. Selecione "Pagar com PIX"

- Aguarde QR Code aparecer
- ⏸️ **PARE AQUI** - Não feche o modal ainda

---

## FASE 2: Anotar Correlation ID (30 segundos)

Abra Supabase Dashboard → SQL Editor e execute:

```sql
-- Pegar o último pedido criado
SELECT
  id,
  correlation_id,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;
```

**ANOTE AQUI:**

- `correlation_id` = **************\_\_\_\_**************
- `id` = **************\_\_\_\_**************

✅ Confirme que `correlation_id` começa com `order_`

---

## FASE 3: Simular Pagamento via Webhook (10 segundos)

No terminal PowerShell, substitua `SEU_CORRELATION_ID_AQUI`:

```powershell
$correlationId = "SEU_CORRELATION_ID_AQUI"

$body = @{
  event = 'OPENPIX:CHARGE_COMPLETED'
  charge = @{
    status = 'COMPLETED'
    correlationID = $correlationId
    transactionID = 'test_txn_' + (Get-Date -Format 'yyyyMMddHHmmss')
    value = 10000
  }
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri 'https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook' -Method Post -Body $body -ContentType 'application/json'
```

**RESULTADO ESPERADO:**

```
status  type  orderId
------  ----  -------
success order <algum-uuid>
```

---

## FASE 4: Verificar no Banco (10 segundos)

No SQL Editor:

```sql
-- Ver se o status mudou
SELECT
  id,
  status,
  correlation_id,
  updated_at
FROM orders
WHERE correlation_id = 'SEU_CORRELATION_ID_AQUI';
```

**RESULTADO ESPERADO:**

- `status` = `'paid'` ✅
- `updated_at` = timestamp recente (segundos atrás)

---

## FASE 5: Ver Logs do Webhook (10 segundos)

```sql
-- Ver logs do webhook
SELECT
  created_at,
  message,
  LEFT(details::text, 200) as details_preview
FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 10;
```

**RESULTADO ESPERADO:**
Múltiplos logs recentes:

- `"Webhook recebido (bruto)"`
- `"Webhook parseado"`
- `"Buscando pedido com correlation_id"`
- `"Pedido encontrado!"`
- `"Pedido atualizado com sucesso!"`

---

## FASE 6: Verificar Frontend (5 segundos)

Volte para a aba do navegador com o modal do QR Code aberto.

**RESULTADO ESPERADO (em até 3-6 segundos):**

1. Console mostra: `✅ PAGAMENTO CONFIRMADO!`
2. Modal fecha automaticamente
3. Redireciona para `/shop-sucesso`
4. Toast verde: "✅ Pagamento confirmado! Redirecionando..."

---

## ❌ SE NÃO REDIRECIONAR

1. Abra DevTools (F12)
2. Vá na aba **Console**
3. Procure por mensagens de polling:
   ```
   [PIX POLLING X/60] 🔍 Verificando status...
   ```
4. Se estiver aparecendo, aguarde até 60 tentativas
5. Se parou de aparecer, faça **Ctrl + Shift + R** (hard refresh)

---

## ✅ CHECKLIST FINAL

Após completar o teste, marque:

- [ ] QR Code apareceu na tela
- [ ] Correlation ID começa com `order_`
- [ ] Webhook manual retornou `status: success`
- [ ] Status no banco mudou para `paid`
- [ ] `updated_at` é recente
- [ ] Há logs na tabela `debug_logs`
- [ ] Frontend redirecionou automaticamente para `/shop-sucesso`

---

## 🎯 PRÓXIMOS PASSOS

### ✅ Se tudo funcionou:

O sistema está **100% funcional** via webhook manual.

**Problema restante:** OpenPix não está disparando webhook automaticamente quando pagamento real é feito.

**Solução:**

1. Fazer pagamento PIX **REAL** no banco
2. Aguardar 30-60 segundos
3. Verificar aba "Logs" no dashboard OpenPix
4. Se não aparecer → Problema é no OpenPix (suporte deles)

### ❌ Se alguma etapa falhou:

Me informe qual etapa falhou com:

- Mensagem de erro exata
- Screenshot se possível
- Resultado das queries SQL

---

**COMECE AGORA! 🚀**

Vá para **FASE 1** e execute cada passo.

# 🧪 Teste Completo do Pagamento PIX - Passo a Passo

## 📋 Pré-requisitos

1. ✅ Webhook deployado (acabamos de fazer!)
2. ✅ Webhook URL configurada no OpenPix
3. ✅ App rodando localmente (`npm run dev`)
4. ✅ Supabase Dashboard aberto em outra aba

---

## 🎯 TESTE 1: Simulação Rápida (Recomendado)

### Passo 1: Preparar Monitoramento

1. **Abrir Supabase SQL Editor:**

   ```
   https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql
   ```

2. **Colar e executar esta query (deixe aberta):**

   ```sql
   SELECT created_at, message, details
   FROM debug_logs
   WHERE source = 'openpix-webhook'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Preparar para atualizar:** Fique pronto para clicar em "RUN" novamente

### Passo 2: Criar Pedido de Teste

1. **Ir para a loja:**

   ```
   http://localhost:5173/roupas
   ```

2. **Adicionar produto ao carrinho**

3. **Finalizar compra:**
   - Clique em "Finalizar Compra"
   - Preencha CPF: `123.456.789-00`
   - Clique em "Pagar com PIX"

4. **Modal deve abrir** com QR Code

5. **COPIAR o correlation_id:**
   - Abra console do navegador (F12)
   - Procure por log: `[Polling] Iniciando verificação automática`
   - Copie o `orderId`

### Passo 3: Simular Pagamento no OpenPix

1. **Ir para OpenPix Dashboard:**

   ```
   https://app.openpix.com/
   ```

2. **Ir em "Cobranças" → Procurar a cobrança criada**
   - Deve aparecer com status "Pendente"
   - Use o correlation_id para filtrar

3. **Marcar como paga:**
   - Clique nos 3 pontinhos → "Marcar como paga"
   - ✅ Confirmar

### Passo 4: Verificar Logs

**Imediatamente após marcar como paga:**

1. **Voltar para Supabase SQL Editor**

2. **Clicar em RUN novamente** (para atualizar)

3. **Você DEVE ver estes logs:**

   ```
   ✅ Webhook recebido (bruto)
   ✅ PAYLOAD COMPLETO RECEBIDO
   ✅ Processando PEDIDO DE LOJA
   ✅ 🔍 BUSCANDO PEDIDO com correlation_id
   ✅ ✅ PEDIDO ENCONTRADO!
   ✅ 📝 Atualizando pedido existente
   ✅ ✅ PEDIDO ATUALIZADO COM SUCESSO!
   ✅ Pedido processado com sucesso!
   ```

4. **No navegador (onde estava o modal):**
   - Deve aparecer: `✅ Pagamento confirmado!`
   - Deve redirecionar para `/shop-sucesso`

---

## 🔍 TESTE 2: Verificar Polling Automático

### Cenário: Webhook funcionou, mas polling não detectou

1. **Após marcar pagamento como pago no OpenPix**

2. **Verificar no SQL se status mudou:**

   ```sql
   SELECT id, status, updated_at
   FROM orders
   WHERE correlation_id = 'COLAR_SEU_CORRELATION_ID_AQUI'
   ORDER BY created_at DESC;
   ```

3. **Status deve ser:** `paid`

4. **No navegador:**
   - Console deve mostrar: `[Polling] Status recebido: {status: "paid"}`
   - Deve redirecionar automaticamente

5. **Se NÃO redirecionar:**
   - Clicar no botão: **"✓ Já paguei, verificar agora"**
   - Isso força verificação manual

---

## 📊 TESTE 3: Verificar Histórico de Webhooks

1. **Ir para OpenPix:**

   ```
   https://app.openpix.com/home/webhooks
   ```

2. **Ver histórico de webhooks enviados**

3. **Deve aparecer:**
   - ✅ URL: `https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook`
   - ✅ Status: 200 OK
   - ✅ Event: OPENPIX:CHARGE_COMPLETED

4. **Clicar no webhook** para ver detalhes

---

## ❌ Troubleshooting

### Problema 1: Logs não aparecem no Supabase

**Causa:** Webhook não está sendo chamado

**Verificar:**

```sql
-- Não deve retornar nada se webhook não for chamado
SELECT COUNT(*) FROM debug_logs
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '5 minutes';
```

**Solução:**

1. Verificar URL no OpenPix Dashboard → Webhooks
2. URL deve ser EXATAMENTE: `https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook`
3. Testar webhook do OpenPix manualmente (botão "Testar" no dashboard)

---

### Problema 2: Logs aparecem mas pedido não atualiza

**Ver exatamente qual erro:**

```sql
SELECT created_at, message, details
FROM debug_logs
WHERE source = 'openpix-webhook'
  AND message LIKE '%❌%'
ORDER BY created_at DESC
LIMIT 1;
```

**Erros comuns:**

1. **"❌ Erro ao buscar pedido"**
   - correlation_id não bate
   - Verificar no SQL:
     ```sql
     SELECT id, correlation_id, openpix_correlation_id
     FROM orders
     WHERE created_at > NOW() - INTERVAL '10 minutes';
     ```

2. **"❌ ERRO ao atualizar pedido"**
   - Problema de permissão RLS
   - Webhook usa SERVICE_ROLE_KEY, não deveria dar esse erro
   - Ver campo `code` no log de erro

---

### Problema 3: Tudo funcionou mas não redireciona

**Console do navegador deve mostrar:**

```
[Polling] Verificando status do pedido
[Polling] Status recebido: {status: "paid", ...}
[Polling] Pagamento confirmado!
✅ Pagamento confirmado! Redirecionando...
```

**Se não aparecer:**

- Significa que polling não detectou a mudança
- **Solução imediata:** Clicar em "✓ Já paguei, verificar agora"

---

## 🎉 Resultado Esperado

### ✅ Fluxo Completo de Sucesso:

1. **Usuário:** Clica em "Pagar com PIX"
2. **Frontend:** Cria pedido (status: pending)
3. **Frontend:** Mostra QR Code
4. **Usuário:** Paga no app do banco
5. **OpenPix:** Recebe pagamento
6. **OpenPix:** Envia webhook → Supabase
7. **Webhook:** Atualiza pedido (status: paid)
8. **Frontend Polling:** Detecta mudança (a cada 3s)
9. **Frontend:** Mostra "Pagamento confirmado!"
10. **Frontend:** Redireciona para `/shop-sucesso`

### ⏱️ Tempo esperado: 3-6 segundos

---

## 📞 Suporte

**Se nada funcionar:**

1. Copiar logs do console (F12)
2. Copiar últimos 20 logs do Supabase:
   ```sql
   SELECT * FROM debug_logs WHERE source = 'openpix-webhook' ORDER BY created_at DESC LIMIT 20;
   ```
3. Screenshot do histórico de webhooks no OpenPix
4. correlation_id do pedido de teste

---

**✨ Última atualização:** 07/02/2026 - Webhook com logs detalhados deployado

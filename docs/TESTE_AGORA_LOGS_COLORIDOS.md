# 🧪 TESTE AGORA - Fluxo Completo com Logs Coloridos

## ✅ O que foi implementado AGORA:

### 📊 **Logs Coloridos no Console**

- 🟦 Azul = Polling iniciado
- 🟢 Verde = Pagamento confirmado
- 🟠 Laranja = Timeout/aviso
- 🔴 Vermelho = Erro
- 🟣 Roxo = Verificação manual

---

## 🎯 PASSO A PASSO - SIGA EXATAMENTE:

### 1️⃣ Preparar Ambiente

**Abrir 3 abas/janelas:**

1. **ABA 1: Supabase SQL Editor**

   ```
   https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/sql
   ```

   **Cole esta query e deixe pronta:**

   ```sql
   SELECT created_at, message, details
   FROM debug_logs
   WHERE source = 'openpix-webhook'
   ORDER BY created_at DESC
   LIMIT 15;
   ```

2. **ABA 2: Navegador no App (COM CONSOLE ABERTO - F12)**

   ```
   http://localhost:5173/roupas
   ```

   **IMPORTANTE:** Pressione F12 e vá na aba "Console" ANTES de começar

3. **ABA 3: OpenPix Dashboard**
   ```
   https://app.openpix.com/home/charges
   ```

---

### 2️⃣ Criar Pedido e Ver Logs

1. **Na ABA 2 (App):**
   - Adicionar um produto ao carrinho
   - Clicar em "Finalizar Compra"
   - Preencher CPF: `123.456.789-00`
   - Clicar em **"Pagar com PIX"**

2. **NO CONSOLE (F12), você DEVE VER:**

   ```
   ✅ COBRANÇA PIX CRIADA
   📋 Correlation ID: order_userid_timestamp
   🆔 Order ID: uuid-aqui
   📄 QR Code gerado: true
   🔄 POLLING INICIADO - Verificando a cada 3 segundos
   ```

3. **DEPOIS disso, a cada 3 segundos:**
   ```
   [PIX POLLING 1/60] 🔍 Verificando status...
   📋 Order ID: uuid
   📊 Status recebido: {status: "pending", ...}
   ⏳ Status ainda 'pending' - Tentativa 1/60
   ```

---

### 3️⃣ Simular Pagamento no OpenPix

1. **Ir para a ABA 3 (OpenPix Dashboard)**

2. **Em "Cobranças", ver a cobrança que acabou de criar**
   - Status: "Pendente"
   - Valor: o que você configurou

3. **Clicar nos 3 pontinhos → "Marcar como paga"**

4. **✅ Confirmar**

---

### 4️⃣ Verificar Logs (IMEDIATAMENTE após marcar como paga)

**ABA 1 (Supabase SQL):**

- Clicar em **"RUN"** novamente
- Deve aparecer vários logs novos:
  ```
  ✅ Webhook recebido (bruto)
  ✅ PAYLOAD COMPLETO RECEBIDO
  ✅ Processando PEDIDO DE LOJA
  ✅ 🔍 BUSCANDO PEDIDO com correlation_id
  ✅ ✅ PEDIDO ENCONTRADO!
  ✅ 📝 Atualizando pedido existente
  ✅ ✅ PEDIDO ATUALIZADO COM SUCESSO!
  ```

**ABA 2 (Console do App):**

- Máximo 3-6 segundos depois, deve aparecer:
  ```
  ✅ PAGAMENTO CONFIRMADO!
  ```
- **Modal fecha automaticamente**
- **Redireciona para /shop-sucesso**

---

## 🔴 SE NÃO FUNCIONAR AUTOMATICAMENTE:

### Cenário A: Logs aparecem no Supabase mas não no App

**Significa:** Webhook funcionou, polling não detectou

**Solução Imediata:**

1. Clicar no botão **"✓ Já paguei, verificar agora"** (aparece na parte inferior)
2. No console deve aparecer:
   ```
   🔍 VERIFICAÇÃO MANUAL SOLICITADA
   ✅ PAGAMENTO CONFIRMADO (MANUAL)!
   ```

---

### Cenário B: Logs NÃO aparecem no Supabase

**Significa:** Webhook não está sendo chamado

**Verificar:**

1. URL no OpenPix Dashboard → Configurações → Webhooks
2. Deve ser EXATAMENTE:
   ```
   https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook
   ```

**Testar webhook:**

- No OpenPix → Webhooks → Clicar em "Testar"
- Ver se retorna 200 OK

---

### Cenário C: Console mostra erro

**Copiar TODO o erro** e verificar:

1. **CORS Error:**
   - Edge function precisa de redeploy

2. **403/401 Error:**
   - Problema de permissão
   - Verificar se .env tem VITE_SUPABASE_PUBLISHABLE_KEY

3. **Network Error:**
   - Função não está deployada
   - Verificar: `npx supabase functions list`

---

## 📸 PRINTS IMPORTANTES:

Se não funcionar, tire prints de:

1. ✅ **Console completo** (F12 → Console) mostrando todos os logs
2. ✅ **Resultado da query SQL** no Supabase
3. ✅ **Histórico de webhooks** no OpenPix (se houver)
4. ✅ **Network tab** (F12 → Network) filtrando por "orders"

---

## ⏱️ TEMPO ESPERADO:

- **Criar cobrança:** < 2 segundos
- **Modal abrir:** Imediato
- **Polling começar:** Imediato
- **Após pagar:**
  - Webhook processar: < 1 segundo
  - Polling detectar: 0-3 segundos
  - **TOTAL: 3-6 segundos no máximo**

---

## 🎉 SUCESSO = VER ISTO:

**No Console:**

```
✅ COBRANÇA PIX CRIADA
🔄 POLLING INICIADO
[PIX POLLING 1/60] 🔍 Verificando status...
⏳ Status ainda 'pending'...
[PIX POLLING 2/60] 🔍 Verificando status...
✅ PAGAMENTO CONFIRMADO!
```

**No App:**

- Toast verde: "✅ Pagamento confirmado!"
- Redirecionamento para /shop-sucesso
- Carrinho limpo

**No Supabase:**

- 7-10 logs do webhook processando
- Pedido com status = "paid"

---

## 🚀 COMECE AGORA!

1. Abrir as 3 abas
2. Seguir o passo a passo
3. Observar os logs coloridos
4. Me avisar o resultado

**Boa sorte! Com os logs coloridos ficou muito mais fácil de debugar.** 🎨

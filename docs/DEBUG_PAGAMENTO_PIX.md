# 🔍 Debug do Pagamento PIX - Guia Completo

## 📋 Problema Relatado

Pagamento via PIX não confirma automaticamente após o usuário pagar.

---

## ✅ Correções Aplicadas (07/02/2026)

### 1. **Melhorias no Polling**

- ✅ Adicionar contador de tentativas (máx 60 tentativas = 3 minutos)
- ✅ Logs detalhados em cada verificação
- ✅ Feedback visual do progresso
- ✅ Timeout automático após limite

### 2. **Interface Melhorada**

- ✅ Card flutuante na parte inferior mostrando status
- ✅ Botão "Já paguei, verificar agora" destacado
- ✅ Contador visual de tentativas

### 3. **Logs Aprimorados**

- ✅ Logger no inicio e fim de cada polling
- ✅ Logger em verificações manuais
- ✅ Registro de status recebido do banco

---

## 🧪 Como Testar

### Teste 1: Verificar se o fluxo básico funciona

1. **Ir para a loja e adicionar produtos ao carrinho**

   ```
   http://localhost:5173/roupas
   ```

2. **Finalizar compra e escolher PIX**
   - Clique em "Finalizar Compra"
   - Preencha CPF
   - Clique em "Pagar com PIX"

3. **Verificar se o QR Code aparece**
   - Modal deve abrir com QR Code
   - Deve ter botão "Copiar Código PIX"

4. **Após modal abrir, ver console do navegador**
   - Pressione F12 → Console
   - Procure por logs com `[Polling]`
   - Deve aparecer: `[Polling] Verificando status do pedido`

---

### Teste 2: Verificar Webhook do OpenPix

1. **Acessar Dashboard do OpenPix**
   - https://app.openpix.com/
   - Login com suas credenciais

2. **Ir em Configurações → Webhooks**
   - Verificar se a URL está configurada:

   ```
   https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook
   ```

3. **Criar cobrança de teste**
   - No dashboard OpenPix → Criar cobrança
   - Usar CPF de teste: `123.456.789-00`
   - Valor: R$ 10,00

4. **Simular pagamento no OpenPix**
   - OpenPix tem opção "Marcar como pago" para testes
   - Verificar se webhook foi disparado

---

### Teste 3: Verificar Logs do Supabase

1. **Acessar Supabase Dashboard**

   ```
   https://supabase.com/dashboard/project/_/logs
   ```

2. **Ver logs da Edge Function**
   - Ir em: Functions → openpix-webhook → Logs
   - Procurar por:
     - `Webhook recebido`
     - `Processando PEDIDO DE LOJA`
     - `Pedido processado com sucesso`

3. **Verificar tabela debug_logs**
   ```sql
   SELECT * FROM debug_logs
   WHERE source = 'openpix-webhook'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

---

## 🔧 Checklist de Verificação

Execute este checklist se o pagamento não confirmar:

### ✅ 1. Console do Navegador (F12)

```
[Polling] Verificando status do pedido - {orderId: "...", attempt: 1}
[Polling] Status recebido: {status: "pending", ...}
```

- ✅ Logs aparecem a cada 3 segundos?
- ✅ Status retorna "pending" ou "paid"?

### ✅ 2. Banco de Dados (Supabase)

```sql
-- Ver últimos pedidos
SELECT id, status, correlation_id, created_at, updated_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Ver pedido específico
SELECT * FROM orders WHERE id = 'SEU_ORDER_ID';
```

### ✅ 3. Webhook OpenPix

- URL configurada corretamente?
- Testes de webhook retornam 200 OK?
- Ver em OpenPix → Webhooks → Histórico

### ✅ 4. Edge Function ativa?

```bash
# Verificar se função está deployada
npx supabase functions list
```

Deve aparecer:

- ✅ create-openpix-order
- ✅ openpix-webhook

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "Polling não detecta mudança"

**Sintoma:** Status fica "pending" mesmo após pagar

**Causa:** Webhook não está atualizando o pedido

**Solução:**

1. Verificar URL do webhook no OpenPix
2. Ver logs da edge function openpix-webhook
3. Testar webhook manualmente:
   ```bash
   curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook \
     -H "Content-Type: application/json" \
     -d '{"event": "OPENPIX:CHARGE_COMPLETED", "charge": {...}}'
   ```

---

### Problema 2: "Modal não abre"

**Sintoma:** Clica em "Pagar com PIX" mas modal não aparece

**Causa:** Erro ao criar cobrança

**Solução:**

1. Ver console do navegador (F12)
2. Procurar por erros em vermelho
3. Verificar se `VITE_OPENPIX_APP_ID` está no .env
4. Ver logs da edge function create-openpix-order

---

### Problema 3: "Status permanece 'pending' para sempre"

**Sintoma:** Polling continua infinitamente

**Causa:** correlationID não bate entre criar cobrança e webhook

**Solução:**

1. Verificar correlation_id no banco:

   ```sql
   SELECT id, correlation_id, openpix_correlation_id
   FROM orders
   WHERE status = 'pending'
   ORDER BY created_at DESC;
   ```

2. Comparar com correlation_id que OpenPix enviou no webhook

---

## 🎯 Ação Imediata

**Se o pagamento não confirmar automaticamente:**

1. **Usuário já pagou?**
   - Clicar no botão "✓ Já paguei, verificar agora"
   - Isso força uma verificação manual imediata

2. **Ainda não funcionou?**
   - Copiar o ID do pedido (mostra no card)
   - Executar no SQL do Supabase:
     ```sql
     UPDATE orders
     SET status = 'paid', updated_at = NOW()
     WHERE id = 'COLAR_ID_AQUI';
     ```

3. **Investigar logs:**
   - Ver console do navegador
   - Ver logs do Supabase
   - Ver histórico de webhooks no OpenPix

---

## 📞 Suporte

Se nenhuma das soluções acima resolver:

1. **Copiar logs do console (F12)**
2. **Copiar erro da edge function (Supabase)**
3. **Screenshot do histórico de webhooks (OpenPix)**
4. **Compartilhar correlation_id do pedido**

---

## 🔗 Links Úteis

- [Dashboard OpenPix](https://app.openpix.com/)
- [Supabase Functions Logs](https://supabase.com/dashboard/project/_/logs)
- [Documentação OpenPix](https://developers.openpix.com/)

---

**Última atualização:** 07/02/2026
**Correções aplicadas:** Polling melhorado + Logs + Verificação manual

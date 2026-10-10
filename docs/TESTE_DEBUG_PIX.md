# TESTE DE DEBUG: Sistema de Pagamento PIX

## Objetivo

Identificar por que o polling não está detectando o pagamento confirmado automaticamente.

## Passo 1: Limpar Cache do Navegador

1. Pressione **Ctrl+Shift+Delete** (Windows) ou **Cmd+Shift+Delete** (Mac)
2. Marque **"Cached Images and Files"**
3. Clique em **"Clear Data"**
4. **OU** simplesmente: **Ctrl+F5** (hard refresh)

## Passo 2: Abrir DevTools

1. Pressione **F12** para abrir DevTools
2. Vá para a aba **Console**
3. Clique no ícone de **"Clear Console"** (🗑️) para limpar

## Passo 3: Fazer um Novo Pedido PIX

1. Acesse: http://localhost:5173/roupas (ou sua URL)
2. Adicione um produto ao carrinho
3. Clique em **"Finalizar Compra"**
4. Escolha **PIX** como pagamento
5. O QR Code deve abrir

## Passo 4: Observar os Logs no Console

Você deve ver logs como estes:

```
[POLLING 1] Query Supabase: { orderId: "...", data: {...}, status: "pending" }
[POLLING 1] Edge Function response: { id: "...", status: "pending" }
[POLLING 1] Status final: pending
[POLLING 1] Ainda aguardando... Status: pending
```

## Passo 5: Simular/Fazer o Pagamento

**OPÇÃO A: Pagamento Real**

- Escaneie o QR Code com seu app bancário
- Pague o valor

**OPÇÃO B: Simular Pagamento (Teste)**  
Abra o SQL Editor do Supabase e execute:

```sql
-- Ver o último pedido criado
SELECT id, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 1;

-- Copie o ID e atualize manualmente:
UPDATE orders
SET status = 'paid', updated_at = NOW()
WHERE id = '4b74897d-2ed4-4cc1-a8ef-903e6b9df9e5';
```

## Passo 6: Observar se o Polling Detecta

Após pagar/atualizar, você deve ver nos logs:

```
[POLLING X] Query Supabase: { ..., status: "paid" }
[POLLING X] Edge Function response: { ..., status: "paid" }
[POLLING X] Status final: paid
🎉 PAGAMENTO CONFIRMADO! Acionando setPaid...
```

E então o site deve:

- ✅ Mostrar mensagem "Pagamento confirmado! Redirecionando..."
- ✅ Redirecionar para `/shop-sucesso`

## Passo 7: Se Não Funcionar, Capture os Seguintes Dados

### A) Copie TODOS os logs do console

Clique com botão direito no console → "Save as..."

### B) Execute no SQL Editor:

```sql
-- 1. Ver o pedido
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;

-- 2. Ver logs do webhook
SELECT * FROM debug_logs
WHERE source = 'openpix-webhook'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver policies RLS
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'orders';
```

### C) Me envie:

1. Screenshots dos logs do console
2. Resultado das queries SQL acima
3. O ID do pedido que você testou

## Possíveis Problemas e Soluções

### Problema 1: Logs não aparecem

**Solução**: Faça hard refresh (Ctrl+F5), a versão antiga está em cache

### Problema 2: orderId é null/undefined

**Solução**: A edge function create-openpix-order não está retornando o ID

```bash
# Ver logs da função
npx supabase functions logs create-openpix-order --follow
```

### Problema 3: Status sempre "pending" mesmo após pagar

**Solução**: O webhook não está atualizando. Verificar:

- URL do webhook no painel OpenPix
- Flag --no-verify-jwt está ativada
- Logs do webhook no Supabase

```bash
# Ver logs do webhook
npx supabase functions logs openpix-webhook --follow
```

### Problema 4: RLS bloqueando leitura

**Solução**: Aplicar a migration que criamos

```bash
echo Y | npx supabase db push
```

### Problema 5: isPaid muda mas página não redireciona

**Solução**: Verificar o useEffect que monitora isPaid

- Verificar se clearCart() está funcionando
- Verificar se navigate() está sendo chamado

## Comando de Emergência: Ver TUDO

Execute no terminal:

```bash
# Ver logs de todas as edge functions ao mesmo tempo
npx supabase functions logs --follow
```

Faça um pagamento e observe se aparecem logs de:

- create-openpix-order (ao clicar PIX)
- openpix-webhook (quando o OpenPix notifica)
- check-order (durante o polling)

## Resultado Esperado

✅ **Funcionando corretamente:**

1. Clicar em PIX → QR Code abre (logs de create-openpix-order)
2. Pagar → Webhook recebe notificação (logs de openpix-webhook)
3. Polling detecta em 1-5 segundos (logs de check-order)
4. Página redireciona automaticamente

❌ **Se não funcionar:**

- Capture os logs conforme instruções acima
- Me envie para análise
- Vou identificar exatamente onde está travando

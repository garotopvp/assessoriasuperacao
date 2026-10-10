# 🧪 TESTE WEBHOOK PIX - AGORA

Data: 08/02/2026 15:30
Status: Webhook ATIVO no OpenPix ✅

## ✅ Configuração Atual

- **Webhook**: "Webhook Confirmação Pagamento"
- **Status no OpenPix**: ATIVO (Sim)
- **Evento**: Cobrança paga (OPENPIX:CHARGE_COMPLETED)
- **Ação**: Chamar API
- **RLS Policies**: CORRETAS (migration aplicada)
- **Edge Function**: Deployed com --no-verify-jwt

## 🎯 TESTE COMPLETO

### Passo 1: Criar Novo Pagamento PIX

1. Acesse: https://boracorrerclub.vercel.app
2. Adicione um produto ao carrinho
3. Vá até checkout
4. Selecione PIX como pagamento
5. Clique em "Finalizar Compra"
6. **IMPORTANTE**: Copie o `correlation_id` que aparece no console do navegador

### Passo 2: Marcar como Pago no OpenPix

1. Abra o dashboard OpenPix
2. Encontre a cobrança recém-criada
3. Marque como "Pago" (se necessário)

### Passo 3: Verificar Webhook Chamado

Execute no Supabase SQL Editor:

```sql
-- Verificar se webhook foi chamado nos últimos 2 minutos
SELECT
  id,
  source,
  level,
  message,
  created_at
FROM debug_logs
WHERE source = 'openpix-webhook'
  AND created_at > NOW() - INTERVAL '2 minutes'
ORDER BY created_at DESC;
```

**Esperado**: Deve aparecer pelo menos 1 linha com mensagem de webhook recebido.

### Passo 4: Verificar Pedido Atualizado

```sql
-- Verificar status do pedido (use o correlation_id do Passo 1)
SELECT
  id,
  status,
  correlation_id,
  payment_status,
  updated_at
FROM orders
WHERE correlation_id = 'COLE_AQUI_O_CORRELATION_ID'
ORDER BY created_at DESC;
```

**Esperado**: `status = 'paid'` e `payment_status = 'paid'`

### Passo 5: Verificar Frontend

- O console do navegador deve mostrar: "✅ Pedido pago! Redirecionando..."
- Deve redirecionar automaticamente para `/shop-sucesso`

## 📊 Resultados Esperados

| Componente        | Tempo    | Status Esperado                      |
| ----------------- | -------- | ------------------------------------ |
| OpenPix → Webhook | Imediato | Webhook disparado ao marcar pago     |
| debug_logs        | 1-2s     | Entrada com source='openpix-webhook' |
| orders.status     | 1-3s     | Mudado para 'paid'                   |
| Frontend polling  | 3-9s     | Detecta mudança e redireciona        |

## ❌ Se NÃO Funcionar

### Webhook não chamado (debug_logs vazio)

1. Verificar IP na mensagem do OpenPix: "186.224.205.214"
2. Testar URL manualmente: `curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook`
3. Verificar conta OpenPix tem webhooks habilitados
4. Contatar suporte OpenPix

### Webhook chamado mas pedido não atualiza

1. Verificar logs do Edge Function no Supabase
2. Confirmar RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'orders'`
3. Testar UPDATE manual (já fizemos, funcionou ✅)

### Frontend não detecta

1. Verificar polling está rodando (console do navegador)
2. Verificar correlation_id correto
3. Confirmar check-order retorna status atualizado

## 🎯 Início do Teste

**Data/Hora**: ****\_\_\_****  
**correlation_id**: ****\_\_\_****  
**Charge ID (OpenPix)**: ****\_\_\_****

### Checklist

- [ ] Pagamento criado
- [ ] correlation_id copiado
- [ ] Marcado como pago no OpenPix
- [ ] debug_logs verificado (webhook chamado?)
- [ ] orders verificado (status = paid?)
- [ ] Frontend redirecionou para /shop-sucesso?

## ✅ SUCESSO!

Se todas as etapas funcionaram, o sistema está 100% operacional! 🎉

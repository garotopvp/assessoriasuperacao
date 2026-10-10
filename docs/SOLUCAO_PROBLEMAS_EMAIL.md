# 🐛 Problemas com Email de Pedidos - Soluções

## Problema 1: Email não está chegando

### Causa:

O email é enviado pelo webhook do Stripe (`stripe-webhook`), mas o Stripe precisa estar configurado para enviar eventos para o Supabase.

### Solução:

1. Acesse o Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Adicione um novo endpoint:
   - **URL**: `https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/stripe-webhook`
   - **Eventos para escutar**:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
3. Copie o **Signing Secret** (começa com `whsec_...`)
4. Configure no Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_SUA_CHAVE_AQUI --project-ref tdzdureusnszdzvsoomr
   ```

---

## Problema 2: Imagem do produto não aparece

### Causa:

A imagem precisa ser passada do frontend quando cria o pedido, mas atualmente não está sendo enviada.

### Solução:

Atualizar o arquivo `src/pages/EscolherPagamentoProduto.tsx` para incluir a imagem:

**Localizar esta linha (aproximadamente linha 112):**

```typescript
const { data, error } = await supabase.functions.invoke("create-stripe-order", {
  body: {
    items: cart.map((item) => ({
      name: item.nome,
      size: item.tamanho,
      price: item.preco,
      quantity: item.quantidade,
      // ADICIONAR ESTA LINHA:
      image: item.imagem_principal || item.imagem,
    })),
    userId: user.id,
    customer: {
      email: user.email,
    },
  },
});
```

---

## Problema 3: Pedido não aparece no admin

### Causa:

Pode haver duplicação de pedidos ou o pedido está sendo criado com status errado.

### Solução:

1. Verificar se a tabela `orders` existe no banco:
   - Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/editor
   - Procure pela tabela `orders`

2. Se não existir, criar a tabela:

   ```sql
   CREATE TABLE IF NOT EXISTS orders (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     stripe_session_id TEXT UNIQUE,
     stripe_payment_intent TEXT,
     customer_email TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending',
     total DECIMAL(10,2) NOT NULL,
     items JSONB,
     shipping_address JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE IF NOT EXISTS order_items (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
     product_name TEXT NOT NULL,
     product_size TEXT,
     product_image TEXT,
     price DECIMAL(10,2) NOT NULL,
     quantity INTEGER NOT NULL DEFAULT 1,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

---

## 🧪 Como Testar:

### 1. Teste Manual (Recomendado):

1. Acesse: https://www.boracorrerclub.com.br/loja
2. Adicione um produto ao carrinho
3. Finalize a compra
4. Use um cartão de teste do Stripe:
   - **Número**: `4242 4242 4242 4242`
   - **Data**: Qualquer data futura
   - **CVC**: Qualquer 3 dígitos
5. Verifique:
   - Email chegou em `pedidos@boracorrerclub.com.br`?
   - Pedido aparece no admin?
   - Imagem do produto está correta?

### 2. Verificar Logs:

```bash
# Ver logs do webhook
# Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/functions/stripe-webhook/logs

# Ver logs do email
# Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/functions/send-order-email/logs
```

---

## 📋 Checklist:

- [ ] Webhook configurado no Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no Supabase
- [ ] Imagem do produto sendo passada no frontend
- [ ] Tabelas `orders` e `order_items` existem no banco
- [ ] Teste de compra realizado com sucesso
- [ ] Email chegou
- [ ] Pedido aparece no admin
- [ ] Imagem do produto está correta

---

## 🆘 Se ainda não funcionar:

1. **Verifique os logs do Stripe**:
   - https://dashboard.stripe.com/logs
   - Procure por erros de webhook

2. **Verifique os logs do Supabase**:
   - https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/logs

3. **Teste o webhook manualmente**:
   ```bash
   curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-order-email \
     -H "Content-Type: application/json" \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemR1cmV1c25zemR6dnNvb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTQ1MjEsImV4cCI6MjA1MjE5MDUyMX0.JVXWxJNSLGJOqNjLxMJjBCJbmqSYJcHYMpPNQRGTlrE" \
     -d '{
       "type": "confirmation",
       "email": "seu-email@teste.com",
       "orderId": "test-123",
       "status": "paid",
       "total": 100.00,
       "items": [{
         "name": "Boné Essential Cap",
         "size": "UNICO",
         "quantity": 1,
         "price": 100.00,
         "image": "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80"
       }]
     }'
   ```

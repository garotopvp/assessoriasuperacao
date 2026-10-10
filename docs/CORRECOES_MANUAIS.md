# ✅ Correções Necessárias - Passo a Passo

## 🎯 Objetivo

Fazer com que a imagem do produto apareça no email de pedidos.

## 📝 Arquivos para Editar

### 1️⃣ `src/types/product.ts` (Linha 16)

**ANTES:**

```typescript
export interface CartItem {
  id: number;
  produtoId: number;
  nome: string;
  preco: number;
  tamanho: string;
  imagem: string; // ← MUDAR AQUI
  quantidade: number;
}
```

**DEPOIS:**

```typescript
export interface CartItem {
  id: number;
  produtoId: number;
  nome: string;
  preco: number;
  tamanho: string;
  imagem: string;
  imagem_principal?: string; // ← ADICIONAR ESTA LINHA
  quantidade: number;
}
```

---

### 2️⃣ `src/contexts/CartContext.tsx` (Linha 60)

**ANTES:**

```typescript
const newItem: CartItem = {
  id: Date.now(),
  produtoId: product.id,
  nome: product.nome,
  preco: product.preco,
  tamanho,
  imagem: product.imagem, // ← MUDAR AQUI
  quantidade,
};
```

**DEPOIS:**

```typescript
const newItem: CartItem = {
  id: Date.now(),
  produtoId: product.id,
  nome: product.nome,
  preco: product.preco,
  tamanho,
  imagem: product.imagem_principal || product.imagem, // ← MUDAR AQUI
  imagem_principal: product.imagem_principal, // ← ADICIONAR ESTA LINHA
  quantidade,
};
```

---

### 3️⃣ `src/components/checkout/CheckoutModal.tsx` (Linha 166)

**ANTES:**

```typescript
const items = cart.map((item) => ({
  id: item.produtoId,
  name: `${item.nome} - Tam. ${item.tamanho}`,
  price: item.preco,
  quantity: item.quantidade,
  image: item.imagem.startsWith("http") ? item.imagem : undefined, // ← MUDAR AQUI
  size: item.tamanho,
}));
```

**DEPOIS:**

```typescript
const items = cart.map((item) => ({
  id: item.produtoId,
  name: `${item.nome} - Tam. ${item.tamanho}`,
  price: item.preco,
  quantity: item.quantidade,
  image: item.imagem_principal || item.imagem, // ← MUDAR AQUI
  size: item.tamanho,
}));
```

---

## 🧪 Como Testar

1. **Limpe o carrinho** (importante para pegar a nova estrutura):
   - Abra o DevTools (F12)
   - Console: `localStorage.removeItem('carrinho')`
   - Recarregue a página

2. **Adicione um produto ao carrinho**
   - Vá em `/loja`
   - Adicione qualquer produto

3. **Faça um pedido de teste**
   - Use modo de teste do Stripe (veja `GUIA_TESTE_STRIPE.md`)
   - Ou use PIX

4. **Verifique o email**
   - A imagem do produto deve aparecer no email

---

## ⚠️ Importante

- Depois de fazer as alterações, **limpe o carrinho** no localStorage
- Isso é necessário porque o carrinho antigo não tem `imagem_principal`
- Novos produtos adicionados terão a imagem correta

---

## 🔍 Verificar se Funcionou

Depois das alterações:

1. Abra o DevTools (F12)
2. Console: `JSON.parse(localStorage.getItem('carrinho'))`
3. Verifique se tem `imagem_principal` nos itens
4. A URL deve ser algo como: `https://images.unsplash.com/...`

---

## 📧 Email de Teste

Depois de corrigir, você pode testar o email diretamente:

```powershell
$orderId = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"; Invoke-RestMethod -Uri "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-order-email" -Method Post -Headers @{"Content-Type"="application/json"; "apikey"="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkemR1cmV1c25zemR6dnNvb21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2MTQ1MjEsImV4cCI6MjA1MjE5MDUyMX0.JVXWxJNSLGJOqNjLxMJjBCJbmqSYJcHYMpPNQRGTlrE"} -Body (@{"type"="confirmation";"email"="pedidos@boracorrerclub.com.br";"orderId"=$orderId;"status"="paid";"total"=100.00;"items"=@(@{"name"="Boné Essential Cap";"size"="UNICO";"quantity"=1;"price"=100.00;"image"="https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80"})} | ConvertTo-Json -Depth 10)
```

---

## ✅ Checklist

- [ ] Editei `src/types/product.ts`
- [ ] Editei `src/contexts/CartContext.tsx`
- [ ] Editei `src/components/checkout/CheckoutModal.tsx`
- [ ] Limpei o localStorage do carrinho
- [ ] Adicionei um produto novo ao carrinho
- [ ] Verifiquei que `imagem_principal` está no localStorage
- [ ] Fiz um pedido de teste
- [ ] Email chegou com a imagem do produto

---

**Qualquer dúvida, me avise!** 🚀

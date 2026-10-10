# 📧 Template de Email Minimalista - Bora Correr Club

## 🎨 Novo Design

O template de email foi completamente redesenhado com um estilo **minimalista clean** inspirado em designs modernos de e-commerce premium.

### Características do Design:

- **Cores**: Paleta Zinc + Emerald (minimalista e profissional)
- **Layout**: Cards arredondados (border-radius: 32px)
- **Tipografia**: Inter font (Google Fonts)
- **Espaçamento**: Generoso e respirável
- **Sombras**: Suaves e modernas
- **Ícones**: SVG inline para melhor compatibilidade

## 🔗 Redirecionamentos Inteligentes

### Para o Cliente:

- **Botão**: "Ver Detalhes do Pedido"
- **URL**: `https://www.boracorrerclub.com.br/perfil?tab=pedidos`
- Redireciona para a aba de pedidos no perfil do usuário

### Para o Admin:

- **Botão**: "Ver no Admin"
- **URL**: `https://www.boracorrerclub.com.br/admin?tab=pedidos`
- Redireciona para a aba de pedidos no painel administrativo

## 📨 Envio de Emails

O sistema agora envia **2 emails** para cada pedido:

1. **Email do Cliente**: Com botão para ver pedidos no perfil
2. **Email do Admin**: Com botão para ver pedidos no admin (enviado para `financeiro@boracorrerclub.com.br`)

## 🎯 Estrutura do Email

```
┌─────────────────────────────────┐
│         Logo Circular           │
├─────────────────────────────────┤
│    Badge de Status (Emerald)    │
│  "Pagamento Confirmado" ✓       │
├─────────────────────────────────┤
│         Título Principal        │
│    "O seu pedido está a         │
│         caminho! ⚡"             │
├─────────────────────────────────┤
│      Card de Itens (Zinc-50)    │
│  ┌───────────────────────────┐  │
│  │ 📦 Resumo do Kit          │  │
│  ├───────────────────────────┤  │
│  │ [Img] Produto 1           │  │
│  │       Tam: M • Qtd: 2     │  │
│  ├───────────────────────────┤  │
│  │ Total Pago    R$ 139,80   │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│   Botão CTA (Preto, Rounded)    │
│  "Ver Detalhes do Pedido →"     │
├─────────────────────────────────┤
│      Suporte WhatsApp           │
│    💬 +55 13 99689-0611         │
├─────────────────────────────────┤
│          Rodapé (Zinc-50)       │
│  BORA CORRER CLUB • PERFORMANCE │
└─────────────────────────────────┘
```

## 🚀 Como Usar

### Enviar Email de Confirmação:

```typescript
await fetch("https://[seu-projeto].supabase.co/functions/v1/send-order-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: "confirmation",
    email: "cliente@email.com",
    orderId: "abc123",
    status: "paid", // ou 'awaiting_payment'
    total: 139.8,
    items: [
      {
        name: "Camiseta Masculina Bora Correr Club",
        size: "M",
        quantity: 2,
        price: 69.9,
        image: "https://...", // opcional
      },
    ],
  }),
});
```

## 🎨 Cores do Brand

```typescript
const BRAND = {
  primary: "#10b981", // emerald-500
  primaryDark: "#059669", // emerald-600
  dark: "#18181b", // zinc-900
  gray: "#71717a", // zinc-500
  grayLight: "#f4f4f5", // zinc-100
  grayBg: "#fafafa", // zinc-50
  black: "#09090b", // zinc-950
  white: "#FFFFFF",
};
```

## 📱 Responsividade

O template é totalmente responsivo e otimizado para:

- ✅ Gmail (Desktop e Mobile)
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Outros clientes de email

## 🔧 Customização

Para personalizar o template, edite o arquivo:
`supabase/functions/send-order-email/index.ts`

### Alterar cores:

Modifique o objeto `BRAND` no início do arquivo.

### Alterar URLs:

Modifique as variáveis `ctaUrl` na função `generateConfirmationEmail`.

### Alterar WhatsApp:

Procure por `wa.me/5513996890611` e substitua pelo seu número.

## 📝 Notas

- O template usa fontes do Google Fonts (Inter) para melhor aparência
- SVGs inline garantem compatibilidade com todos os clientes de email
- Imagens têm fallback para caso não carreguem
- O design é otimizado para conversão (CTA destacado)

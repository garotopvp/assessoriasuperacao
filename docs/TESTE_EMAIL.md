# 🧪 Guia de Teste - Email de Pedidos

## ✅ Status da Configuração

- [x] Template minimalista implementado
- [x] Função `send-order-email` deployada
- [x] Secret `RESEND_API_KEY` configurado no Supabase
- [x] Redirecionamentos configurados (cliente → perfil, admin → admin)

## 🔧 Como Testar

### Opção 1: Fazer um Pedido de Teste

1. Acesse o site: https://www.boracorrerclub.com.br
2. Adicione um produto ao carrinho
3. Finalize a compra
4. Verifique seu email

### Opção 2: Testar Diretamente a Função

Use o Supabase Dashboard ou faça uma requisição HTTP:

```bash
curl -X POST \
  https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/send-order-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -d '{
    "type": "confirmation",
    "email": "seu-email@teste.com",
    "orderId": "test-123456",
    "status": "paid",
    "total": 139.80,
    "items": [
      {
        "name": "Camiseta Masculina Bora Correr Club",
        "size": "M",
        "quantity": 2,
        "price": 69.90
      }
    ]
  }'
```

### Opção 3: Teste via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr/functions
2. Clique em `send-order-email`
3. Vá para a aba "Invoke"
4. Cole o JSON de teste:

```json
{
  "type": "confirmation",
  "email": "seu-email@teste.com",
  "orderId": "test-123456",
  "status": "paid",
  "total": 139.8,
  "items": [
    {
      "name": "Camiseta Masculina Bora Correr Club",
      "size": "M",
      "quantity": 2,
      "price": 69.9
    }
  ]
}
```

5. Clique em "Invoke Function"

## 📧 O Que Esperar

Você receberá **2 emails**:

### 1. Email do Cliente

- **Para**: O email especificado no teste
- **Assunto**: 🏃 Bora Correr Club - Pedido #123456 Recebido!
- **Botão**: "Ver Detalhes do Pedido" → Redireciona para `/perfil?tab=pedidos`

### 2. Email do Admin

- **Para**: financeiro@boracorrerclub.com.br
- **Assunto**: [ADMIN] 🏃 Bora Correr Club - Pedido #123456 Recebido!
- **Botão**: "Ver no Admin" → Redireciona para `/admin?tab=pedidos`

## 🎨 Visual do Email

O email terá:

- ✅ Logo circular no topo
- ✅ Badge verde "Pagamento Confirmado"
- ✅ Título: "O seu pedido está a caminho! ⚡"
- ✅ Card cinza claro com os itens
- ✅ Botão preto arredondado
- ✅ Link do WhatsApp: +55 13 99689-0611
- ✅ Rodapé: "BORA CORRER CLUB • PERFORMANCE & ESTILO"

## 🐛 Troubleshooting

### Email não chegou?

1. **Verifique o spam/lixo eletrônico**
2. **Verifique os logs da função**:

   ```bash
   supabase functions logs send-order-email --project-ref tdzdureusnszdzvsoomr
   ```

3. **Verifique se o Resend está configurado**:
   - Acesse: https://resend.com/emails
   - Verifique se o domínio está verificado
   - Confirme que a API key está ativa

### Email chegou mas o design está quebrado?

- Alguns clientes de email (como Outlook antigo) podem não suportar todos os estilos
- O template foi otimizado para Gmail, Apple Mail e Outlook moderno

### Botão não redireciona corretamente?

- Verifique se as URLs estão corretas no código
- Cliente: `https://www.boracorrerclub.com.br/perfil?tab=pedidos`
- Admin: `https://www.boracorrerclub.com.br/admin?tab=pedidos`

## 📝 Próximos Passos

1. **Teste o email** usando uma das opções acima
2. **Verifique o design** em diferentes clientes de email
3. **Confirme os redirecionamentos** clicando nos botões
4. **Ajuste conforme necessário** editando `supabase/functions/send-order-email/index.ts`

## 🔄 Atualizando o Template

Se precisar fazer alterações:

1. Edite o arquivo: `supabase/functions/send-order-email/index.ts`
2. Faça o deploy novamente:
   ```bash
   supabase functions deploy send-order-email
   ```

## 📞 Suporte

Dúvidas? Entre em contato via WhatsApp: +55 13 99689-0611

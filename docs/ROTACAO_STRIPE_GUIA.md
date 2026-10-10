# 🔑 Guia Passo a Passo - Rotação da Chave Stripe

**IMPORTANTE:** Este processo leva cerca de 10-15 minutos e é CRÍTICO para a segurança.

---

## 📋 Checklist Rápido

- [ ] Passo 1: Abrir Stripe Dashboard
- [ ] Passo 2: Revogar chave antiga
- [ ] Passo 3: Gerar nova chave
- [ ] Passo 4: Configurar no Supabase
- [ ] Passo 5: Testar pagamentos
- [ ] Passo 6: Atualizar webhooks (se necessário)

---

## 🚀 PASSO 1: Acessar Stripe Dashboard

1. **Abrir navegador** e ir para: https://dashboard.stripe.com/login

2. **Fazer login** com suas credenciais

3. **Ir para API Keys:**
   - Clicar em "Developers" no menu superior
   - Clicar em "API keys" no menu lateral

4. **Localizar a seção "Secret keys"**
   - Você verá uma lista de chaves
   - Procure pela chave que começa com: `sk_live_51S2MCX...`

---

## 🗑️ PASSO 2: Revogar Chave Antiga

⚠️ **ATENÇÃO:** Faça backup da chave antiga antes de revogar (caso precise reverter)

1. Na lista de "Secret keys", encontre a chave antiga

2. **Clicar nos 3 pontinhos (⋮)** ao lado da chave

3. **Selecionar "Delete"**

4. **Confirmar a deleção**
   - Stripe vai pedir confirmação
   - Digite o nome da chave ou confirme
   - Clique em "Delete key"

✅ **Chave antiga revogada!** Qualquer requisição com essa chave falhará agora.

---

## 🔐 PASSO 3: Gerar Nova Chave

1. **Clicar no botão "+ Create secret key"** (ou similar)

2. **Dar um nome descritivo:**
   - Sugestão: `Bora Correr Club - Production`
   - Data: `2026-02-05`

3. **Clicar em "Create"**

4. **COPIAR A CHAVE IMEDIATAMENTE** 📋
   - Ela começa com `sk_live_...`
   - Stripe só mostra UMA VEZ
   - Se perder, terá que criar outra

   **Cole aqui temporariamente (depois apague):**

   ```
   sk_live_[COLE AQUI A NOVA CHAVE]
   ```

5. **Salvar em local seguro:**
   - Gerenciador de senhas
   - Ou anote em papel (temporário)

---

## ⚙️ PASSO 4: Configurar no Supabase Dashboard

1. **Abrir nova aba** e ir para: https://supabase.com/dashboard

2. **Selecionar seu projeto:**
   - Nome: boracorrerclub
   - ID: tdzdureusnszdzvsoomr

3. **Ir para Settings:**
   - Menu lateral esquerdo
   - Clicar em "Settings" (ícone de engrenagem)

4. **Ir para Edge Functions:**
   - Submenu: "Edge Functions"
   - Ou: Settings > Edge Functions > Secrets

5. **Atualizar a variável:**
   - Encontrar: `STRIPE_SECRET_KEY`
   - Clicar em "Edit" ou "Update"
   - Colar a NOVA chave copiada do Stripe
   - Salvar

6. **Verificar outras variáveis necessárias:**
   ```
   ✓ STRIPE_SECRET_KEY = sk_live_... (nova)
   ✓ STRIPE_WEBHOOK_SECRET = whsec_... (não mudar)
   ✓ SUPABASE_URL = https://...
   ✓ SUPABASE_SERVICE_ROLE_KEY = ...
   ✓ SUPABASE_ANON_KEY = ...
   ```

---

## 🧪 PASSO 5: Testar Pagamentos

### Teste 1: Verificar se funções estão rodando

```bash
# No terminal PowerShell, executar:
curl https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/create-stripe-subscription
```

Se retornar erro de autenticação (401), está funcionando! ✅

### Teste 2: Compra de Teste no Site

1. **Abrir seu site:** https://boracorrerclub.com (ou domínio configurado)

2. **Tentar comprar um plano de teste:**
   - Ir para a página inicial
   - Clicar em "Plano Teste" (R$ 9,97)
   - Fazer login
   - Ir até o checkout

3. **Usar cartão de teste do Stripe:**

   ```
   Número: 4242 4242 4242 4242
   Data: Qualquer data futura (ex: 12/28)
   CVC: Qualquer 3 números (ex: 123)
   CEP: Qualquer (ex: 12345)
   ```

4. **Confirmar pagamento**
   - Deve redirecionar para página de sucesso
   - Se falhar, veja logs no passo 6

### Teste 3: Compra de Produto

1. **Ir para /roupas**

2. **Adicionar produto ao carrinho**

3. **Finalizar compra**

4. **Usar mesmo cartão de teste**

5. **Verificar se completa**

---

## 🔍 PASSO 6: Verificar Logs (Se houver erro)

### No Supabase Dashboard:

1. **Ir para Functions:**
   - Menu lateral > Edge Functions

2. **Clicar em `create-stripe-subscription`**

3. **Ver aba "Logs"**
   - Procurar por erros relacionados a "API key"
   - Se ver "Invalid API Key", a nova chave não foi configurada corretamente

### No Stripe Dashboard:

1. **Ir para Developers > Logs**

2. **Ver requisições recentes**
   - Deve mostrar tentativas com a nova chave
   - Status 200 = sucesso ✅
   - Status 401 = chave inválida ❌

---

## 🔔 PASSO 7: Atualizar Webhooks (Verificação)

**Provavelmente não é necessário**, mas verifique:

1. **No Stripe Dashboard:**
   - Developers > Webhooks

2. **Verificar endpoint:**
   - URL: `https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/stripe-webhook`
   - Status: "Enabled" ✅

3. **Se não existir, criar:**
   - Clicar em "+ Add endpoint"
   - URL: (a URL acima)
   - Eventos para escutar:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Copiar "Signing secret":**
   - Começa com `whsec_...`
   - Adicionar no Supabase como `STRIPE_WEBHOOK_SECRET`

---

## ✅ Confirmação Final

Marque cada item após testar:

- [ ] ✅ Compra de plano funcionou
- [ ] ✅ Compra de produto funcionou
- [ ] ✅ Nenhum erro nos logs
- [ ] ✅ Webhooks do Stripe configurados
- [ ] ✅ Chave antiga não está mais no código
- [ ] ✅ Nova chave salva em local seguro

---

## 🆘 Se Algo Der Errado

### Erro: "Invalid API Key"

**Solução:**

1. Verificar se copiou a chave completa (começa com `sk_live_`)
2. Verificar se não tem espaços extras
3. Re-deploy das funções: `npx supabase functions deploy --all`

### Erro: "No such customer"

**Solução:**

1. Limpar cache do navegador
2. Fazer novo login no site
3. Tentar novamente

### Erro: "Webhook signature verification failed"

**Solução:**

1. Copiar novo `STRIPE_WEBHOOK_SECRET` do Stripe
2. Atualizar no Supabase Dashboard
3. Re-deploy da função webhook

### Em Último Caso - Reverter

Se nada funcionar:

1. Criar nova chave no Stripe
2. Repetir processo desde o PASSO 3

---

## 📞 Suporte

**Stripe:**

- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com

**Supabase:**

- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

---

## 🎉 Após Concluir

**Ações de limpeza:**

1. **Remover chave deste arquivo:**
   - Apagar onde você colou temporariamente
   - Salvar o arquivo

2. **Limpar histórico:**

   ```bash
   # Limpar histórico do terminal
   Clear-History
   ```

3. **Documentar:**
   - Anotar data da rotação: 05/02/2026
   - Próxima rotação: 05/05/2026 (a cada 3 meses)

---

**Tempo estimado:** 10-15 minutos  
**Última atualização:** 05/02/2026  
**Próxima revisão:** 05/05/2026

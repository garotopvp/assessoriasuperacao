# 🚀 GUIA DE DEPLOY - BORA CORRER CLUB

## ⚡ Deploy Rápido

### 1. Instale as Dependências

```bash
npm install
```

### 2. Configure as Variáveis de Ambiente

Crie `.env.local`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_SENTRY_DSN=sua-dsn-sentry
SENTRY_ORG=sua-org
SENTRY_PROJECT=boracorrerclub
SENTRY_AUTH_TOKEN=seu-token
```

### 3. Deploy das Edge Functions

```bash
# Login no Supabase
npx supabase login

# Link do projeto
npx supabase link --project-ref seu-projeto-id

# Deploy de todas as funções
npx supabase functions deploy validate-cpf
npx supabase functions deploy send-email
npx supabase functions deploy delete-account
npx supabase functions deploy sentry-webhook-handler
```

### 4. Configure os Secrets

No painel do Supabase (Settings > Edge Functions > Secrets):

```bash
GITHUB_TOKEN=ghp_...
GEMINI_API_KEY=AIza...
RESEND_API_KEY=re_...
```

### 5. Deploy no Vercel

```bash
# Via Vercel CLI
npm i -g vercel
vercel

# Ou via GitHub (push para main)
git push origin main
```

---

## 📋 Checklist Pré-Deploy

### Banco de Dados

- [ ] Migrações executadas (`npx supabase db push`)
- [ ] RLS policies ativadas em todas as tabelas
- [ ] Indices criados para queries principais

### Edge Functions

- [ ] Todas as 4 funções deployadas
- [ ] Secrets configurados (GITHUB_TOKEN, GEMINI_API_KEY, RESEND_API_KEY)
- [ ] Testadas via Supabase dashboard

### Frontend

- [ ] Build de produção funcional (`npm run build`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Source maps do Sentry funcionando

### Webhooks

- [ ] Webhook do Sentry configurado (apontando para Edge Function)
- [ ] Webhooks dos gateways de pagamento configurados

### Domínio

- [ ] DNS configurado
- [ ] SSL ativo (HTTPS)
- [ ] Redirect de www para apex (ou vice-versa)

---

## 🔧 Configuração dos Webhooks

### Sentry

1. Vá em **Settings > Integrations > Internal Integrations**
2. Crie uma nova integração
3. Configure webhook para: `https://seu-projeto.supabase.co/functions/v1/sentry-webhook-handler`
4. Marque eventos: **Issue** e **Error**

### Stripe

1. **Dashboard > Developers > Webhooks**
2. Add endpoint: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
3. Eventos: `payment_intent.succeeded`, `customer.subscription.updated`

### OpenPix

1. **API > Webhooks**
2. URL: `https://seu-projeto.supabase.co/functions/v1/openpix-webhook`
3. Eventos: `OPENPIX:CHARGE_COMPLETED`

---

## 📊 Monitoramento

### Sentry

- URL: https://sentry.io/organizations/sua-org/projects/boracorrerclub/
- Verifica erros em tempo real
- Source maps carregados automaticamente

### Supabase

- Logs das Edge Functions: **Edge Functions > Logs**
- Métricas do banco: **Database > Performance**
- Auth logs: **Authentication > Logs**

### Vercel

- Analytics: Dashboard do projeto > Analytics
- Speed Insights: Automaticamente ativo
- Logs: Dashboard > Logs

---

## 🐛 Troubleshooting

### Edge Functions não funcionam

```bash
# Ver logs
npx supabase functions logs validate-cpf --tail

# Redeploy
npx supabase functions deploy validate-cpf --debug
```

### Build falhando

```bash
# Limpar cache
rm -rf node_modules .next dist
npm install
npm run build
```

### Erros de TypeScript

```bash
# Verificar tipos
npx tsc --noEmit

# Atualizar tipos do Supabase
npx supabase gen types typescript --project-id seu-projeto-id > src/integrations/supabase/types.ts
```

---

## 🔄 CI/CD

### GitHub Actions (já configurado)

**Auto-merge Workflow** (`.github/workflows/auto-merge.yml`):

- Testa PRs de correções automáticas
- Merge automático se testes passarem

**Deploy Workflow** (manual):

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

---

## 📈 Performance

### Otimizações Implementadas

- ✅ Lazy loading de rotas
- ✅ Lazy loading de imagens (OptimizedImage)
- ✅ WebP support
- ✅ Code splitting automático (Vite)
- ✅ Tree shaking
- ✅ Minificação
- ✅ Gzip/Brotli compression (Vercel)

### Lighthouse Score Esperado

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

---

## 🔐 Segurança

### Checklist de Segurança

- [x] HTTPS obrigatório
- [x] RLS ativo em todas as tabelas
- [x] Rate limiting nas Edge Functions
- [x] Validação de inputs (Zod)
- [x] 2FA disponível
- [x] Secrets em variáveis de ambiente
- [x] CORS configurado
- [x] CSP headers (via Vercel)

### Variáveis de Ambiente Sensíveis

**NUNCA commitar:**

- API keys
- Tokens
- Database URLs
- Senhas

**Sempre usar:**

- `.env.local` (local)
- Vercel Environment Variables (produção)
- Supabase Secrets (Edge Functions)

---

## 📞 Suporte Pós-Deploy

### Monitoramento

1. Sentry: Erros frontend/backend
2. Vercel Analytics: Tráfego e performance
3. Supabase: Logs de auth e banco

### Contatos

- **Desenvolvedor**: github.com/seu-usuario
- **Suporte Técnico**: dev@boracorrerclub.com.br
- **Emergências**: WhatsApp +55 11 99999-9999

---

## ✅ Deploy Completo!

Após seguir todos os passos, seu sistema estará:

- ✅ 100% funcional
- ✅ Monitorado
- ✅ Seguro
- ✅ Escalável
- ✅ Pronto para produção

**Próximos passos:**

1. Testes de carga
2. Backup do banco de dados
3. Documentação para usuários
4. Treinamento da equipe

🎉 **BOA SORTE!** 🏃‍♂️🏃‍♀️

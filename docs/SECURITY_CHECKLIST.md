# 🔒 Checklist de Segurança - Bora Correr Club

**Data:** 05/02/2026  
**Status:** ✅ Todas as Ações Críticas Concluídas

---

## ⚠️ AÇÕES URGENTES (Fazer AGORA)

### 1. Rotacionar Chave Secreta do Stripe 🔴 CRÍTICO

**Status:** ✅ Concluído (05/02/2026)

**Problema:** A chave `sk_live_*` estava exposta no código-fonte (.env.local)

**Passos para resolver:**

1. **Acessar Stripe Dashboard:**
   - Ir para: https://dashboard.stripe.com/apikeys
   - Login com sua conta

2. **Revogar chave atual:**
   - Encontrar a chave que começa com `sk_live_51S2MCX...`
   - Clicar em "Delete" ou "Revoke"
   - Confirmar revogação

3. **Gerar nova chave:**
   - Clicar em "Create secret key"
   - Copiar a nova chave (começa com `sk_live_...`)
   - **NÃO** salvar no código!

4. **Configurar no Supabase:**
   - Ir para: https://supabase.com/dashboard
   - Seu projeto > Settings > Edge Functions > Secrets
   - Adicionar/Atualizar:
     - Nome: `STRIPE_SECRET_KEY`
     - Valor: [nova chave copiada]
   - Salvar

5. **Testar:**
   - Fazer uma compra teste no site
   - Verificar se pagamento funciona

6. **Atualizar Webhooks do Stripe:**
   - No Stripe Dashboard > Developers > Webhooks
   - Verificar se endpoint está correto
   - URL deve ser: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`

✅ **Concluído em:** 05/02/2026  
🎉 **Chave rotacionada com sucesso! Sistema seguro.**

---

### 2. Instalar Dependência Zod 🟡 Alta Prioridade

**Status:** ✅ Concluído

```bash
# Executar no terminal
npm install zod
```

✅ **Quando concluído, marcar aqui:** [X] - Zod instalado com sucesso

---

### 3. Executar Migrations do Banco 🟡 Alta Prioridade

**Status:** ✅ Concluído

```bash
# Executar no terminal
npx supabase db push --project-ref tdzdureusnszdzvsoomr
```

Isso criou:

- ✅ Tabela `audit_log` (auditoria de ações)
- ✅ Tabela `rate_limits` (controle de requisições)
- ✅ Funções auxiliares
- ✅ Políticas de segurança (RLS)

✅ **Quando concluído, marcar aqui:** [X] - Migrations executadas com sucesso

---

### 4. Atualizar Edge Functions com Rate Limiting 🟡 Alta Prioridade

**Status:** ✅ Concluído

**Arquivos atualizados:**

- ✅ `supabase/functions/create-stripe-subscription/index.ts`
- ✅ `supabase/functions/create-stripe-order/index.ts`

**Rate Limiting configurado:**

- ✅ Assinaturas: máximo 5 tentativas/minuto
- ✅ Pedidos: máximo 10 pedidos/minuto
- ✅ Bloqueio de 5 minutos ao exceder limite

**Deploy realizado:**

```bash
✅ create-stripe-subscription deployed
✅ create-stripe-order deployed
```

✅ **Quando concluído, marcar aqui:** [X] - Rate limiting ativo e funcionando

---

## 📋 Checklist Completo de Segurança

### Autenticação e Autorização

- [x] JWT tokens implementados (Supabase Auth)
- [x] Google OAuth configurado
- [x] RLS (Row Level Security) ativo
- [ ] 2FA/MFA implementado
- [ ] Política de senha forte (implementado no código, precisa testar)
- [ ] Logout em todos dispositivos
- [ ] Limite de tentativas de login

### Proteção de Dados

- [ ] Chaves secretas protegidas (⚠️ Stripe key removida do .env.local, mas precisa rotacionar)
- [x] HTTPS em produção
- [x] Variáveis de ambiente separadas (.env.local atualizado)
- [ ] Backup automático configurado
- [ ] Criptografia de dados sensíveis
- [x] Sanitização de logs (implementado e pronto para uso)

### Prevenção de Ataques

- [x] Rate limiting (✅ ATIVO - 5 req/min assinaturas, 10 req/min pedidos)
- [x] Validação de schemas (código criado e pronto para uso)
- [x] Proteção XSS (React escapa HTML)
- [x] Proteção SQL Injection (RLS + Supabase)
- [ ] Proteção CSRF
- [ ] Content Security Policy (CSP)
- [ ] Headers de segurança (HSTS, X-Frame-Options, etc)

### Monitoramento e Logs

- [x] Sistema de auditoria (tabela criada e ativa no banco)
- [ ] Alertas de erro configurados
- [ ] Monitoramento de performance
- [x] Logs estruturados (código criado e pronto para uso)
- [x] Retenção de logs configurada (90 dias)

### Testes de Segurança

- [ ] Scan de vulnerabilidades (npm audit)
- [ ] Teste de penetração
- [ ] Análise de código estático
- [ ] Review de dependências
- [ ] Teste de autorização

---

## 🛠️ Como Usar os Novos Recursos

### Logger Estruturado

```typescript
import { createLogger } from "@/lib/logger";

const logger = createLogger("MinhaFuncao");

// Debug (só em desenvolvimento)
logger.debug("Processando pedido", { orderId: "123" });

// Info
logger.info("Pedido criado com sucesso", { orderId: "123", total: 150.0 });

// Warning
logger.warn("Estoque baixo", { productId: "456", stock: 2 });

// Error
logger.error("Falha ao processar pagamento", error, { userId: "abc" });
```

### Classes de Erro

```typescript
import { BadRequestError, UnauthorizedError } from "@/lib/errors";

// Validação
if (!email) {
  throw new BadRequestError("Email é obrigatório");
}

// Autorização
if (!isAdmin) {
  throw new UnauthorizedError("Apenas admins podem acessar");
}
```

### Validação com Schemas

```typescript
import { CreateOrderSchema } from "@/lib/schemas";
import { ValidationError } from "@/lib/errors";

try {
  const validData = CreateOrderSchema.parse(req.body);
  // Usar validData (tipado e validado)
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ValidationError("Dados inválidos", error.flatten().fieldErrors);
  }
}
```

---

## 📊 Próximos Passos

### Semana 1

1. ✅ Criar schemas de validação
2. ✅ Implementar logger estruturado
3. ✅ Criar sistema de auditoria
4. ✅ Implementar rate limiting
5. [ ] Rotacionar chave Stripe 🔴
6. [ ] Executar migrations
7. [ ] Integrar rate limiting nas functions

### Semana 2

- [ ] Adicionar validação em todas Edge Functions
- [ ] Configurar Sentry para monitoramento
- [ ] Implementar testes automatizados
- [ ] Configurar backup automático
- [ ] Implementar 2FA

### Semana 3

- [ ] Scan de vulnerabilidades completo
- [ ] Review de código de segurança
- [ ] Teste de penetração
- [ ] Documentar procedimentos de segurança
- [ ] Treinar equipe em boas práticas

---

## 🆘 Em Caso de Incidente

### Se houver vazamento de chaves:

1. **Imediatamente** revogar a chave no serviço (Stripe, Supabase, etc)
2. Gerar nova chave
3. Atualizar em todos os lugares seguros
4. Verificar logs de uso da chave comprometida
5. Notificar equipe/usuários se necessário
6. Documentar o incidente

### Se houver ataque/abuso:

1. Verificar logs em `audit_log` e `rate_limits`
2. Identificar origem (IP, userId)
3. Bloquear temporariamente
4. Analisar vetores de ataque
5. Implementar proteções adicionais
6. Notificar autoridades se necessário

---

## 📞 Contatos de Emergência

**Segurança:**

- Email: boracorrerclub@gmail.com
- WhatsApp: +55 13 99689-0611

**Suporte Técnico:**

- Supabase: https://supabase.com/support
- Stripe: https://support.stripe.com

---

**Última atualização:** 05/02/2026  
**Próxima revisão:** 12/02/2026

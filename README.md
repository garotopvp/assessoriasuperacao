# 🏃 Bora Correr Club

<div align="center">
  
  ### Plataforma completa para atletas de corrida
  
  [![Deploy Status](https://img.shields.io/badge/deploy-vercel-success)](https://boracorrerclub.vercel.app)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3+-61dafb.svg)](https://reactjs.org/)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
</div>

> ⚠️ **Atenção — Ambiente em Produção**
>
> Este repositório está atrelado a uma implantação em produção. Antes de alterar rotas, integrações de pagamento ou funções críticas, verifique o ambiente e comunique a equipe responsável. Mais contexto em [ASSISTANT_CONTEXT.md](ASSISTANT_CONTEXT.md).

---

## 📋 Sobre o Projeto

O **Bora Correr Club** é uma plataforma completa que conecta atletas de corrida a conteúdos exclusivos, consultoria especializada e produtos esportivos. Nossa missão é democratizar o acesso ao conhecimento sobre corrida e ajudar atletas de todos os níveis a alcançarem seus objetivos.

### ✨ Principais Funcionalidades

- 🎓 **Conteúdo Educacional**: Artigos, guias e vídeos sobre técnicas de corrida, treinos e nutrição
- 👟 **E-commerce**: Loja completa de roupas e acessórios para corredores
- 💼 **Consultoria**: Sessões personalizadas com especialistas
- 📊 **Planos de Assinatura**: Acesso a conteúdos premium e comunidade exclusiva
- 🔒 **Segurança**: Autenticação 2FA, criptografia e compliance com LGPD
- 🤖 **Auto-Correção de Bugs**: Sistema automatizado de detecção e correção de erros com IA

---

## 🚀 Tecnologias

### Frontend

- **React 18.3** + **TypeScript 5.8**
- **Vite** - Build tool ultra-rápido
- **TailwindCSS** + **shadcn/ui** - Design system
- **React Router** - Roteamento
- **Tanstack Query** - Gerenciamento de estado assíncrono
- **Zod** - Validação de dados
- **Sentry** - Monitoramento de erros

### Backend

- **Supabase**
  - PostgreSQL (Banco de dados)
  - Auth (Autenticação + MFA/2FA)
  - Edge Functions (Deno)
  - Row Level Security (RLS)
  - Storage
- **Resend** - Envio de emails transacionais

### Pagamentos

- **Stripe** - Cartão de crédito e assinaturas recorrentes
- **OpenPix** - PIX instantâneo
- **InfinitePay** - PIX
- **Abacate Pay** - PIX

### DevOps & Monitoramento

- **Vercel** - Deploy e hosting
- **GitHub Actions** - CI/CD
- **Sentry** - Error tracking e performance monitoring
- **Vercel Speed Insights** - Análise de performance

### Automação

- **Gemini AI** - Geração de correções de código
- **GitHub API** - Criação automática de Pull Requests
- Sistema de auto-correção de bugs (Sentry → Supabase → Gemini → GitHub)

---

## 🛠️ Instalação e Configuração

### Pré-requisitos

- **Node.js** 18+ e npm
- **Conta no Supabase** (gratuita)
- **Conta no Vercel** (gratuita)
- **Contas nos gateways de pagamento** (opcional, para funcionalidades de pagamento)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/boracorrerclub.git
cd boracorrerclub
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica

# Sentry (opcional, mas recomendado)
VITE_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=sua-org
SENTRY_PROJECT=boracorrerclub
SENTRY_AUTH_TOKEN=seu-token

# Stripe (opcional)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Outros (configurar conforme necessário)
VITE_RESEND_API_KEY=re_...
```

**Importante:** Nunca commite o arquivo `.env.local`. Ele já está no `.gitignore`.

### 4. Configure o Supabase

#### 4.1. Execute as Migrações

```bash
npx supabase db push
```

#### 4.2. Configure as Edge Functions

```bash
# Login no Supabase
npx supabase login

# Link do projeto
npx supabase link --project-ref seu-projeto-id

# Deploy das funções
npx supabase functions deploy
```

#### 4.3. Configure os Secrets das Edge Functions

No painel do Supabase (Settings > Edge Functions > Secrets), adicione:

- `GITHUB_TOKEN` - Para criação de PRs automáticos
- `GEMINI_API_KEY` - Para auto-correção de bugs com IA
- `STRIPE_SECRET_KEY` - Para pagamentos
- `RESEND_API_KEY` - Para emails

### 5. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

O site estará disponível em `http://localhost:5173`

---

## 📦 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build de produção
npm run test         # Executa testes com Vitest
npm run test:watch   # Executa testes em modo watch
npm run lint         # Verifica código com ESLint
```

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────┐
│   Frontend  │  React + Vite + TypeScript
│  (Vercel)   │
└──────┬──────┘
       │
       │ API Calls
       │
┌──────▼──────┐
│  Supabase   │
│   Backend   │
├─────────────┤
│ PostgreSQL  │  Banco de Dados + RLS
│ Auth + MFA  │  Autenticação com 2FA
│ Storage     │  Armazenamento de arquivos
│Edge Functions│ Serverless Functions (Deno)
└──────┬──────┘
       │
       │ Webhooks
       │
┌──────▼──────┐
│  Gateways   │
│ de Pagamento│  Stripe, OpenPix, InfinitePay
└─────────────┘

┌──────────────────────────────────────┐
│     Sistema de Auto-Correção         │
│                                      │
│  Sentry → Supabase Edge Function    │
│     ↓                                │
│  Gemini AI (análise do erro)        │
│     ↓                                │
│  GitHub API (cria PR com correção)  │
│     ↓                                │
│  GitHub Actions (testa e merge)     │
│     ↓                                │
│  Vercel (deploy automático)         │
└──────────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ **Autenticação 2FA/MFA** via Supabase Auth
- ✅ **Row Level Security (RLS)** em todas as tabelas
- ✅ **Rate Limiting** em todas as Edge Functions
- ✅ **Audit Log** para rastreamento de ações
- ✅ **Validação de dados** com Zod
- ✅ **Criptografia de senhas** (bcrypt)
- ✅ **HTTPS** em todas as comunicações
- ✅ **Compliance LGPD** com políticas de privacidade e termos de uso

---

## 📄 Estrutura de Pastas

```
boracorrerclub/
├── src/
│   ├── components/     # Componentes React reutilizáveis
│   │   ├── admin/      # Componentes do painel admin
│   │   ├── auth/       # Autenticação e guards
│   │   ├── checkout/   # Fluxo de pagamento
│   │   ├── common/     # Componentes comuns
│   │   └── ui/         # Componentes da UI (shadcn)
│   ├── contexts/       # Contextos React (Auth, Cart)
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Integrações externas (Supabase)
│   ├── lib/            # Utilitários e helpers
│   ├── pages/          # Páginas/Rotas
│   ├── test/           # Arquivos de teste
│   └── types/          # Definições de tipos TypeScript
├── supabase/
│   ├── functions/      # Edge Functions (Deno)
│   └── migrations/     # Migrações do banco de dados
├── public/             # Assets estáticos
├── scripts/            # Scripts utilitários
│   └── database/       # SQL files e migrações
└── docs/               # Documentação
```

---

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes E2E com Playwright
npx playwright test

# Ver relatório de testes E2E
npx playwright show-report
```

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. O deploy automático acontecerá a cada push na branch `main`

### Manual

```bash
npm run build
# Os arquivos estarão em dist/
```

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

## 📧 Contato

**Bora Correr Club**  
Email: contato@boracorrerclub.com.br  
Website: [https://boracorrerclub.com.br](https://boracorrerclub.com.br)

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend incrível
- [Vercel](https://vercel.com) - Plataforma de deploy
- [shadcn/ui](https://ui.shadcn.com) - Componentes de UI
- [Sentry](https://sentry.io) - Monitoramento de erros
- Toda a comunidade de corredores que torna este projeto possível! 🏃‍♂️🏃‍♀️
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

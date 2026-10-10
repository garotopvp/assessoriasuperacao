# 📋 Documentação Completa - Bora Correr Club

**Data de Criação:** 05/02/2026  
**Versão:** 1.0  
**Status:** Produção

---

## 📑 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Fluxogramas do Sistema](#3-fluxogramas-do-sistema)
4. [Funcionalidades Principais](#4-funcionalidades-principais)
5. [Sistema de Pagamentos](#5-sistema-de-pagamentos)
6. [Autenticação e Autorização](#6-autenticação-e-autorização)
7. [Análise de Segurança](#7-análise-de-segurança)
8. [Vulnerabilidades Conhecidas](#8-vulnerabilidades-conhecidas)
9. [Melhorias Sugeridas](#9-melhorias-sugeridas)
10. [Guia para Novos Desenvolvedores](#10-guia-para-novos-desenvolvedores)

---

## 1. Visão Geral do Sistema

### 1.1 Objetivo

O **Bora Correr Club** é uma plataforma de assessoria esportiva de corrida que oferece:

- Planos de assinatura (mensal, trimestral, semestral, anual)
- Venda de produtos esportivos (roupas, bonés, acessórios)
- Consultoria especializada
- Conteúdo educacional sobre corrida

### 1.2 Tecnologias Principais

```
Frontend:
- React 18 (TypeScript)
- Vite (Build tool)
- TailwindCSS + shadcn/ui (UI)
- React Router v6 (Navegação)
- React Query (Cache/Estado)

Backend:
- Supabase (BaaS)
  - PostgreSQL (Database)
  - Edge Functions (Deno/TypeScript)
  - Auth (Autenticação)
  - Storage (Arquivos)

Pagamentos:
- Stripe (Cartão de Crédito)
- OpenPix (PIX - não implementado totalmente)
- Abacate Pay (PIX - backup)

Infraestrutura:
- Vercel (Deploy Frontend)
- Supabase Cloud (Backend)
```

### 1.3 Estrutura de Pastas

```
boracorrerclub/
├── src/                          # Código fonte frontend
│   ├── components/              # Componentes React
│   │   ├── admin/              # Painel administrativo
│   │   ├── auth/               # Guards e componentes de autenticação
│   │   ├── checkout/           # Fluxo de pagamento
│   │   ├── common/             # Componentes reutilizáveis
│   │   ├── home/               # Seções da home
│   │   ├── layout/             # Header, Footer, etc
│   │   └── shop/               # Loja de produtos
│   ├── contexts/               # Context API (Auth, Cart)
│   ├── hooks/                  # Hooks customizados
│   ├── pages/                  # Páginas da aplicação
│   ├── lib/                    # Utilitários
│   └── types/                  # TypeScript types
├── supabase/
│   ├── functions/              # Edge Functions (Serverless)
│   │   ├── create-stripe-subscription/
│   │   ├── create-stripe-order/
│   │   ├── stripe-webhook/
│   │   └── [29 outras functions]
│   └── migrations/             # Migrations do banco
├── public/                      # Assets estáticos
└── docs/                        # Documentação adicional
```

---

## 2. Arquitetura Técnica

### 2.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                               │
│                  (Navegador Web)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  - Vite + TypeScript                                         │
│  - React Router (Navegação)                                  │
│  - React Query (Cache)                                       │
│  - shadcn/ui (Componentes)                                   │
│  Hospedado: Vercel                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 SUPABASE (Backend)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                  │   │
│  │  - Tabela: users (usuários)                          │   │
│  │  - Tabela: subscriptions (assinaturas)              │   │
│  │  - Tabela: products (produtos)                       │   │
│  │  - Tabela: orders (pedidos)                          │   │
│  │  - RLS Policies (Segurança)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth (Autenticação)                                  │   │
│  │  - Email/Password                                     │   │
│  │  - Google OAuth                                       │   │
│  │  - JWT Tokens                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Edge Functions (Serverless Deno)                    │   │
│  │  - create-stripe-subscription                        │   │
│  │  - create-stripe-order                               │   │
│  │  - stripe-webhook                                     │   │
│  │  - + 29 outras funções                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Storage (Arquivos)                                   │   │
│  │  - Imagens de produtos                               │   │
│  │  - Hero images                                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               STRIPE (Pagamentos)                            │
│  - Checkout Sessions                                         │
│  - Webhooks (eventos de pagamento)                           │
│  - Customer Portal (gerenciar assinatura)                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Fluxo de Dados

```
1. Usuário acessa o site (Vercel serve o React)
2. React carrega e inicializa AuthContext
3. Supabase Auth verifica sessão (JWT)
4. Se autenticado, busca dados do usuário
5. Usuário navega e interage com o site
6. Ações críticas chamam Edge Functions
7. Edge Functions processam e retornam dados
8. React atualiza UI baseado na resposta
```

---

## 3. Fluxogramas do Sistema

### 3.1 Fluxo de Registro/Login

```
┌──────────────┐
│  Usuário     │
│  Visita Site │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Clica "Login"   │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────────┐
│  Escolhe método:             │
│  1. Email/Senha              │
│  2. Google OAuth             │
└──────┬───────────────────────┘
       │
       ├─── Opção 1 (Email/Senha) ───────┐
       │                                  │
       │   ┌──────────────────────────┐  │
       │   │ Preenche formulário      │  │
       │   └──────┬───────────────────┘  │
       │          │                       │
       │          ▼                       │
       │   ┌──────────────────────────┐  │
       │   │ signIn() ou signUp()     │  │
       │   │ (AuthContext)            │  │
       │   └──────┬───────────────────┘  │
       │          │                       │
       │          ▼                       │
       │   ┌──────────────────────────┐  │
       │   │ Supabase Auth            │  │
       │   │ - Valida credenciais     │  │
       │   │ - Cria sessão JWT        │  │
       │   └──────┬───────────────────┘  │
       │          │                       │
       └──────────┼───────────────────────┘
                  │
       ┌──────────┴─── Opção 2 (Google) ───┐
       │                                     │
       │   ┌──────────────────────────┐     │
       │   │ Redireciona para Google  │     │
       │   └──────┬───────────────────┘     │
       │          │                          │
       │          ▼                          │
       │   ┌──────────────────────────┐     │
       │   │ Usuário autentica        │     │
       │   └──────┬───────────────────┘     │
       │          │                          │
       │          ▼                          │
       │   ┌──────────────────────────┐     │
       │   │ Callback para site       │     │
       │   └──────┬───────────────────┘     │
       │          │                          │
       │          ▼                          │
       │   ┌──────────────────────────┐     │
       │   │ Supabase cria sessão     │     │
       │   └──────┬───────────────────┘     │
       │          │                          │
       └──────────┼──────────────────────────┘
                  │
                  ▼
       ┌──────────────────────────┐
       │ Sessão estabelecida      │
       │ JWT armazenado           │
       └──────┬───────────────────┘
              │
              ▼
       ┌──────────────────────────┐
       │ Redireciona para:        │
       │ - /perfil (usuário)      │
       │ - /admin (admin)         │
       └──────────────────────────┘
```

### 3.2 Fluxo de Compra de Plano (Assinatura)

```
┌────────────────┐
│ Usuário na     │
│ Home ("/")     │
└────┬───────────┘
     │
     ▼
┌────────────────────────┐
│ Visualiza planos       │
│ (mensal, trimestral,   │
│ semestral, anual)      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Clica "Assinar"        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐      ┌─────────────────┐
│ Está logado?           │──Não─▶│ Redireciona     │
└────┬───────────────────┘      │ para /login     │
     │ Sim                       └─────────────────┘
     ▼
┌────────────────────────┐
│ Redireciona para       │
│ /escolher-pagamento    │
│ ?planId=XXX            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Seleciona método:      │
│ 1. Cartão (Stripe)     │
│ 2. PIX (não funcional) │
└────┬───────────────────┘
     │
     ▼ (Cartão)
┌────────────────────────┐
│ Chama Edge Function:   │
│ create-stripe-         │
│ subscription           │
│                        │
│ Body:                  │
│ - planId               │
│ - userId               │
│ - includeStripeFee     │
│ - cancelUrl            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Edge Function processa:        │
│ 1. Valida JWT                  │
│ 2. Busca dados do plano        │
│ 3. Calcula valor + taxa Stripe │
│ 4. Cria Price no Stripe        │
│ 5. Cria Checkout Session       │
│ 6. Salva metadados no DB       │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ Retorna checkout URL   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Redireciona usuário    │
│ para Stripe Checkout   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Usuário preenche       │
│ dados do cartão        │
│ no Stripe              │
└────┬───────────────────┘
     │
     ├─── Pagamento aprovado ───┐
     │                           │
     │   ┌───────────────────┐  │
     │   │ Stripe envia      │  │
     │   │ webhook           │  │
     │   └───┬───────────────┘  │
     │       │                   │
     │       ▼                   │
     │   ┌───────────────────┐  │
     │   │ stripe-webhook    │  │
     │   │ Edge Function     │  │
     │   │ - Valida evento   │  │
     │   │ - Atualiza DB     │  │
     │   │ - Ativa assinatura│  │
     │   └───┬───────────────┘  │
     │       │                   │
     │       ▼                   │
     │   ┌───────────────────┐  │
     │   │ Redireciona para  │  │
     │   │ /sucesso          │  │
     │   └───────────────────┘  │
     │                           │
     └─── Cancelou ─────────────┤
                                 │
         ┌───────────────────┐  │
         │ Redireciona para  │  │
         │ cancelUrl         │  │
         │ (página anterior) │  │
         └───────────────────┘  │
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Fim do fluxo  │
                         └───────────────┘
```

### 3.3 Fluxo de Compra de Produto

```
┌────────────────┐
│ Usuário em     │
│ /roupas        │
└────┬───────────┘
     │
     ▼
┌────────────────────────┐
│ Visualiza produtos     │
│ (cards com tamanhos)   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Seleciona tamanho      │
│ (P, M, G, GG, ÚNICO)   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Adiciona ao carrinho   │
│ (CartContext)          │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Clica no ícone         │
│ do carrinho            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Abre CheckoutModal     │
│ - Lista itens          │
│ - Mostra total         │
│ - Opção de frete       │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Clica "Finalizar"      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐      ┌─────────────────┐
│ Está logado?           │──Não─▶│ Redireciona     │
└────┬───────────────────┘      │ para /login     │
     │ Sim                       └─────────────────┘
     ▼
┌────────────────────────┐
│ Redireciona para       │
│ /escolher-pagamento-   │
│ produto                │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Chama Edge Function:   │
│ create-stripe-order    │
│                        │
│ Body:                  │
│ - items[]              │
│ - userId               │
│ - customer info        │
│ - includeStripeFee     │
│ - cancelUrl            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Edge Function processa:        │
│ 1. Valida JWT                  │
│ 2. Calcula total dos itens     │
│ 3. Adiciona taxa Stripe        │
│ 4. Cria line_items p/ Stripe   │
│ 5. Cria Checkout Session       │
│ 6. Salva pedido no DB          │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────┐
│ Redireciona para       │
│ Stripe Checkout        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Usuário paga           │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Webhook atualiza       │
│ status do pedido       │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Redireciona /sucesso   │
│ Carrinho limpo         │
└────────────────────────┘
```

### 3.4 Fluxo de Acesso ao Painel Admin

```
┌────────────────┐
│ Admin acessa   │
│ /admin/login   │
└────┬───────────┘
     │
     ▼
┌────────────────────────┐
│ Faz login com          │
│ email/senha admin      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Supabase Auth valida   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ useAuth hook verifica  │
│ role do usuário no DB  │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐      ┌─────────────────┐
│ role === 'admin'?      │──Não─▶│ Mostra erro     │
└────┬───────────────────┘      │ "Acesso negado" │
     │ Sim                       └─────────────────┘
     ▼
┌────────────────────────┐
│ Redireciona /admin     │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ Painel Admin:          │
│ - Gerenciar usuários   │
│ - Ver assinaturas      │
│ - CRUD produtos        │
│ - Upload imagens       │
│ - Relatórios           │
└────────────────────────┘
```

---

## 4. Funcionalidades Principais

### 4.1 Para Usuários (Clientes)

| Funcionalidade            | Rota                          | Status         | Descrição                                  |
| ------------------------- | ----------------------------- | -------------- | ------------------------------------------ |
| **Home**                  | `/`                           | ✅ Funcionando | Landing page com hero, planos, depoimentos |
| **Consultoria**           | `/consultoria`                | ✅ Funcionando | Página sobre serviços de consultoria       |
| **Conhecimento**          | `/conhecimento`               | ✅ Funcionando | Blog/artigos sobre corrida                 |
| **Artigo**                | `/conhecimento/:id`           | ✅ Funcionando | Visualizar artigo específico               |
| **Roupas**                | `/roupas`                     | ✅ Funcionando | Catálogo de produtos esportivos            |
| **Produto**               | `/produto/:id`                | ✅ Funcionando | Detalhes do produto + compra               |
| **Login**                 | `/login`                      | ✅ Funcionando | Login/Registro (email ou Google)           |
| **Perfil**                | `/perfil`                     | ✅ Funcionando | Dados do usuário (protegido)               |
| **Minha Assinatura**      | `/minha-assinatura`           | ✅ Funcionando | Gerenciar plano ativo                      |
| **Escolher Pagamento**    | `/escolher-pagamento`         | ✅ Funcionando | Selecionar método de pagamento (plano)     |
| **Escolher Pag. Produto** | `/escolher-pagamento-produto` | ✅ Funcionando | Selecionar método de pagamento (produto)   |
| **Sucesso**               | `/sucesso`                    | ✅ Funcionando | Confirmação de compra                      |
| **Sobre**                 | `/sobre`                      | ✅ Funcionando | Sobre o Bora Correr Club                   |

### 4.2 Para Administradores

| Funcionalidade         | Rota           | Status         | Descrição                         |
| ---------------------- | -------------- | -------------- | --------------------------------- |
| **Login Admin**        | `/admin/login` | ✅ Funcionando | Login exclusivo para admins       |
| **Painel Admin**       | `/admin`       | ✅ Funcionando | Dashboard administrativo          |
| **Gerenciar Usuários** | `/admin` (aba) | ✅ Funcionando | Ver/editar usuários e assinaturas |
| **Gerenciar Produtos** | `/admin` (aba) | ✅ Funcionando | CRUD de produtos                  |
| **Upload de Imagens**  | `/admin` (aba) | ✅ Funcionando | Upload para Supabase Storage      |
| **Relatórios**         | `/admin` (aba) | ⚠️ Básico      | Visão geral de vendas             |

### 4.3 Componentes de Proteção

| Componente            | Função                                                                   |
| --------------------- | ------------------------------------------------------------------------ |
| **AuthGuard**         | Verifica se usuário está logado (redireciona para /login)                |
| **SubscriptionGuard** | Verifica se assinatura está ativa (redireciona para /escolher-pagamento) |
| **isAdmin check**     | No useAuth, verifica role no banco de dados                              |

---

## 5. Sistema de Pagamentos

### 5.1 Stripe (Principal - Funcionando)

**Edge Functions relacionadas:**

- `create-stripe-subscription` - Cria checkout para planos
- `create-stripe-order` - Cria checkout para produtos
- `stripe-webhook` - Processa eventos do Stripe
- `customer-portal` - Link para gerenciar assinatura no Stripe

**Fluxo de Pagamento:**

1. Cliente seleciona plano/produto
2. Frontend chama Edge Function com JWT
3. Function valida token e cria Stripe Checkout Session
4. Usuário redirecionado para Stripe (formulário seguro)
5. Após pagamento, Stripe envia webhook
6. Webhook atualiza banco de dados
7. Cliente redirecionado para página de sucesso

**Configuração Necessária:**

```bash
# Variáveis de ambiente (Supabase Dashboard)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Taxas Calculadas:**

- Taxa Stripe: 3.99% + R$ 0.40 por transação
- Adicionado automaticamente ao valor final se `includeStripeFee=true`

### 5.2 PIX (OpenPix / Abacate Pay) - ⚠️ Não Totalmente Funcional

**Edge Functions relacionadas:**

- `create-openpix-charge`
- `create-openpix-order`
- `openpix-webhook`
- `create-pix-abacate`
- `create-abacate-checkout`
- `abacate-webhook`

**Status:** Integração iniciada mas não finalizada. Botões de PIX existem no frontend mas podem ter problemas.

**Problema:** Falta configuração completa, testes de webhook e validação de pagamentos.

---

## 6. Autenticação e Autorização

### 6.1 Sistema de Autenticação (Supabase Auth)

**Métodos Suportados:**

1. **Email/Password** - Registro e login tradicional
2. **Google OAuth** - Login social (configurado)

**Fluxo de Sessão:**

```typescript
// AuthContext gerencia estado global
const { user, session, loading, isAdmin, signIn, signOut } = useAuthContext();

// JWT Token armazenado em:
- Cookie HTTP-only (seguro)
- localStorage (backup)

// Expiração: 1 hora (renovado automaticamente)
```

**Estrutura do Token JWT:**

```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@example.com",
  "role": "authenticated",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### 6.2 Sistema de Autorização (RLS - Row Level Security)

**Políticas do Banco de Dados:**

**Tabela `users`:**

- Usuários podem ler seus próprios dados
- Admins podem ler/editar todos os usuários
- Service role pode fazer tudo

**Tabela `subscriptions`:**

- Usuários podem ler suas próprias assinaturas
- Admins podem ler/editar todas
- Inserções apenas via service role (Edge Functions)

**Tabela `products`:**

- Todos podem ler (público)
- Apenas admins podem criar/editar/deletar

**Tabela `orders`:**

- Usuários podem ler seus próprios pedidos
- Admins podem ler todos

### 6.3 Roles do Sistema

| Role            | Permissões                                       |
| --------------- | ------------------------------------------------ |
| `authenticated` | Usuário logado normal (pode comprar, ver perfil) |
| `admin`         | Acesso ao painel /admin, gerenciar tudo          |
| `service_role`  | Usado pelas Edge Functions (acesso total)        |

**Como definir um admin:**

```sql
-- No banco de dados Supabase
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';
```

---

## 7. Análise de Segurança

### 7.1 ✅ Pontos Fortes

1. **Autenticação Robusta**
   - JWT tokens gerenciados pelo Supabase
   - Tokens com expiração automática
   - Suporte a OAuth (Google)

2. **RLS (Row Level Security)**
   - Políticas configuradas no PostgreSQL
   - Usuários só acessam seus próprios dados
   - Proteção em nível de banco de dados

3. **HTTPS Obrigatório**
   - Todo tráfego criptografado
   - Certificados gerenciados pela Vercel

4. **Edge Functions com Validação**
   - Verificação de JWT em cada chamada
   - Logs detalhados para debugging
   - Validação de entrada de dados

5. **Segredos Protegidos**
   - Chaves API nunca expostas no frontend
   - Variáveis de ambiente no Supabase/Vercel
   - Stripe Secret Key apenas no backend

6. **CORS Configurado**
   - Headers de CORS definidos
   - Proteção contra requisições não autorizadas

### 7.2 ⚠️ Vulnerabilidades e Riscos

#### 🔴 **CRÍTICO - Exposição de Chaves no .env.local**

**Problema:**

```env
# Arquivo .env.local (VISÍVEL NO CÓDIGO)
STRIPE_SECRET_KEY="sk_live_51S2MCX..." ❌ PERIGOSO!
```

**Risco:**

- Chave secreta do Stripe LIVE exposta no repositório
- Qualquer pessoa com acesso ao código pode fazer cobranças
- Pode resultar em perda financeira

**Solução:**

1. **URGENTE:** Rotacionar a chave no Stripe Dashboard
2. Remover do .env.local
3. Manter apenas no Supabase Dashboard (Edge Functions)
4. Adicionar .env.local ao .gitignore

```bash
# .gitignore
.env.local
.env*.local
```

#### 🔴 **CRÍTICO - Falta de Rate Limiting**

**Problema:**

- Nenhuma proteção contra requisições em massa
- Atacante pode:
  - Criar múltiplas contas
  - Tentar múltiplos pagamentos
  - Sobrecarregar Edge Functions

**Solução:**

```typescript
// Implementar em Edge Functions
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requisições
  duration: 60, // por minuto
});

// Em cada função
await rateLimiter.consume(userId);
```

#### 🟡 **ALTO - Validação de Input Insuficiente**

**Problema:**
Edge Functions confiam nos dados recebidos sem validação rigorosa.

**Exemplo:**

```typescript
// create-stripe-order/index.ts
const { items, userId, customer } = await req.json();
// ❌ Não valida se items é array, se tem campos obrigatórios, etc
```

**Solução:**

```typescript
import { z } from "zod";

const OrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ),
  userId: z.string().uuid(),
  customer: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
});

// Usar
const validatedData = OrderSchema.parse(await req.json());
```

#### 🟡 **ALTO - Logs Excessivos em Produção**

**Problema:**

```typescript
console.log(`[CREATE-STRIPE-SUBSCRIPTION] ${step}${detailsStr}`);
// Pode logar dados sensíveis (emails, valores, etc)
```

**Solução:**

```typescript
const isDev = Deno.env.get("ENVIRONMENT") === "development";

const logStep = (step: string, details?: Record<string, unknown>) => {
  if (isDev) {
    console.log(`[CREATE-STRIPE-SUBSCRIPTION] ${step}`, details);
  }
};
```

#### 🟡 **MÉDIO - Falta de Auditoria**

**Problema:**

- Não há registro de ações críticas (quem deletou o quê, quando)
- Difícil rastrear problemas ou fraudes

**Solução:**

```sql
-- Criar tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 🟡 **MÉDIO - Sem Proteção Anti-CSRF**

**Problema:**

- Não há tokens CSRF para formulários críticos
- Vulnerável a Cross-Site Request Forgery

**Solução:**

- Implementar tokens CSRF para ações sensíveis (mudar senha, deletar conta)
- Validar origem das requisições

#### 🟢 **BAIXO - Senhas Fracas Permitidas**

**Problema:**

- Supabase permite senhas de 6 caracteres
- Sem requisitos de complexidade

**Solução:**

```typescript
// No frontend (validação adicional)
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Deve conter letra maiúscula")
  .regex(/[0-9]/, "Deve conter número")
  .regex(/[^A-Za-z0-9]/, "Deve conter caractere especial");
```

#### 🟢 **BAIXO - Falta de 2FA (Two-Factor Authentication)**

**Problema:**

- Não há autenticação de dois fatores
- Contas protegidas apenas por senha

**Solução:**

- Implementar TOTP (Google Authenticator)
- Usar biblioteca `@supabase/auth-helpers-react` com suporte a MFA

---

## 8. Vulnerabilidades Conhecidas

### 8.1 Checklist de Segurança

| Item                  | Status               | Prioridade  |
| --------------------- | -------------------- | ----------- |
| HTTPS em produção     | ✅ OK                | Alta        |
| Chaves API protegidas | ⚠️ Parcial           | **Crítica** |
| Validação de inputs   | ❌ Falta             | Alta        |
| Rate limiting         | ❌ Falta             | **Crítica** |
| SQL Injection         | ✅ Protegido (RLS)   | Alta        |
| XSS Protection        | ✅ React escapa HTML | Média       |
| CSRF Protection       | ❌ Falta             | Média       |
| Logs seguros          | ⚠️ Parcial           | Média       |
| Auditoria             | ❌ Falta             | Média       |
| 2FA                   | ❌ Falta             | Baixa       |
| Senhas fortes         | ⚠️ Fraca             | Baixa       |

### 8.2 Testes de Segurança Recomendados

**Ferramentas:**

1. **OWASP ZAP** - Scanner de vulnerabilidades web
2. **Burp Suite** - Proxy para análise de tráfego
3. **npm audit** - Vulnerabilidades em dependências
4. **Snyk** - Análise de código e dependências

**Comandos:**

```bash
# Verificar vulnerabilidades em pacotes
npm audit

# Verificar dependências desatualizadas
npm outdated

# Análise com Snyk
npx snyk test
```

**Teste Manual:**

- [ ] Tentar SQL Injection nos formulários
- [ ] Tentar XSS em campos de texto
- [ ] Testar rate limiting (fazer 100 requisições rápidas)
- [ ] Testar autorização (acessar /admin sem ser admin)
- [ ] Verificar se dados sensíveis aparecem nos logs
- [ ] Testar CORS (fazer requisição de outro domínio)

---

## 9. Melhorias Sugeridas

### 9.1 🔥 Prioridade CRÍTICA (Fazer AGORA)

#### 1. **Proteger Chaves Secretas**

```bash
# Passos:
1. Acessar Stripe Dashboard
2. Revogar chave atual (sk_live_...)
3. Gerar nova chave
4. Atualizar APENAS no Supabase Dashboard
5. Remover do .env.local
6. Adicionar ao .gitignore
7. Fazer commit removendo a chave do histórico Git
```

#### 2. **Implementar Rate Limiting**

```typescript
// Criar nova Edge Function: rate-limit-middleware
import { createClient } from '@supabase/supabase-js';

export async function checkRateLimit(userId: string, action: string) {
  const supabase = createClient(...)

  const { data } = await supabase
    .from('rate_limits')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('action', action)
    .single();

  const now = Date.now();
  const windowMs = 60000; // 1 minuto

  if (data && (now - data.last_reset) < windowMs) {
    if (data.count >= 10) {
      throw new Error('Too many requests');
    }
  }

  // Atualizar contador
  await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      action,
      count: (data?.count || 0) + 1,
      last_reset: data ? data.last_reset : now,
    });
}
```

#### 3. **Adicionar Validação de Schemas**

```bash
# Instalar Zod
npm install zod

# Criar src/lib/schemas.ts
```

```typescript
// src/lib/schemas.ts
import { z } from "zod";

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        price: z.number().positive(),
        quantity: z.number().int().positive().max(10),
        size: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
  userId: z.string().uuid(),
  customer: z.object({
    name: z.string().min(3).max(100),
    email: z.string().email(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
  }),
  includeStripeFee: z.boolean().default(true),
  cancelUrl: z.string().url().optional(),
});

export const CreateSubscriptionSchema = z.object({
  planId: z.enum(["mensal", "trimestral", "semestral", "anual", "plano_teste"]),
  userId: z.string().uuid(),
  includeStripeFee: z.boolean().default(true),
  cancelUrl: z.string().url().optional(),
});
```

### 9.2 🔴 Prioridade ALTA (Fazer Esta Semana)

#### 4. **Sistema de Logs Estruturado**

```typescript
// src/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  function: string;
  userId?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export class Logger {
  private isDev = Deno.env.get("ENVIRONMENT") === "development";

  private log(entry: LogEntry) {
    if (this.isDev || entry.level === "error") {
      console.log(JSON.stringify(entry));
    }

    // Enviar para serviço de logs (opcional)
    // await sendToLogService(entry);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log({
      level: "info",
      message,
      function: this.constructor.name,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  error(message: string, error: Error, data?: Record<string, unknown>) {
    this.log({
      level: "error",
      message,
      function: this.constructor.name,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        error: error.message,
        stack: error.stack,
      },
    });
  }
}
```

#### 5. **Tabela de Auditoria**

```sql
-- Executar no Supabase SQL Editor
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);

-- Trigger para deletar logs antigos (manter 90 dias)
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Agendar com cron (extensão pg_cron)
SELECT cron.schedule('delete-old-logs', '0 2 * * *', 'SELECT delete_old_audit_logs()');
```

#### 6. **Melhorar Tratamento de Erros**

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = "BAD_REQUEST") {
    super(400, code, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado", code = "UNAUTHORIZED") {
    super(401, code, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado", code = "FORBIDDEN") {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code = "NOT_FOUND") {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = "CONFLICT") {
    super(409, code, message);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Erro interno do servidor", code = "INTERNAL_ERROR") {
    super(500, code, message);
  }
}

// Usar nas Edge Functions
throw new BadRequestError("Items são obrigatórios");
```

### 9.3 🟡 Prioridade MÉDIA (Fazer Este Mês)

#### 7. **Testes Automatizados**

```bash
# Instalar dependências
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Criar testes
mkdir -p src/test/unit
mkdir -p src/test/integration
```

```typescript
// src/test/unit/auth.test.ts
import { describe, it, expect } from "vitest";
import { signIn } from "@/hooks/useAuth";

describe("Authentication", () => {
  it("should login with valid credentials", async () => {
    const result = await signIn("test@example.com", "password123");
    expect(result.error).toBeNull();
    expect(result.data?.user).toBeDefined();
  });

  it("should fail with invalid credentials", async () => {
    const result = await signIn("test@example.com", "wrongpassword");
    expect(result.error).toBeDefined();
  });
});
```

#### 8. **Monitoramento e Alertas**

```typescript
// Integrar com Sentry para monitoramento de erros
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Capturar erros
try {
  // código
} catch (error) {
  Sentry.captureException(error);
}
```

#### 9. **Backup Automático do Banco**

```bash
# Configurar no Supabase Dashboard
1. Ir em Settings > Database
2. Habilitar "Point-in-time Recovery"
3. Configurar backup diário automático
4. Testar restauração mensalmente
```

#### 10. **Documentação da API (Edge Functions)**

```typescript
// Adicionar JSDoc em todas as Edge Functions
/**
 * Cria uma Checkout Session no Stripe para assinaturas
 *
 * @endpoint POST /create-stripe-subscription
 * @auth Required (JWT Bearer token)
 *
 * @body {Object} request
 * @body {string} request.planId - ID do plano (mensal, trimestral, semestral, anual)
 * @body {string} request.userId - UUID do usuário
 * @body {boolean} [request.includeStripeFee=true] - Se deve incluir taxa do Stripe
 * @body {string} [request.cancelUrl] - URL de retorno ao cancelar
 *
 * @returns {Object} response
 * @returns {string} response.url - URL do Stripe Checkout
 * @returns {string} response.sessionId - ID da sessão criada
 *
 * @throws {401} Se token JWT inválido
 * @throws {400} Se planId ou userId ausentes
 * @throws {500} Se erro ao criar sessão Stripe
 *
 * @example
 * const response = await fetch('/functions/v1/create-stripe-subscription', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     planId: 'mensal',
 *     userId: 'uuid-here',
 *     includeStripeFee: true,
 *     cancelUrl: 'https://site.com/planos',
 *   }),
 * });
 */
```

### 9.4 🟢 Prioridade BAIXA (Backlog)

11. **PWA (Progressive Web App)**
    - Adicionar service worker
    - Permitir instalação como app
    - Funcionar offline (cache básico)

12. **Internacionalização (i18n)**
    - Suporte a inglês/espanhol
    - Usar biblioteca `react-i18next`

13. **Dashboard de Analytics**
    - Integrar Google Analytics 4
    - Dashboard customizado no /admin
    - Métricas de conversão

14. **Sistema de Cupons**
    - Criar tabela `coupons`
    - Validar cupons no checkout
    - Aplicar descontos

15. **Notificações Push**
    - Avisar sobre vencimento de assinatura
    - Novos produtos adicionados
    - Promoções

---

## 10. Guia para Novos Desenvolvedores

### 10.1 Setup do Ambiente

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/boracorrerclub.git
cd boracorrerclub

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas credenciais
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_URL="https://seu-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key"

# ⚠️ NUNCA adicionar STRIPE_SECRET_KEY aqui!

# 4. Rodar desenvolvimento
npm run dev

# 5. Acessar
# http://localhost:5173
```

### 10.2 Estrutura de Código

**Convenções:**

- Componentes: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase com prefixo `use` (`useAuth.ts`)
- Utilitários: camelCase (`formatPrice.ts`)
- Constantes: UPPER_SNAKE_CASE (`API_URL`)

**Padrões:**

```typescript
// ✅ BOM
export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuthContext();

  if (!product) return null;

  return (
    <div className="product-card">
      {/* conteúdo */}
    </div>
  );
}

// ❌ RUIM
export default ({ product }: any) => {
  return <div>{/* conteúdo */}</div>;
}
```

### 10.3 Como Adicionar uma Nova Página

```typescript
// 1. Criar arquivo em src/pages/NovaPage.tsx
import { Layout } from "@/components/layout/Layout";

export default function NovaPage() {
  return (
    <Layout>
      <div className="container py-12">
        <h1 className="text-4xl font-bold">Nova Página</h1>
      </div>
    </Layout>
  );
}

// 2. Adicionar rota em src/App.tsx
const NovaPage = lazy(() => import("./pages/NovaPage"));

// Dentro de <Routes>
<Route path="/nova-pagina" element={<NovaPage />} />

// 3. Adicionar link no Header
<Link to="/nova-pagina">Nova Página</Link>
```

### 10.4 Como Criar uma Edge Function

```bash
# 1. Criar pasta
mkdir -p supabase/functions/minha-funcao

# 2. Criar index.ts
# supabase/functions/minha-funcao/index.ts
```

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validar JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validar token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error("Invalid token");
    }

    // Processar request
    const { param1, param2 } = await req.json();

    // Sua lógica aqui
    const result = { message: "Sucesso!" };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
```

```bash
# 3. Deploy
npx supabase functions deploy minha-funcao --project-ref seu-project-id
```

### 10.5 Debugging

**Frontend:**

```typescript
// Usar React DevTools
// Console do navegador
console.log("Debug:", variavel);

// Breakpoints no VS Code
// Adicionar "debugger;" no código
```

**Edge Functions:**

```bash
# Ver logs no Supabase Dashboard
# Functions > Sua Function > Logs

# Ou via CLI
npx supabase functions logs create-stripe-subscription --project-ref seu-id
```

**Banco de Dados:**

```sql
-- SQL Editor no Supabase Dashboard
SELECT * FROM users WHERE email = 'teste@example.com';
SELECT * FROM subscriptions WHERE user_id = 'uuid';
```

### 10.6 Deploy

```bash
# Frontend (Vercel)
1. Conectar repositório no Vercel Dashboard
2. Configurar variáveis de ambiente
3. Deploy automático em cada push

# Edge Functions (Supabase)
npx supabase functions deploy --project-ref seu-id

# Banco (Migrations)
npx supabase db push --project-ref seu-id
```

---

## 11. Glossário

| Termo             | Significado                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| **Edge Function** | Função serverless que roda no edge (perto do usuário)                    |
| **RLS**           | Row Level Security - Segurança em nível de linha no banco                |
| **JWT**           | JSON Web Token - Token de autenticação                                   |
| **Webhook**       | URL que recebe notificações de eventos (ex: Stripe)                      |
| **CORS**          | Cross-Origin Resource Sharing - Política de compartilhamento de recursos |
| **BaaS**          | Backend as a Service - Backend gerenciado (Supabase)                     |
| **OAuth**         | Protocolo de autenticação (ex: Login com Google)                         |
| **Rate Limiting** | Limite de requisições por tempo                                          |
| **CSRF**          | Cross-Site Request Forgery - Ataque de requisição forjada                |
| **XSS**           | Cross-Site Scripting - Ataque de injeção de script                       |
| **2FA/MFA**       | Two-Factor / Multi-Factor Authentication                                 |

---

## 12. Contatos e Suporte

**Desenvolvedor Principal:**

- Email: boracorrerclub@gmail.com
- WhatsApp: +55 13 99689-0611
- Instagram: [@boracorrerclub](https://www.instagram.com/boracorrerclub)

**Supabase:**

- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs

**Stripe:**

- Dashboard: https://dashboard.stripe.com
- Docs: https://stripe.com/docs

**Vercel:**

- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

---

## 13. Checklist de Lançamento

### Antes de Produção:

- [ ] **Segurança**
  - [ ] Rotacionar todas as chaves API
  - [ ] Remover chaves secretas do código
  - [ ] Configurar rate limiting
  - [ ] Implementar validação de schemas
  - [ ] Configurar logs seguros
  - [ ] Criar tabela de auditoria
  - [ ] Testar todas as políticas RLS

- [ ] **Testes**
  - [ ] Testar fluxo completo de assinatura
  - [ ] Testar fluxo completo de compra de produto
  - [ ] Testar webhook do Stripe
  - [ ] Testar cancelamento de compra
  - [ ] Testar acesso admin
  - [ ] Testar em mobile

- [ ] **Performance**
  - [ ] Otimizar imagens
  - [ ] Configurar cache
  - [ ] Minimizar bundle size
  - [ ] Testar tempo de carregamento

- [ ] **Legal**
  - [ ] Adicionar Termos de Uso
  - [ ] Adicionar Política de Privacidade
  - [ ] Adicionar LGPD compliance
  - [ ] Configurar cookies

- [ ] **Monitoramento**
  - [ ] Configurar Sentry
  - [ ] Configurar Google Analytics
  - [ ] Configurar alertas de erro
  - [ ] Configurar backup automático

---

**Última Atualização:** 05/02/2026  
**Versão:** 1.0  
**Status:** 🟢 Documento Completo

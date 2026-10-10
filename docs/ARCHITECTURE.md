# Arquitetura do Projeto

## Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── common/       # Componentes reutilizaveis
│   ├── layout/       # Componentes de layout
│   └── ui/           # Componentes UI (shadcn)
├── contexts/         # Context API
├── hooks/            # Custom hooks
├── lib/              # Utilitarios e configuracoes
├── pages/            # Paginas da aplicacao
├── types/            # TypeScript types
└── test/             # Testes

supabase/
├── functions/        # Edge Functions (Deno)
└── migrations/       # Migracoes do banco
```

## Fluxo de Dados

1. **Autenticacao**: Supabase Auth → AuthContext → Componentes
2. **Estado Global**: React Query + Context API
3. **Formularios**: React Hook Form + Zod
4. **API**: Supabase Client → Custom Hooks → Componentes

## Seguranca

- RLS (Row Level Security) no Supabase
- Autenticacao 2FA (TOTP)
- Rate limiting em Edge Functions
- Sanitizacao de logs
- HTTPS obrigatorio

## Banco de Dados

- **PostgreSQL** via Supabase
- **RLS** ativo em todas as tabelas
- **Policies** especificas por role (user, admin)

## Deploy

- **Frontend**: Vercel (auto-deploy na main)
- **Backend**: Supabase Edge Functions
- **CDN**: Vercel Edge Network

## Performance

- Code splitting otimizado
- Lazy loading de imagens
- React Query com cache
- Service Worker (futuro)

## Monitoramento

- **Sentry**: Error tracking
- **Logger estruturado**: Logs centralizados
- **Analytics**: Vercel Analytics

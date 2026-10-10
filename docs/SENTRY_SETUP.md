# 📋 Configuração do Sentry

## ⚙️ Como Configurar

O Sentry está instalado e configurado no projeto, mas **precisa do DSN** para funcionar.

### 1️⃣ Criar Conta no Sentry

1. Acesse: https://sentry.io/signup/
2. Crie uma conta gratuita (até 5.000 erros/mês)
3. Crie um novo projeto:
   - **Platform**: React
   - **Project Name**: boracorrerclub

### 2️⃣ Obter o DSN

1. Após criar o projeto, copie o **DSN**
   - É uma URL que parece com: `https://abc123@o123456.ingest.sentry.io/789012`

2. Adicione no arquivo `.env.local`:
   ```bash
   VITE_SENTRY_DSN=https://[seu-dsn-aqui]@o[org-id].ingest.sentry.io/[project-id]
   ```

### 3️⃣ Configurar Source Maps (Opcional)

Para ver o código original nos erros, configure no `.env.local`:

```bash
SENTRY_ORG=seu-org-slug
SENTRY_PROJECT=boracorrerclub
SENTRY_AUTH_TOKEN=seu-auth-token
```

**Como obter:**

1. Ir em: Settings > Auth Tokens
2. Criar novo token com permissões:
   - `project:releases`
   - `org:read`
3. Copiar e colar no `.env.local`

### 4️⃣ Testar

1. Reinicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

2. Verifique no console se aparece:

   ```
   ✅ Sentry inicializado com sucesso
   ```

3. Forçar um erro para testar:
   - Abra qualquer página
   - No console do navegador, execute:
     ```javascript
     throw new Error("Teste do Sentry");
     ```

4. Verifique no dashboard do Sentry se o erro apareceu

## 🚀 Como Usar no Código

### Capturar Erro Manualmente

```typescript
import { captureError } from "@/lib/sentry";

try {
  // código que pode dar erro
} catch (error) {
  captureError(error, {
    userId: user.id,
    context: "checkout",
  });
}
```

### Definir Contexto do Usuário

```typescript
import { setUserContext } from "@/lib/sentry";

// Após login
setUserContext({
  id: user.id,
  email: user.email,
  name: user.name,
});
```

### Adicionar Tags

```typescript
import { addTag } from "@/lib/sentry";

addTag("payment_method", "stripe");
addTag("plan", "mensal");
```

## 📊 O Que o Sentry Monitora

✅ **Erros de JavaScript**

- Exceptions não tratadas
- Promise rejections
- Console errors

✅ **Performance**

- Tempo de carregamento de páginas
- Chamadas de API lentas
- Navegação entre páginas

✅ **Session Replay** (10% das sessões)

- Grava a tela do usuário
- Apenas quando ocorre erro
- Dados sensíveis são mascarados

## ⚠️ Privacidade

O sistema está configurado para:

- ✅ Mascarar texto sensível (senhas, CPF)
- ✅ Bloquear mídia (imagens, vídeos)
- ✅ Ignorar erros de extensões do navegador
- ✅ Filtrar breadcrumbs de campos sensíveis

## 🔍 Dashboard

Acesse: https://sentry.io/organizations/[seu-org]/projects/

**Principais Métricas:**

- Erros por dia
- Usuários afetados
- Páginas com mais erros
- Performance de transações

## 💡 Dicas

1. **Em Desenvolvimento**: Sentry fica desabilitado para não poluir os dados
2. **Em Produção**: Apenas 10% das sessões são gravadas (economiza cota)
3. **Alertas**: Configure alertas por email/Slack quando erros críticos ocorrem
4. **Releases**: Quando fizer deploy, marque a versão no Sentry

## 🆘 Troubleshooting

**Não aparece "Sentry inicializado":**

- Verifique se o DSN está correto no `.env.local`
- Verifique se o arquivo foi salvo
- Reinicie o servidor de dev

**Erros não aparecem no dashboard:**

- Verifique se está em modo produção (`npm run build && npm run preview`)
- Verifique se o DSN está correto
- Aguarde até 5 minutos (pode ter delay)

**Source maps não funcionam:**

- Verifique se `SENTRY_AUTH_TOKEN` está configurado
- Verifique permissões do token
- Rode `npm run build` e veja se há erros

## 📚 Documentação

- Docs oficiais: https://docs.sentry.io/platforms/javascript/guides/react/
- Dashboard: https://sentry.io
- Issues: https://github.com/getsentry/sentry-javascript/issues

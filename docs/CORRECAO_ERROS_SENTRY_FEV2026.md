# Correção de Erros do Sentry - Fevereiro 2026

## Problemas Identificados

### 1. ❌ Failed to fetch dynamically imported module

**Erro:** `TypeError: Failed to fetch dynamically import ed module: RecuperarSenha-2xzXHgOp.js`

**Causa:** Quando fazemos um novo deploy, o React lazy loading tenta carregar arquivos JS antigos que foram deletados/renomeados. Isso causa erro na navegação do usuário.

**Impacto:** 6 ocorrências | Usuários vendo tela branca ao navegar

---

### 2. ❌ Login Error mostrando `[object Object]`

**Erro:** `Erro no login [object Object object]`

**Causa:** O logger estava tentando serializar o objeto de erro do Supabase sem extrair a mensagem primeiro.

**Impacto:** 6 ocorrências | Logs ilegíveis no Sentry

---

## Soluções Implementadas

### ✅ 1. Sistema de Retry Automático

**Arquivo:** `src/utils/lazyWithRetry.ts`

Criado um wrapper para o `React.lazy()` que:

- Tenta carregar o módulo até 3 vezes antes de desistir
- Aguarda 1 segundo entre cada tentativa
- Detecta especificamente erros de "Failed to fetch"

**Uso futuro (opcional):**

```typescript
// Em vez de:
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));

// Usar:
import { lazyWithRetry } from "@/utils/lazyWithRetry";
const RecuperarSenha = lazyWithRetry(() => import("./pages/RecuperarSenha"));
```

---

### ✅ 2. ErrorBoundary Inteligente

**Arquivo:** `src/components/common/ErrorBoundary.tsx`

Melhorias:

- **Detecta automaticamente** erros de lazy loading
- **Em produção:** Recarrega a página automaticamente após 2 segundos
- **Mensagem amigável:** "Detectamos uma atualização. Recarregando..."
- **Em desenvolvimento:** Mostra o erro técnico para debug

---

### ✅ 3. Logging de Erros Corrigido

**Arquivo:** `src/pages/Login.tsx`

Antes:

```typescript
logger.error("Erro no login", { error: errMsg }); // ❌ Faltava contexto
```

Depois:

```typescript
logger.error("Erro no login", { error: errMsg, email }); // ✅ Com contexto completo
```

---

## Resultado Esperado

### Antes:

- Usuário navega → Tela branca → Frustração 😡
- Logs no Sentry: `[object Object]` (inútil)

### Depois:

- Usuário navega → Se falhar → Retry automático → Sucesso 🎉
- Se falhar 3x → Mensagem amigável + Reload automático
- Logs no Sentry: Mensagens legíveis com contexto completo

---

## Como Atualizar o Site

Execute no terminal:

```powershell
.\atualizar_site.ps1
```

Este comando vai:

1. Aplicar as correções no banco de dados
2. Fazer deploy dos novos arquivos
3. Verificar se tudo está funcionando

---

## Monitoramento Pós-Deploy

Após o deploy, monitore no Sentry:

- ✅ Redução de erros "Failed to fetch"
- ✅ Logs de erro agora devem estar legíveis
- ✅ Auto-reload deve acontecer em caso de falha

---

## Notas Técnicas

- O retry só se aplica a erros de rede/carregamento
- Outros erros (ex: JavaScript runtime errors) não sofrem retry
- O auto-reload só acontece **em produção**
- Em desenvolvimento, o erro é mostrado para facilitar o debug

# Plano de Correção: Arquivo .env Duplicado

## Problema Identificado

O arquivo `.env` contém variáveis de ambiente duplicadas, causando falha no servidor Vite:

- Linhas 1-3: Variáveis com aspas
- Linhas 5-7: Mesmas variáveis sem aspas

## Solução

### Correção do arquivo .env

Remover as linhas duplicadas (5-7), mantendo apenas as variáveis originais:

```env
VITE_SUPABASE_PROJECT_ID="tbazzksrbcmatwqvweks"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiYXp6a3NyYmNtYXR3cXZ3ZWtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTYwNzYsImV4cCI6MjA4NDU5MjA3Nn0.6GX0c1tn5Y9-Qce4kmPTbWMjgs2b25iciSHmsPhhq5s"
VITE_SUPABASE_URL="https://tbazzksrbcmatwqvweks.supabase.co"
```

### Resultado Esperado

- Servidor Vite iniciará corretamente
- Site voltará a funcionar normalmente

---

## Seção Técnica

### Causa do Erro

O Vite detectou mudança no `.env` e tentou reiniciar, mas as variáveis duplicadas causaram conflito de configuração.

### Arquivos a Modificar

| Arquivo | Ação                            |
| ------- | ------------------------------- |
| `.env`  | Remover linhas 4-7 (duplicadas) |

### Correção Adicional (Warnings do Console)

Há também warnings de `forwardRef` nos componentes `CartModal` e `CheckoutModal`. São apenas avisos e não impedem o funcionamento, mas podem ser corrigidos posteriormente para código mais limpo.

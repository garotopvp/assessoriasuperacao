# Configurar Redirect URL do Supabase

## Problema

O email de confirmação está redirecionando para `http://localhost:3000` em vez do site em produção.

## Solução

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://supabase.com/dashboard/project/tdzdureusnszdzvsoomr

2. **Navegue até Authentication > URL Configuration:**
   - No menu lateral, clique em "Authentication"
   - Depois clique em "URL Configuration"

3. **Configure as URLs:**

   **Site URL:**

   ```
   https://www.boracorrerclub.com.br
   ```

   **Redirect URLs (adicione todas essas):**

   ```
   https://www.boracorrerclub.com.br/**
   https://www.boracorrerclub.com.br/login
   https://www.boracorrerclub.com.br/sucesso
   https://boracorrerclub.com.br/**
   https://boracorrerclub.vercel.app/**
   http://localhost:3000/**
   ```

4. **Salve as alterações**

## Resultado

Após essa configuração, os emails de confirmação vão redirecionar para `www.boracorrerclub.com.br` em vez do localhost.

## Alternativa: Desabilitar Confirmação de Email

Se você quiser que os usuários possam fazer login imediatamente sem confirmar email:

1. Vá em **Authentication > Providers > Email**
2. Desmarque a opção **"Confirm email"**
3. Salve

**Nota:** Isso permite que qualquer pessoa se cadastre sem verificar o email, o que pode ser menos seguro mas mais conveniente.

## Importante

Certifique-se de que o domínio `www.boracorrerclub.com.br` está apontando corretamente para o Vercel e com SSL configurado (HTTPS).

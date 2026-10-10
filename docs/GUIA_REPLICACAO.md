# 🏗️ Guia de Replicação: Bora Correr OS (White Label)

Este documento descreve como transformar o sistema atual em um template replicável para novos clientes.

## 1. Configuração Centralizada (Já Iniciada)

Criamos o arquivo `src/config/site.ts` para centralizar as informações da marca. Para replicar o site, basta alterar este arquivo.

### O que já foi desacoplado:
- [x] Nome do Site (`SITE_CONFIG.name`)
- [x] Descrição SEO (`SITE_CONFIG.description`)
- [x] Contatos (WhatsApp, Email, Instagram) no Footer.
- [x] Botão Flutuante de WhatsApp.
- [x] Metadados de SEO (Título, OG Tags).

---

## 2. Personalização Visual (Cores)

O sistema utiliza variáveis CSS no arquivo `src/index.css`. Para mudar a cor principal de **Rosa** para qualquer outra:

1. Abra `src/index.css`.
2. Altere os valores da variável `--primary` e `--accent`.

```css
/* Exemplo para Verde */
:root {
  --primary: 142 70% 45%; /* Valor HSL */
  --accent: 142 70% 45%;
}
```

---

## 3. Infraestrutura (Backend)

Para cada novo cliente, você precisará de um novo projeto no **Supabase**.

### Passos de Migração:
1. **Schema SQL:** Exportar todas as tabelas e políticas de segurança.
2. **Edge Functions:** Deploy das funções `sisrun-callback`, `stripe-webhook`, e `notify-system-alarms` no novo projeto.
3. **Secrets:** Configurar as chaves (Keys) no novo Supabase Dashboard:
   - `STRIPE_SECRET_KEY`
   - `ZAPI_TOKEN` & `ZAPI_INSTANCE`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 4. Gestão de Conteúdo

Moveremos os seguintes arquivos para a pasta `src/data/` para facilitar a tradução/adaptação:

- `terms.tsx` (Termos de Uso)
- `politica.tsx` (Privacidade)
- `planos.ts` (Preçário)

---

## 5. Deployment

Recomenda-se o uso da **Vercel** ou **Netlify**:
1. Conecte o novo repositório (ou fork).
2. Configure as Variáveis de Ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. O projeto já suporta PWA (Progressive Web App), então ele se comportará como um aplicativo no celular do novo cliente.

---

> [!IMPORTANT]
> **Próxima Ação Sugerida:**
> Se desejar, posso gerar o script SQL completo do banco de dados (sem os dados atuais) para que você o tenha guardado como um "Template de DB".

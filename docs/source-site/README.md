# 🏃 BORA CORRER CLUB — Site Oficial

**Engineered for Endurance**

Site completo de assessoria de corrida com loja de equipamentos técnicos. Design inspirado em marcas premium como 257represent e DOPA: minimalista, técnico, preto/pink.

## 📐 Arquitetura

```
BORA CORRER CLUB
├── HOME (Landing Page)
│   ├── Hero: "ENGINEERED FOR ENDURANCE"
│   ├── Sistema Bora Correr (3 Pilares)
│   ├── Equipamento em Destaque (4 produtos)
│   ├── Planos de Consultoria (comparativo)
│   ├── Depoimentos (3 atletas)
│   ├── Conhecimento (3 artigos)
│   └── CTA Final
├── CONSULTORIA
│   ├── Hero
│   ├── O que você recebe (4 benefícios)
│   ├── Planos detalhados (Mensal/Trimestral/Semestral/Anual)
│   ├── Processo de onboarding (4 etapas)
│   └── FAQ
└── EQUIPAMENTO (em breve)
    └── Grid de produtos com filtros
```

## 🎨 Design System

### Paleta de Cores

```css
--obsidian: #0a0a0a /* Preto principal */ --electric-pink: #ff007f /* Destaque/CTAs */
  --concrete: #e5e5e5 /* Bordas */ --neutral-50: #f9f9f9 /* Fundos alternados */ --white: #ffffff
  /* Branco puro */;
```

### Tipografia

- **Fonte:** Inter (Google Fonts)
- **Pesos:** 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Black)
- **Títulos:** Black (-0.02em tracking)
- **Corpo:** Regular/Medium (1.6 line-height)

### Componentes

- **Buttons:** Primary (Pink), Secondary (Black), Outline (White border)
- **Cards:** Bordas 1px, hover com translateY(-4px)
- **Modal:** Carrinho lateral (slide-in animation)
- **Grid:** Responsivo (1/2/3/4 colunas)

## 🚀 Como Usar

### Rodar Localmente

1. Clone o repositório ou baixe os arquivos
2. Abra `index.html` no navegador (duplo-clique)
3. Ou use um servidor local:

   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (http-server)
   npx http-server
   ```

4. Acesse `http://localhost:8000`

### Estrutura de Arquivos

```
site-assessoria/
├── index.html              # Home (landing page)
├── consultoria.html        # Página de consultoria
├── css/
│   ├── styles.css          # Estilos globais
│   ├── consultoria.css     # Estilos específicos consultoria
│   └── performance.css     # Acessibilidade e otimizações
├── js/
│   ├── app.js              # Lógica global (carrinho, produtos, animações)
│   └── consultoria.js      # Lógica de inscrição
├── README.md               # Documentação principal
└── MELHORIAS.md            # Log detalhado de melhorias
```

## 🛒 Funcionalidades

### Carrinho de Compras

- Adicionar produtos com seleção de tamanho
- Modal lateral com animação slide-in
- Persistência via `localStorage`
- Checkout via `mailto:` (placeholder para integração futura)
- **Toast notifications** para feedback visual
- Remoção individual de itens

### Produtos

8 produtos disponíveis:

- **REGATA STRIKE** — R$ 249,90
- **CAMISETA PACE** — R$ 199,90
- **SHORT VELOCITY** — R$ 179,90
- **JAQUETA WINDTECH** — R$ 399,90
- **CAMISETA RUNNER PRO** — R$ 219,90
- **SHORTS MARATHON** — R$ 189,90
- **BONE ULTRALIGHT** — R$ 89,90
- **MEIAS PERFORMANCE** — R$ 49,90

### Animações e UX

- **Fade-in ao scroll** com Intersection Observer
- **Contadores animados** (estatísticas)
- **Hover effects** com shimmer nos cards
- **Menu mobile** lateral com overlay
- **Toast notifications** (success, warning, error, info)
- **Loading states** em formulários

### SEO e Meta Tags

- Meta description otimizada
- Open Graph (Facebook)
- Twitter Cards
- Theme color para mobile
- Structured data ready

### Planos de Consultoria

- **Mensal:** R$ 149,97
- **Trimestral:** R$ 399,90 (economize 11%)
- **Semestral:** R$ 749,90 (economize 17%)
- **Anual:** R$ 1.349,90 (economize 25%)

## 📱 Responsividade

- **Mobile (< 768px):** Menu hamburger, grid 1 coluna, botões full-width
- **Tablet (768-1024px):** Grid 2 colunas, menu visível
- **Desktop (> 1024px):** Grid 4 colunas, hover effects, layout completo

## 🚢 Deploy

### GitHub Pages

1. Crie um repositório no GitHub
2. Faça push dos arquivos
3. Em `Settings` > `Pages`, selecione a branch `main` e pasta raiz
4. Acesse: `https://seu-usuario.github.io/nome-do-repo`

### Netlify

1. Arraste a pasta `site-assessoria` no [Netlify Drop](https://app.netlify.com/drop)
2. Ou conecte o repositório do GitHub
3. Deploy automático a cada commit

### Vercel

```bash
npm i -g vercel
cd site-assessoria
vercel
```

## 🔮 Próximos Passos

### Curto Prazo

- [ ] Integrar Stripe/PayPal para pagamento real
- [ ] Backend Node.js/Express para processar pedidos
- [ ] Página completa de Equipamento (grid com filtros)
- [ ] Sistema de busca

### Médio Prazo

- [ ] Dashboard de cliente (área logada)
- [ ] Sistema de gerenciamento de estoque
- [ ] Blog/Conhecimento com CMS (Strapi/Contentful)
- [ ] Integração com Strava

### Longo Prazo

- [ ] App mobile (React Native)
- [ ] Sistema de agendamento de treinos
- [ ] Gamificação e leaderboards
- [ ] Podcast player integrado

## 📞 Suporte

- **Email:** contato@boracorrerclub.com
- **Consultoria:** consultoria@boracorrerclub.com
- **Instagram:** [@boracorrerclub](https://instagram.com/boracorrerclub)

---

**© 2025 Bora Correr Club. Todos os direitos reservados.**

_De Santos para o mundo. Engineered for Endurance._

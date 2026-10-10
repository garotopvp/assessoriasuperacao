---
name: sports-bot-architect
description: Metodologia para criação de ecossistemas de bots de alta performance para assessorias esportivas. Use para desenhar fluxos de vendas, integração com wearables, prevenção de lesões e automação de fidelização no esporte.
---

# Skill: Arquiteto de Bots Esportivos

Esta skill fornece um framework estruturado para projetar e evoluir bots de atendimento para assessorias esportivas, transformando-os de simples respondedores de FAQ em ecossistemas de inteligência de dados e performance.

O processo é iterativo e dividido em 3 níveis de maturidade.

## Workflow de Desenvolvimento

Siga este processo para projetar e implementar o ecossistema do bot.

### Etapa 1: Nível 1 - Automação do Atendimento Básico

O objetivo é criar um funil de vendas e um sistema de suporte inicial.

1.  **Desenhe o Fluxo de Aquisição:**
    - Comece com um fluxo simples: Boas-vindas -> Qualificação (Nome, Experiência, Objetivo) -> Oferta de Aula Experimental.
2.  **Crie o Diagrama Visual:**
    - Use a ferramenta `manus-render-diagram` com um arquivo `.mmd` (Mermaid) para criar um fluxograma visual. Use o template em `templates/fluxograma_v1.mmd`.
3.  **Desenvolva a Documentação:**
    - Crie um documento Markdown detalhando cada mensagem e variável do fluxo.
4.  **Implemente os Gatilhos de Suporte:**
    - Configure respostas rápidas para FAQ (Preço, Local, Horários) e um transbordo para atendimento humano.

### Etapa 2: Nível 2 - Ecossistema de Engajamento e Retenção

O objetivo é aumentar a fidelização e o LTV (Lifetime Value) do aluno.

1.  **Adicione o Módulo de NPS Pós-Aula:**
    - Crie uma automação para enviar uma pesquisa de satisfação 2 horas após a aula experimental. Se a nota for alta (>8), envie uma oferta de inscrição. Se for baixa (<7), alerte um coordenador.
2.  **Implemente a Gamificação:**
    - Desenhe fluxos para desafios mensais e rankings de presença/performance.
3.  **Crie Automações de Recuperação (Win-back):**
    - Configure gatilhos para alunos inativos (ex: 15 dias sem treinar) e ofertas de reativação para ex-alunos (ex: 3 meses após o cancelamento).
4.  **Atualize o Diagrama e a Documentação:**
    - Incorpore os novos módulos no fluxograma e no documento de especificação.

### Etapa 3: Nível 3 - Inteligência Preditiva e Hiper-Personalização

O objetivo é usar dados para criar uma experiência de ponta e prevenir problemas.

1.  **Integre com Wearables (Strava/Garmin):**
    - Use as APIs (veja `references/api_integrations.md`) para ler dados de treinos. Crie automações para dar feedback pós-treino e alertar treinadores sobre sobrecarga (overtraining).
2.  **Desenvolva o Módulo de Saúde Preditiva:**
    - Crie um check-up semanal de dores. Use a lógica para cruzar dados de dor com o volume de treino para gerar alertas de risco de lesão.
3.  **Construa um Dashboard de BI:**
    - Conecte os dados do bot a uma ferramenta de Business Intelligence (Google Data Studio, Power BI) para monitorar métricas como Churn Rate, LTV e CAC.
4.  **Finalize o Master Flow e o Blueprint de Engenharia:**
    - Consolide todos os módulos no diagrama final e na documentação completa, que servirá como o guia mestre para a implementação técnica.

## Recursos da Skill

- **`/templates/fluxograma_v1.mmd`**: Template Mermaid para o diagrama inicial.
- **`/templates/message_template.txt`**: Modelo para padronizar as mensagens do bot.
- **`/references/api_integrations.md`**: Guia rápido para APIs de Strava e Google Calendar.
- **`/scripts/`**: Pode conter scripts para cálculos específicos, como Training Load (TSS), ou para enviar notificações para uma API de webhook.

## Quando Usar Esta Skill

- Ao receber uma solicitação para criar um chatbot para uma assessoria esportiva (corrida, ciclismo, triatlo, etc.).
- Quando um cliente pede para melhorar um bot existente, adicionando funis de venda, automações de marketing ou integrações com dados de performance.
- Para estruturar um projeto de automação de atendimento focado no nicho esportivo.

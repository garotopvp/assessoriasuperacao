---
name: bora-correr-bot-manager
description: Gerenciador de fluxos, automações e inteligência para o bot da assessoria de corrida Bora Correr Club. Use para implementar, atualizar ou gerenciar a lógica de atendimento, vendas, fidelização e performance.
---

# Skill: Gerenciador do Bot Bora Correr Club

Esta skill encapsula a inteligência e os fluxos operacionais do bot do Bora Correr Club (BCC). Ela deve ser usada como um guia de implementação para configurar plataformas de automação (como Typebot, ManyChat, Blip, ou desenvolvimento customizado) e garantir a consistência da metodologia BCC em todos os pontos de contato.

## Arquitetura e Fluxos Principais

A skill é dividida em módulos que representam cada etapa da jornada do cliente, desde o primeiro contato até a fidelização e recuperação.

### 1. Módulo de Aquisição e Onboarding (Para Prospects)

O objetivo é qualificar o lead e convertê-lo em uma aula experimental.

| Etapa            | Ação do Bot                                                | Variáveis a Coletar          |
| :--------------- | :--------------------------------------------------------- | :--------------------------- |
| **Boas-vindas**  | Saudação inicial e coleta de nome.                         | `userName`                   |
| **Qualificação** | Pergunta sobre nível de experiência e objetivo principal.  | `userExperience`, `userGoal` |
| **Conversão**    | Oferta da Aula Experimental Gratuita no Ibirapuera.        | `trialAccepted` (Sim/Não)    |
| **Agendamento**  | Se `trialAccepted` for "Sim", oferece dias/horários.       | `trialDay`, `trialTime`      |
| **Confirmação**  | Envia confirmação, link do Google Maps e notifica o admin. | -                            |

### 2. Módulo de Gestão de Alunos Ativos

Foco em engajamento, performance e saúde.

- **Menu do Aluno:** Ponto central para acessar:
  - **Treinos e Planilhas:** Link para a planilha de treino do aluno.
  - **Desafios e Ranking (Gamificação):** Acesso aos desafios do mês e ao ranking de presença.
  - **Calendário de Provas:** Lista de provas com suporte da assessoria.
  - **Indique um Amigo (MGM):** Geração de código de indicação.
- **Integração com Wearables:**
  - **Gatilho:** Nova atividade sincronizada no Strava/Garmin.
  - **Ação:** O bot envia um feedback automático ("Parabéns pelo treino de hoje!") e analisa os dados. Se o volume for muito acima do planejado, notifica o treinador.
- **Saúde e Prevenção:**
  - **Gatilho:** Automação semanal (ex: toda segunda-feira).
  - **Ação:** O bot pergunta: "Como você está se sentindo? Alguma dor ou desconforto nos treinos da última semana?". Se a resposta for positiva e persistente, alerta o treinador.

### 3. Módulo de Retenção e Recuperação

Automações para manter os alunos engajados e recuperar os que se afastaram.

- **NPS Pós-Aula Experimental:**
  - **Gatilho:** 2 horas após o horário da aula experimental.
  - **Ação:** Pergunta "De 0 a 10, como foi sua experiência hoje?".
  - **Lógica:**
    - **Nota > 8:** Envia oferta de inscrição com cupom.
    - **Nota < 7:** Alerta o coordenador técnico para contato humano.
- **Recuperação de Lead Inativo:**
  - **Gatilho:** Usuário parou no meio do fluxo de agendamento por 2 horas.
  - **Ação:** Envia mensagem de follow-up: "Percebi que você não concluiu seu agendamento. Posso ajudar com alguma dúvida?"
- **Recuperação de Aluno Inativo (Win-back):**
  - **Gatilho:** Aluno não faz check-in ou sincroniza treino há 15 dias.
  - **Ação:** Envia mensagem: "Sentimos sua falta! Está tudo bem com seus treinos?"
  - **Gatilho 2:** Ex-aluno (status "cancelado" no CRM).
  - **Ação:** Após 3 meses do cancelamento, envia oferta de reativação.

## 4. Módulos de Inteligência Transversal

Operam em paralelo a todos os fluxos.

- **Análise de Sentimento:**
  - **Gatilho:** Detecção de palavras-chave como `problema`, `cancelar`, `ruim`, `urgente`.
  - **Ação:** Pausa o fluxo atual, envia mensagem de contenção ("Entendo, estou chamando um especialista para te ajudar agora mesmo.") e notifica o administrador com prioridade máxima.
- **Gatilhos Rápidos (FAQ):**
  - **Gatilho:** Detecção de palavras-chave como `Pix`, `Preço`, `Local`, `Horários`, `Instagram`.
  - **Ação:** Responde imediatamente com a informação solicitada, sem interromper o fluxo principal se possível.

## 5. Implementação e Recursos

- **Mensagens:** Utilize os arquivos no diretório `templates/` como base para os textos de cada bloco do seu construtor de bot. Exemplo: `boas_vindas.txt`, `oferta_aula.txt`.
- **Integrações:** Consulte o arquivo `references/api_reference.md` para obter os endpoints e exemplos de chamadas para as APIs necessárias (Strava, Google Calendar, CRM).
- **Scripts:** O diretório `scripts/` contém exemplos de lógicas que podem ser adaptadas para a sua plataforma de automação ou para um backend customizado, como o script para notificar o admin via Telegram (`notify_admin.py`).

Para começar, crie um fluxo na sua plataforma de automação que siga a lógica do **Módulo de Aquisição e Onboarding**. Configure as variáveis e as mensagens conforme os templates.

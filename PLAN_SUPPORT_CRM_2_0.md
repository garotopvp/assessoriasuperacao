# 🚀 Plano de Evolução: Central de Suporte 2.0 (Bora Correr Club)

Este plano visa transformar o atual `SupportCRM` em uma ferramenta profissional de atendimento (semelhante a Zendesk/Intercom), focada em eficiência para a equipe e experiência para o aluno.

---

## 📅 Fase 1: Super-Poderes do Atendente (UX & Eficiência)

_Foco: Dar todas as ferramentas para o atendente resolver o problema rápido sem sair da tela._

### 1.1. Painel Lateral de Contexto do Aluno (Raio-X)

- **O que é:** Ao clicar em um chat, exibir uma barra lateral direita com:
  - **Dados do Plano:** Status da assinatura (Ativa/Inadimplente), Valor, Próxima Cobrança.
  - **Histórico:** Quantos atendimentos já teve.
  - **Tags:** Etiquetas como "VIP", "Novo Aluno", "Risco de Churn".
- **Por que:** O atendente não precisa abrir o Stripe/OpenPix ou outra aba para saber se o aluno pagou.

### 1.2. Envio de Mídia Completo

- **O que é:** Permitir que o admin envie:
  - 📷 **Imagens:** Upload direto do computador (arrastar e soltar).
  - 🎙️ **Áudio:** Botão de gravar microfone direto no navegador (igual WhatsApp Web).
  - 📎 **Documentos:** Envio de PDFs (treinos, recibos).
- **Por que:** Atualmente só enviamos texto. Áudio humaniza muito o atendimento.

### 1.3. Notas Internas (Sussurro)

- **O que é:** Mensagens de cor diferente (amarelo) que aparecem no chat mas **NÃO** vão para o aluno.
- **Uso:** "Demétrio, esse aluno está reclamando da cobrança X, veja o histórico".

---

## 🤖 Fase 2: Automação & Inteligência (Auto-Respostas)

_Foco: Reduzir o trabalho manual e atender 24/7._

### 2.1. Auto-Atendimento Configurável (Chatbot Visual)

- **O que é:** Criar uma tela no Admin para editar o "Menu Inicial" e as respostas automáticas sem mexer em código.
- **Funcionalidade:**
  - Definir saudação.
  - Definir opções do menu (1. Financeiro, 2. Treino).
  - Definir horário de atendimento (Fora do horário -> "Desculpe, voltamos amanhã às 08h").

### 2.2. Respostas Sugeridas por IA (Smart Reply)

- **O que é:** Um botão "✨ Sugerir Resposta".
- **Como funciona:** O sistema lê a última mensagem do aluno (ex: "Não recebi meu treino") e a IA gera uma resposta rascunho: _"Olá! Vou verificar com o treinador responsável e já te retorno."_

### 2.3. Gatilhos de Palavras-Chave

- **O que é:** Se o aluno digitar "Pix" ou "Boleto", o sistema sugere automaticamente enviar o código de pagamento ou a 2ª via, sem intervenção humana imediata.

---

## 📊 Fase 3: Gestão & Qualidade

_Foco: Gerentes e controle de qualidade._

### 3.1. Fila Inteligente & SLA

- **O que é:**
  - Ordenar chats por "Tempo de Espera" (quem espera há mais tempo aparece no topo).
  - Alerta visual (Sinal Vermelho) se o aluno espera há mais de 2 horas.

### 3.2. Marcação de Tickets (Tags)

- **O que é:** Finalizar o atendimento classificando o motivo: "Dúvida Financeira", "Erro no App", "Elogio".
- **Por que:** Gera relatórios de onde estão os gargalos do negócio.

### 3.3. Avaliação de Satisfação (CSAT)

- **O que é:** Ao digitar `/fechar`, o bot envia automaticamente: _"De 1 a 5, como foi seu atendimento?"_

---

## 🚦 Sugestão de Prioridadade (Próximos Passos)

Recomendo começarmos pela **Fase 1.1 (Painel Lateral do Aluno)** e **Fase 1.2 (Envio de Mídia)**, pois são as dores mais imediatas de quem atende.

**Podemos começar agora? Qual item prefere?**

1. Painel Lateral (Ver dados do aluno no chat)
2. Envio de Imagens/Áudio
3. Automação de Horário de Atendimento

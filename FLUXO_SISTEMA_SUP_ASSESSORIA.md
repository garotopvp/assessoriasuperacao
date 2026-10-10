# 🗺️ Mapa Mental e Fluxograma Completo 360º - Ecossistema Superação Assessoria

Abaixo está o fluxo macro e super detalhado de todas as funcionalidades e departamentos. Este documento explica exatamente como a plataforma funciona do ponto de vista de **Todos os Usuários**: Visitantes, Alunos, Setor Comercial, Setor Financeiro, Administração/Técnico e o próprio Sistema Automatizado (Robôs de IA).

---

## 🔁 Fluxograma Visual (Interação entre todos os Papéis)

_(Para visualizar este diagrama, abra este arquivo no GitHub ou em um leitor de Markdown com suporte a Mermaid, como o VSCode)._

```mermaid
flowchart TD
    %% Definições de Cores e Estilos para cada Setor
    classDef visitante fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#000;
    classDef aluno fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#000;
    classDef sistema fill:#ede9fe,stroke:#8b5cf6,stroke-width:2px,color:#000;
    classDef comercial fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#000;
    classDef financeiro fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#000;
    classDef admin fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#000;

    %% ----------------------------------------------------
    subgraph Visitante["👤 1. VISITANTE / LEAD"]
        V1([Acessa o Site SUPERAÇÃO]):::visitante
        V2[Navega: Planos, Loja, Eventos]:::visitante
        V3{Qual a intenção?}:::visitante
    end

    %% ----------------------------------------------------
    subgraph Comercial["💼 2. COMERCIAL / MARKETING"]
        C1[Atração / Campanhas (Anúncios)]:::comercial
        C2[Recuperação de Leads Incompletos]:::comercial
        C3[Recuperação de Carrinho e Abandono (Churn)]:::comercial
        C4[Relacionamento e Retenção Ativa]:::comercial
    end

    %% ----------------------------------------------------
    subgraph Aluno["🏃 3. ALUNO / CLIENTE"]
        A1[Preenche Cadastro, Objetivos e Anamnese]:::aluno
        A2[Aceita Termos (IP, Hora, Browser guardados)]:::aluno
        A3[Efetua Pagamento (Assinatura, Avulso ou Evento)]:::aluno
        A4[Acessa Painel do Aluno]:::aluno
        A5[Interage no WhatsApp com o Bot de IA]:::aluno
        A6[Compra Produtos na Loja / Ingressos]:::aluno
    end

    %% ----------------------------------------------------
    subgraph Sistema["🤖 4. SISTEMA AUTOMATIZADO / BOT IA"]
        S1[Grava Dados / Aceite Jurídico no Banco]:::sistema
        S2[Processa Stripe / OpenPix via API]:::sistema
        S3[Atualiza Status da Cadeira: Ativo/Inativo]:::sistema
        S4[Bot WhatsApp Semanal (Edge Functions)]:::sistema
        S5[Transcrição de Áudio (Gemini IA)]:::sistema
        S6[Notificações Z-API para o Time/Aluno]:::sistema
    end

    %% ----------------------------------------------------
    subgraph Financeiro["💰 5. FINANCEIRO"]
        F1[Painel Financeiro: Gestão de Assinaturas]:::financeiro
        F2[Painel Financeiro: DRE e Fluxo de Caixa]:::financeiro
        F3[Churn Guard (Alerta de Quebra de Receita)]:::financeiro
        F4[Gestão de Notas e Reembolsos de Invoices]:::financeiro
    end

    %% ----------------------------------------------------
    subgraph Admin["⚙️ 6. ADMINISTRAÇÃO / TREINADOR"]
        AD1[Analisa Anamnese e Nível do Aluno]:::admin
        AD2[Modela Planilha e Carga de Treinos]:::admin
        AD3[Acompanha NPS e Alertas de Dores/Lesões]:::admin
        AD4[Gestão de Produtos Físicos (Loja/Estoque)]:::admin
        AD5[Gestão de Eventos (Paces e Distâncias)]:::admin
    end

    %% ====================================================
    %% LIGAÇÕES DO FLUXO (A JORNADA COMPLETA)
    %% ====================================================
    C1 -.->|Gera Tráfego| V1
    V1 --> V2 --> V3
    
    %% Decisão do Visitante
    V3 -->|Quer Assinar Plano| A1
    V3 -->|Quer Produto ou Evento| A6
    V3 -.->|Abandona Fluxo| C2
    C2 -.->|Remarketing| A1

    %% Jornada de Quem Virou Aluno
    A1 --> A2 --> A3
    A3 -->|Envia pra cobrança| S2
    S2 -->|Integração Pagamento Sucesso| S3
    S3 -->|Libera Acesso| A4
    S1 -.->|Termos Validados| AD1
    A2 --> S1
    S3 -->|Cadastra e Notifica| S6

    %% Aluno consumindo
    A4 -->|Treina e acompanha| A5

    %% Compras e Eventos (Avulso ou Aluno)
    A6 -->|Checkout| S2
    A6 -->|Compra Loja/Estoque| AD4
    A6 -->|Lote de Inscrição evento| AD5
    AD4 -.->|Controle Valor| F4
    AD5 -.->|Ticket Valor| F4

    %% Ação do Robô Semanal
    S4 -->|Envia Mensagem de Check-in no Sábado| A5
    A5 -->|Responde texto/áudio| S5
    S5 -->|Transcreve e Interpreta IP/Feedback| S4

    %% Robô entregando dados pra Base Operacional
    S4 -->|Quebra Reclamações e Dores| AD3
    S4 -->|Passa Feedback p/ Treino| AD2
    AD1 --> AD2
    AD3 -.->|Aviso Crítico de dor/saída| C4
    C4 -.->|Entra em contato com Aluno| A5

    %% Financeiro Operando
    S2 -->|Entrada de Receita| F1
    F1 --> F2
    S3 -.->|Inadimplente/Falhou Pagamento| F3
    F3 -->|Avisa de Risco financeiro| C3
    C3 -.->|Tenta reter financeiramente| A5
    F4 -->|Conciliação| F2

```

---

## 📖 Descritivo Detalhado: Como o Sistema Atende a Cada Papel

Para que todas as peças da empresa compreendam o sistema, aqui está o detalhamento de cada perfil de usuário.

### 1. 👤 O Aluno (Cliente Final)

- **Acesso e Compra:** Ele acessa o site, se cadastra para o plano de assessoria, preenche o seu formulário de saúde (Anamnese) e aceita os termos online com validação jurídica. Paga via PIX (OpenPix) ou Cartão de Crédito (Stripe).
- **O Painel Próprio:** Uma vez aprovado, tem acesso a um painel simples e móvel para ler seus treinos, atualizar o método de pagamento, e gerenciar compras.
- **Comunicação Automatizada:** Sem precisar instalar aplicativos, ele recebe lembretes no próprio WhatsApp (via integração Z-API). Se quiser relatar o treino por um áudio ("Senti dor na panturrilha hoje"), o Bot do sistema transcreve, interpreta e repassa no painel dos treinadores.
- **Compras e Eventos:** Com a conta criada, ele pode com 1-Clique comprar camisetas do clube e ingressos VIP para as provas organizadas pela instituição.

### 2. 💼 O Comercial e Marketing

- **Recuperação de Vendas:** Quando o sistema acusa erro de cartão ou abandono na finalização, o Comercial usa telas simplificadas (Painel Admin) para identificar os 'Leads' (exemplo, fulano parou na etapa 2 do cadastro).
- **Retenção de Alunos (Churn):** Quando um aluno dá uma nota baixa de NPS para o treino da semana ou o cartão for recusado na cobrança recorrente, o comercial interage prontamente com alertas na tela, disparando renegociações ou tentando salvar a experiência do cliente através de mensagens simpáticas humanizadas que seguem pós-esforço dos bots.

### 3. 💰 O Setor Financeiro

- **Fim das Planilhas Desatualizadas:** Todo o faturamento passa automaticamente entre os portões do Stripe / OpenPix e aterrissa no _Painel de Assinaturas Financeiras_ e do _Gerenciador de Invoices_.
- **Métrica DRE e Fluxos:** O módulo de "Expenses" (Despesas) e Fluxo de Caixa avaliam quanto entra de receita das mensalidades e compras de camisas, versus o que o clube gasta (anúncios, aluguel, sistemas).
- **Churn Guard proativo:** Uma área vital para prever perdas de faturamento. Mapeia quem está na iminência de não pagar ou quem ativamente cancelou antes da quebra contábil forte no final do mês.

### 4. ⚙️ A Administração, Diretoria e Treinadores (Operação Core)

- **Gestão de Treinos Centralizada:** Recebe as Anamneses perfeitas e juridicamente assinadas. Ajustas as planilhas semanais dentro da própria plataforma.
- **Monitoramento de Lesões/Dores:** O painel "Saúde & Automação Web" pesca ativamente a dor relatada pelo aluno no WhatsApp de Sábado, grifando nomes em amarelo ou vermelho. O treinador foca só em modificar o treino na semana seguinte para o aluno melhorar, poupando que passem dias perguntando individualmente um por um.
- **Estoque e Loja Otimizados:** Atualiza quantidades e banners de camisetas e bonés. As baixas de estoque são automáticas na venda.
- **Corridas Estruturadas:** A empresa cria a Página do Evento escolhendo datas, valores de kit, distâncias (ex: 5km, 10km) e opções de ritmo (Paces), sabendo antecipadamente por tabela quem irá, que camisa usa e cobrando por lá a logística da equipe.

### 5. 🤖 Sistema Automatizado e Bot de Inteligência Artificial (O Cérebro)

- **Robô Operário 24/7:** Edge Functions (rotinas em nuvem) conferem IP do visitante logado e amarram pagamentos webhook do banco direto p/ o banco de dados Supabase da empresa. Nenhuma intervenção humana na baixa do pagamento.
- **Atendimento Humanizado por IA:** A IA embarcada via "Gemini" escuta mensagens de voz enviadas pelo Aluno pelo Zap. O aluno manda 1 minuto de áudio relatando dificuldade; a IA transcreve, resume isso em uma "flag" (rótulo) de 'alerta de fadiga' e guarda textualmente o log para provar legalidade. Tira dos professores o peso enorme de ser um telemarketing.
- **Segurança (Compliance LGPD):** O motor valida consentimentos de e-mail e termos de aceite vinculados à assinatura, gerando rastreios que protegem completamente o ecossistema do clube na lei (Marco Civil e proteção a fraudes).

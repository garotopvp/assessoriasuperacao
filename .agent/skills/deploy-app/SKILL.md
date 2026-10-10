---
name: deploy-app
description: Esta skill auxilia no processo de deploy de aplicações, incluindo verificações de pré-requisitos, execução do deploy e validação pós-deploy. Use esta skill para automatizar e padronizar suas rotinas de implantação.
---

# Instruções da Skill: Deploy de Aplicações

Esta skill foi projetada para guiar e auxiliar no processo de deploy de aplicações. Ela pode ser adaptada para diferentes ambientes e tecnologias, mas a estrutura básica foca em garantir um deploy seguro e eficiente.

## Quando usar esta skill:

- Ao realizar o deploy de uma nova versão de uma aplicação.
- Ao configurar um ambiente de deploy pela primeira vez.
- Ao automatizar rotinas de CI/CD que envolvem a implantação de software.

## Procedimentos passo a passo:

1.  **Verificação de Pré-requisitos:**
    - Confirme se todas as dependências estão instaladas.
    - Verifique as variáveis de ambiente necessárias.
    - Certifique-se de que o ambiente de destino está acessível e configurado corretamente.
    - Exemplo de comando para verificar dependências (adapte conforme a tecnologia):
      ```bash
      npm install # Para projetos Node.js
      pip install -r requirements.txt # Para projetos Python
      ```

2.  **Preparação para o Deploy:**
    - Construa o projeto (se aplicável).
    - Execute testes unitários e de integração para garantir a estabilidade.
    - Gere artefatos de deploy (imagens Docker, pacotes de distribuição, etc.).
    - Exemplo de comando de build:
      ```bash
      npm run build
      ```

3.  **Execução do Deploy:**
    - Transfira os artefatos para o servidor de destino.
    - Reinicie os serviços ou atualize os contêineres.
    - Monitore o processo de deploy para identificar erros imediatamente.
    - Exemplo de comando de deploy (adapte para sua ferramenta, como `ssh`, `kubectl`, `aws cli`, `az cli`, etc.):

      ```bash
      # Exemplo com rsync para transferência de arquivos
      rsync -avz --delete ./dist/ user@your-server:/var/www/html/

      # Exemplo com Docker Compose
      ssh user@your-server "cd /path/to/app && docker-compose pull && docker-compose up -d"
      ```

4.  **Validação Pós-Deploy:**
    - Verifique a acessibilidade da aplicação (ex: ping, curl na URL).
    - Confirme a funcionalidade básica através de testes de fumaça (smoke tests).
    - Verifique os logs da aplicação para quaisquer erros ou avisos.
    - Exemplo de comando de validação:
      ```bash
      curl -I https://your-application.com
      ```

## Exemplos de entrada e saída esperada:

**Entrada do Usuário:**

> "Copilot, faça o deploy da minha aplicação web para o ambiente de produção."

**Saída Esperada do Copilot:**

> "Entendido. Vou iniciar o processo de deploy da sua aplicação web para produção. Primeiro, vou verificar os pré-requisitos..."
> (Seguido pelos passos de verificação, preparação, execução e validação, com feedback sobre cada etapa e possíveis comandos a serem executados ou sugeridos.)

## Referências a scripts ou recursos incluídos:

- `scripts/deploy.sh`: Um script shell de exemplo para automatizar os passos de deploy.
- `config/production.env`: Um arquivo de exemplo para variáveis de ambiente de produção.

## Comportamento automatizado desta skill

Este repositório inclui uma implementação mínima da skill com scripts e um workflow.

- Arquivos relevantes:
  - `deploy_skill/skill-config.json` — configura o comportamento da skill (ex.: `auto_confirm_production`).
  - `scripts/prechecks.sh` — valida pré-requisitos.
  - `scripts/deploy.sh` — orquestra build, transferência (rsync/ssh) e smoke tests.
  - `scripts/smoke_tests.sh` — testes de fumaça.
  - `.github/workflows/deploy.yml` — workflow manual (dispatch) para CI.

Padrão atual: `auto_confirm_production: true` (veja `deploy_skill/skill-config.json`). A skill executa automaticamente os passos não destrutivos e realiza deploy via SSH/rsync quando as variáveis `SSH_USER/SSH_HOST/SSH_PATH` estiverem configuradas como `secrets` no CI ou no ambiente.

Segurança: embora `auto_confirm_production` permita execução sem prompts, recomenda-se ambiente protegido e uso de `GitHub Environments` com aprovações manuais para deploys críticos em produção.

---

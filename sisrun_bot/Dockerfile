# Imagem OFICIAL do Playwright com Python - já tem Chromium e todas as dependências!
# Evita 100% dos problemas de instalação de dependências em ambientes cloud.
FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

# Diretório de trabalho dentro do container
WORKDIR /app

# Copiar só o requirements primeiro (cache do Docker)
COPY requirements.txt .

# Instalar as dependências Python (sem precisar reinstalar o Playwright, já vem na imagem)
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante do código
COPY . .

# Variáveis de ambiente (valores reais virão do painel do Render)
ENV PYTHONUNBUFFERED=1
ENV SISRUN_LOGIN=""
ENV SISRUN_SENHA=""

# Expor porta da API
EXPOSE 8000

# Comando para iniciar a API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

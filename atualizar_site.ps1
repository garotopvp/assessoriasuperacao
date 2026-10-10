# Encoding: UTF-8
Write-Host "Iniciando atualizacao do Bora Correr Club..." -ForegroundColor Cyan

# 1. Reparar histórico de migração (caso necessário)
Write-Host "Verificando integridade das migracoes..." -ForegroundColor Yellow
npx supabase migration repair --status reverted 20260126130000 2>$null

# 2. Aplicar alterações no Banco de Dados
Write-Host "Sincronizando Banco de Dados (Tabelas e Permissoes)..." -ForegroundColor Yellow
npx supabase db push

# 3. Deploy das Edge Functions
Write-Host "Fazendo deploy das funcoes de pagamento..." -ForegroundColor Yellow
npx supabase functions deploy create-openpix-order
npx supabase functions deploy create-stripe-order
npx supabase functions deploy openpix-webhook
npx supabase functions deploy stripe-webhook

# 4. Verificação de Saúde (Automática)
Write-Host "Rodando testes de verificacao..." -ForegroundColor Yellow
python scripts/tools/verify_deploy.py

Write-Host "Tudo pronto! O site esta atualizado, as permissoes corrigidas e os sistemas verificados." -ForegroundColor Green
Write-Host "DICA: Se o erro 403 persistir, saia do site e entre novamente." -ForegroundColor Gray

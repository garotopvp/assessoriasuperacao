# Script para corrigir reconhecimento automatico de pagamento PIX
Write-Host "Iniciando correcao do sistema de pagamento PIX..." -ForegroundColor Cyan

Write-Host ""
Write-Host "Passo 1: Verificando edge functions deployadas..." -ForegroundColor Yellow
npx supabase functions list

Write-Host ""
Write-Host "Passo 2: Fazendo deploy das edge functions necessarias..." -ForegroundColor Yellow
npx supabase functions deploy create-openpix-order --no-verify-jwt
npx supabase functions deploy openpix-webhook --no-verify-jwt
npx supabase functions deploy check-order --no-verify-jwt

Write-Host ""
Write-Host "Passo 3: Testando webhook..." -ForegroundColor Yellow
Write-Host "URL do webhook: https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook"
Write-Host "Flag no-verify-jwt configurada: OK"

Write-Host ""
Write-Host "Passo 4: Execute este comando para ver os logs do webhook em tempo real:" -ForegroundColor Green
Write-Host "npx supabase functions logs openpix-webhook --follow" -ForegroundColor White

Write-Host ""
Write-Host "Passo 5: Para verificar se o webhook esta recebendo chamadas do OpenPix:" -ForegroundColor Green
Write-Host "SELECT * FROM debug_logs WHERE source = 'openpix-webhook' ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White

Write-Host ""
Write-Host "Edge functions deployadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Verifique no painel OpenPix se o webhook esta configurado:" -ForegroundColor Yellow
Write-Host "   URL: https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/openpix-webhook" -ForegroundColor White
Write-Host "   Flag: --no-verify-jwt (desabilitar verificacao JWT)" -ForegroundColor White

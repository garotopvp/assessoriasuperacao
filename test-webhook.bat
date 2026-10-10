@echo off
echo Testando webhook manualmente...
echo.

curl -X POST https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/zapi-webhook ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"5513996633210\",\"text\":{\"message\":\"teste manual\"},\"type\":\"ReceivedCallback\"}"

echo.
echo.
echo Teste enviado! Verifique se recebeu mensagem no WhatsApp.
pause

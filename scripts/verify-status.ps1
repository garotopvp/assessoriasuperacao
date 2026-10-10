#!/usr/bin/env pwsh
# Script de verificação do status do projeto Bora Correr Club

Write-Host "🏃 BORA CORRER CLUB - VERIFICAÇÃO DE STATUS" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host "📦 Verificando npm..." -ForegroundColor Cyan
$npmVersion = npm --version 2>$null
if ($npmVersion) {
    Write-Host "✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ npm não encontrado" -ForegroundColor Red
    exit 1
}

# Verificar dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules existe" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules não encontrado. Execute: npm install" -ForegroundColor Red
}

# Verificar arquivos críticos
Write-Host ""
Write-Host "📄 Verificando arquivos críticos..." -ForegroundColor Cyan

$criticalFiles = @(
    ".env.local",
    "src/App.tsx",
    "src/main.tsx",
    "supabase/functions/validate-cpf/index.ts",
    "supabase/functions/send-email/index.ts",
    "supabase/functions/delete-account/index.ts",
    "supabase/functions/sentry-webhook-handler/index.ts",
    "README.md",
    "DEPLOY.md"
)

$missing = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file" -ForegroundColor Red
        $missing += $file
    }
}

# Verificar páginas criadas
Write-Host ""
Write-Host "📄 Verificando páginas novas..." -ForegroundColor Cyan

$newPages = @(
    "src/pages/RecuperarSenha.tsx",
    "src/pages/RedefinirSenha.tsx",
    "src/pages/PoliticaPrivacidade.tsx",
    "src/pages/TermosUso.tsx",
    "src/pages/ExportarDados.tsx",
    "src/pages/ExcluirConta.tsx",
    "src/pages/AdminDashboard.tsx",
    "src/pages/MeusPedidos.tsx"
)

$pagesOk = 0
foreach ($page in $newPages) {
    if (Test-Path $page) {
        $pagesOk++
    }
}
Write-Host "✅ $pagesOk / $($newPages.Count) páginas criadas" -ForegroundColor Green

# Verificar componentes
Write-Host ""
Write-Host "📦 Verificando componentes novos..." -ForegroundColor Cyan

$newComponents = @(
    "src/components/admin/AdminMetrics.tsx",
    "src/components/common/CookieConsent.tsx",
    "src/components/common/SEO.tsx",
    "src/components/common/OptimizedImage.tsx",
    "src/components/payment/PaymentHistory.tsx",
    "src/components/products/ProductSearch.tsx"
)

$componentsOk = 0
foreach ($component in $newComponents) {
    if (Test-Path $component) {
        $componentsOk++
    }
}
Write-Host "✅ $componentsOk / $($newComponents.Count) componentes criados" -ForegroundColor Green

# Verificar Edge Functions
Write-Host ""
Write-Host "⚡ Verificando Edge Functions..." -ForegroundColor Cyan

$edgeFunctions = @(
    "supabase/functions/validate-cpf",
    "supabase/functions/send-email",
    "supabase/functions/delete-account",
    "supabase/functions/sentry-webhook-handler"
)

$functionsOk = 0
foreach ($function in $edgeFunctions) {
    if (Test-Path $function) {
        $functionsOk++
    }
}
Write-Host "✅ $functionsOk / $($edgeFunctions.Count) Edge Functions criadas" -ForegroundColor Green

# Teste de build
Write-Host ""
Write-Host "🔨 Testando build de produção..." -ForegroundColor Cyan
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build executado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Build falhou. Verifique os erros acima." -ForegroundColor Red
}

# Resumo final
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "📊 RESUMO FINAL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host "✅ Páginas: $pagesOk / $($newPages.Count)" -ForegroundColor Green
Write-Host "✅ Componentes: $componentsOk / $($newComponents.Count)" -ForegroundColor Green
Write-Host "✅ Edge Functions: $functionsOk / $($edgeFunctions.Count)" -ForegroundColor Green

if ($missing.Count -eq 0) {
    Write-Host ""
    Write-Host "🎉 TUDO OK! O projeto está pronto para deploy!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Arquivos faltando:" -ForegroundColor Yellow
    foreach ($file in $missing) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Configure as variáveis de ambiente (.env.local)" -ForegroundColor White
Write-Host "  2. Deploy das Edge Functions (supabase functions deploy)" -ForegroundColor White
Write-Host "  3. Configure os secrets no Supabase" -ForegroundColor White
Write-Host "  4. Deploy no Vercel (vercel deploy --prod)" -ForegroundColor White
Write-Host ""

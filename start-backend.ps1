# Script para iniciar el servidor backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando Servidor Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

Write-Host "Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "Iniciando servidor en puerto 4000..." -ForegroundColor Green
Write-Host ""
npm run dev


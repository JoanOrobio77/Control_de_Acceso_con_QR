@echo off
echo ========================================
echo   Iniciando Servidor Backend
echo ========================================
echo.

cd backend

echo Verificando dependencias...
call npm list --depth=0 >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor en puerto 4000...
echo.
call npm run dev

pause


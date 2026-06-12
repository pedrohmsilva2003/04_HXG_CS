@echo off
REM ==============================================
REM Iniciar Portal Hexagon - Colaborador
REM Porta: 3019
REM ==============================================

color 0B
title Portal Hexagon - Colaborador (3019)

echo.
echo ======================================
echo   PORTAL HEXAGON - COLABORADOR
echo   Iniciando na porta 3019...
echo ======================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [*] Instalando dependencias...
    call npm install
    echo.
)

echo [*] Iniciando servidor Vite...
echo.
call npm run dev

pause

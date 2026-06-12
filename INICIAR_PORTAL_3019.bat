@echo off
setlocal
cd /d "%~dp0"
cd /d "01 hexagon-portal-colaborador"
:: inicia Vite na porta 3019 conforme vite.config.ts
echo Iniciando Vite (porta 3019)...
call npm run dev
endlocal

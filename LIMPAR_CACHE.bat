@echo off
echo ========================================
echo Limpando cache do Vite COMPLETO
echo ========================================
echo.

echo [1/4] Parando servidor (se estiver rodando)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] Removendo cache do Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache .vite removido!
)

echo [3/4] Removendo dist...
if exist "dist" (
    rmdir /s /q "dist"
    echo Dist removido!
)

echo [4/4] Removendo .cache...
if exist ".cache" (
    rmdir /s /q ".cache"
    echo .cache removido!
)

echo.
echo ========================================
echo Cache limpo! Agora execute:
echo INICIAR_PORTAL_3019.bat
echo ========================================
pause

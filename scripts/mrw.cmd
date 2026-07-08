@echo off
rem Lanzador CLI de MarkView: `mrw [archivo.md]` abre la app sin bloquear la
rem terminal (cada invocacion es una ventana independiente).
rem Busca MarkView.exe en su propia carpeta (%~dp0): funciona en la copia
rem INSTALADA por scripts/install-cli.ps1, no ejecutado desde el repositorio.
if not exist "%~dp0MarkView.exe" (
    echo mrw: no hay MarkView.exe junto a este script ^(%~dp0^).
    echo Este es el shim fuente del repositorio. Instala el CLI con:
    echo     .\scripts\install-cli.ps1
    echo y usa `mrw` desde una terminal NUEVA ^(fuera de la carpeta scripts^).
    exit /b 1
)
start "" "%~dp0MarkView.exe" %*

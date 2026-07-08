@echo off
rem Lanzador CLI de MarkView: `mrw [archivo.md]` abre la app sin bloquear la
rem terminal (cada invocacion es una ventana independiente).
rem Debe vivir junto a MarkView.exe; lo instala scripts/install-cli.ps1.
start "" "%~dp0MarkView.exe" %*

<#
.SYNOPSIS
    Instala el comando `mrw` de MarkView (estilo `code` de VS Code).

.DESCRIPTION
    Copia MarkView.exe y el shim mrw.cmd a un directorio de instalación por
    usuario (por defecto %LocalAppData%\Programs\MarkView) y añade ese
    directorio al PATH del usuario. No toca el registro del sistema ni
    requiere permisos de administrador.

    Tras instalar, abre una terminal NUEVA y usa:
        mrw notas.md      # abre (o crea al guardar) notas.md
        mrw               # abre MarkView vacío

.PARAMETER SourceDir
    Directorio donde está MarkView.exe. Por defecto build\bin del repositorio
    (relativo a este script). Útil con un binario descargado de un release.

.PARAMETER InstallDir
    Destino de la instalación. Por defecto %LocalAppData%\Programs\MarkView.

.PARAMETER Uninstall
    Elimina el directorio de instalación y su entrada del PATH del usuario.

.EXAMPLE
    .\scripts\install-cli.ps1
    .\scripts\install-cli.ps1 -SourceDir C:\Descargas
    .\scripts\install-cli.ps1 -Uninstall
#>
[CmdletBinding()]
param(
    [string]$SourceDir = (Join-Path $PSScriptRoot '..\build\bin'),
    [string]$InstallDir = (Join-Path $env:LocalAppData 'Programs\MarkView'),
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'

# Añade o quita $dir del PATH del usuario (nunca el PATH de máquina).
function Set-UserPathEntry([string]$dir, [bool]$remove) {
    $current = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @($current -split ';' | Where-Object { $_ -ne '' })
    $has = $entries -contains $dir

    if ($remove -and $has) {
        $entries = $entries | Where-Object { $_ -ne $dir }
        [Environment]::SetEnvironmentVariable('Path', ($entries -join ';'), 'User')
        Write-Host "PATH de usuario: eliminado $dir"
    } elseif (-not $remove -and -not $has) {
        [Environment]::SetEnvironmentVariable('Path', (@($entries) + $dir -join ';'), 'User')
        Write-Host "PATH de usuario: añadido $dir"
    }
}

if ($Uninstall) {
    if (Test-Path $InstallDir) {
        Remove-Item -Recurse -Force $InstallDir
        Write-Host "Eliminado $InstallDir"
    }
    Set-UserPathEntry $InstallDir $true
    Write-Host 'MarkView CLI desinstalado. Abre una terminal nueva para que el PATH se refresque.'
    return
}

$exe = Join-Path $SourceDir 'MarkView.exe'
if (-not (Test-Path $exe)) {
    throw "No se encontró $exe. Compila primero con 'wails build' o indica -SourceDir."
}

New-Item -ItemType Directory -Force $InstallDir | Out-Null
Copy-Item $exe (Join-Path $InstallDir 'MarkView.exe') -Force
Copy-Item (Join-Path $PSScriptRoot 'mrw.cmd') (Join-Path $InstallDir 'mrw.cmd') -Force
Set-UserPathEntry $InstallDir $false

Write-Host "MarkView instalado en $InstallDir"
Write-Host "Abre una terminal NUEVA y prueba:  mrw notas.md"

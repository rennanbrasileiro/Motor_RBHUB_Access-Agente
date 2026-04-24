param(
  [string]$TargetDir = "C:\RBHubAgent",
  [string]$TaskName = "RBHubAccessAgent",
  [switch]$KeepData
)

$ErrorActionPreference = "Stop"

function Ensure-Admin {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Execute este desinstalador como Administrador."
  }
}

function Stop-ExistingTask {
  param([string]$Name)
  try { schtasks /End /TN $Name 2>$null | Out-Null } catch {}
  try { schtasks /Delete /TN $Name /F 2>$null | Out-Null } catch {}
}

function Stop-ExistingProcess {
  param([string]$Dir)
  Get-CimInstance Win32_Process |
    Where-Object { $_.CommandLine -like "*$Dir*" } |
    ForEach-Object {
      try {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
      } catch {}
    }
}

Ensure-Admin

Write-Host "==> Removendo RBHub Access Agent" -ForegroundColor Cyan

Stop-ExistingTask -Name $TaskName
Stop-ExistingProcess -Dir $TargetDir

if (Test-Path $TargetDir) {
  if ($KeepData) {
    Write-Host "Mantendo database e logs; removendo apenas binários/scripts." -ForegroundColor Yellow

    $itemsToRemove = @(
      "dist",
      "config",
      "node",
      "node_modules",
      "installer",
      "docs",
      "package.json",
      "package-lock.json",
      "run-agent.bat",
      "start-agent.cmd",
      "stop-agent.cmd",
      "status-agent.cmd",
      "reconcile-commands.ps1",
      "README-OPERACIONAL.txt"
    )

    foreach ($item in $itemsToRemove) {
      $path = Join-Path $TargetDir $item
      if (Test-Path $path) {
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
      }
    }
  } else {
    Write-Host "Removendo instalação completa em $TargetDir" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $TargetDir -ErrorAction SilentlyContinue
  }
}

Write-Host "Desinstalação concluída." -ForegroundColor Green
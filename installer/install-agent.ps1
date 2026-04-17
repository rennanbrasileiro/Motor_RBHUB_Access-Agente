param(
  [string]$TargetDir = "C:\RBHubAgent",
  [string]$TaskName = "RBHubAccessAgent",
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function Ensure-Admin {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Execute este instalador como Administrador."
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

function Safe-CopyDir {
  param(
    [string]$Source,
    [string]$Destination
  )
  if (Test-Path $Source) {
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Copy-Item -Path (Join-Path $Source "*") -Destination $Destination -Recurse -Force
  }
}

Ensure-Admin

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot
$NodeExe = Join-Path $TargetDir "node\node.exe"
$StartCmd = Join-Path $TargetDir "start-agent.cmd"
$StatusUrl = "http://localhost:3001/api/status"

Write-Step "Validando origem do projeto"
$requiredPaths = @(
  (Join-Path $ProjectRoot "dist"),
  (Join-Path $ProjectRoot "config"),
  (Join-Path $ProjectRoot "node_modules"),
  (Join-Path $ProjectRoot "installer"),
  (Join-Path $ProjectRoot "start-agent.cmd"),
  (Join-Path $ProjectRoot "stop-agent.cmd"),
  (Join-Path $ProjectRoot "status-agent.cmd")
)
foreach ($p in $requiredPaths) {
  if (-not (Test-Path $p)) {
    throw "Arquivo/pasta obrigatória ausente: $p"
  }
}

Write-Step "Parando instalação anterior, se existir"
Stop-ExistingTask -Name $TaskName
Stop-ExistingProcess -Dir $TargetDir

Write-Step "Criando estrutura de pastas"
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir "logs") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir "database") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $TargetDir "backup") | Out-Null

Write-Step "Fazendo backup do config e database, se existirem"
if (Test-Path (Join-Path $TargetDir "config\default.config.json")) {
  Copy-Item (Join-Path $TargetDir "config\default.config.json") (Join-Path $TargetDir "backup\default.config.json.bak") -Force
}
if (Test-Path (Join-Path $TargetDir "database\agent.db")) {
  Copy-Item (Join-Path $TargetDir "database\agent.db") (Join-Path $TargetDir "backup\agent.db.bak") -Force
}
if (Test-Path (Join-Path $TargetDir "database\agent-state.json")) {
  Copy-Item (Join-Path $TargetDir "database\agent-state.json") (Join-Path $TargetDir "backup\agent-state.json.bak") -Force
}

Write-Step "Copiando arquivos do projeto"
Safe-CopyDir -Source (Join-Path $ProjectRoot "dist") -Destination (Join-Path $TargetDir "dist")
Safe-CopyDir -Source (Join-Path $ProjectRoot "config") -Destination (Join-Path $TargetDir "config")
Safe-CopyDir -Source (Join-Path $ProjectRoot "node_modules") -Destination (Join-Path $TargetDir "node_modules")
Safe-CopyDir -Source (Join-Path $ProjectRoot "docs") -Destination (Join-Path $TargetDir "docs")
Safe-CopyDir -Source (Join-Path $ProjectRoot "installer") -Destination (Join-Path $TargetDir "installer")

if (Test-Path "C:\tools\node-v20.20.2-win-x64") {
  Safe-CopyDir -Source "C:\tools\node-v20.20.2-win-x64" -Destination (Join-Path $TargetDir "node")
} elseif (Test-Path (Join-Path $ProjectRoot "node")) {
  Safe-CopyDir -Source (Join-Path $ProjectRoot "node") -Destination (Join-Path $TargetDir "node")
} else {
  throw "Node portátil não encontrado. Esperado em C:\tools\node-v20.20.2-win-x64 ou .\node"
}

$filesToCopy = @(
  "package.json",
  "package-lock.json",
  "run-agent.bat",
  "start-agent.cmd",
  "stop-agent.cmd",
  "status-agent.cmd",
  "reconcile-commands.ps1",
  "README-OPERACIONAL.txt"
)
foreach ($f in $filesToCopy) {
  $src = Join-Path $ProjectRoot $f
  if (Test-Path $src) {
    Copy-Item $src $TargetDir -Force
  }
}

Write-Step "Validando node portátil"
if (-not (Test-Path $NodeExe)) {
  throw "node.exe não encontrado em $NodeExe"
}
& $NodeExe -v

Write-Step "Registrando inicialização automática"
$taskCommand = 'cmd.exe /c "title RBHubAccessAgent && C:\RBHubAgent\start-agent.cmd"'
schtasks /Create /TN $TaskName /TR $taskCommand /SC ONSTART /RL HIGHEST /F | Out-Null

if (-not $SkipStart) {
  Write-Step "Iniciando o Agent agora"
  schtasks /Run /TN $TaskName | Out-Null
  Start-Sleep -Seconds 8
}

Write-Step "Validando endpoint local"
try {
  $response = Invoke-RestMethod -Uri $StatusUrl -TimeoutSec 10
  Write-Host "Instalação concluída com sucesso." -ForegroundColor Green
  Write-Host "Status local disponível em: $StatusUrl"
  $response | ConvertTo-Json -Depth 10
} catch {
  Write-Warning "O Agent foi instalado, mas o endpoint local ainda não respondeu."
  Write-Warning "Valide manualmente em: $StatusUrl"
}
param(
  [string]$TargetDir = "C:\RBHub\AccessAgent"
)

Write-Host "Criando diretório em $TargetDir"
New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
Copy-Item -Recurse -Force "$PSScriptRoot\..\dist\*" $TargetDir
Copy-Item -Recurse -Force "$PSScriptRoot\..\config" $TargetDir
Copy-Item -Recurse -Force "$PSScriptRoot\..\src\server\static" "$TargetDir\src\server\static"
Set-Location $TargetDir
node .\installer\installService.js
Write-Host "Instalação concluída. Abra http://localhost:3001 após iniciar o serviço."

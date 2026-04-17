param(
  [string]$TargetDir = "C:\RBHub\AccessAgent"
)

Set-Location $TargetDir
node .\installer\uninstallService.js
Write-Host "Serviço removido. Você pode apagar $TargetDir manualmente se desejar."

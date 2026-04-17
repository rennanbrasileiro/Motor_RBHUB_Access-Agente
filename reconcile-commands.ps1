$apiUrl = "https://ptywquctuuyphgosvbwk.supabase.co/functions/v1/integration-api/device-commands/ack"
$apiKey = "658756d441ccc1b1d026a177e9fc841caa750f0147ccc4f285380b5df4c0adef"
$deviceId = "0319eb1e-611e-4612-98b5-3f7d479bdfdf"
$tenantId = "82f9d53b-c23b-4ee1-897b-1047e4306587"

$headers = @{
  "x-api-key" = $apiKey
  "Content-Type" = "application/json"
}

# Coloque aqui os commandIds que ainda estão aparecendo como sent/pending no Lovable
$commandIds = @(
  "32f08341-68d2-4113-b6f1-e7422b493586",
  "016ad0f1-26f6-49d9-9cd3-baa0ff7c4b88",
  "7a4a0259-62c5-43a1-a5b2-956cedc7c2e6",
  "56fd24de-765e-4064-afac-b71ceae9c97e",
  "7ffd2e0c-29fe-4a25-8386-5e6b27be147b",
  "9b64ce8e-a5f7-4a2f-bfb7-78e84b47bc9c",
  "de0169f3-7ff9-4f28-8d88-d7612eac22dd",
  "ffacc801-aa4f-4e94-98d1-4d828eac0c45",
  "e8f84315-5245-4066-bf06-b4366993371f",
  "3938570e-1b37-41b6-8bd4-4aea166e03c3",
  "97ddd592-77b6-43b1-b41b-0249aa7c92b3"
)

foreach ($commandId in $commandIds) {
  $body = @{
    command_id = $commandId
    device_id = $deviceId
    tenant_id = $tenantId
    status = "executed"
    executed_at = (Get-Date).ToString("o")
    result = @{
      ok = $true
      source = "manual-reconcile"
      note = "reconciled from terminal"
    }
  } | ConvertTo-Json -Depth 5

  try {
    $resp = Invoke-RestMethod -Uri $apiUrl -Method POST -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "OK  -> $commandId"
  } catch {
    Write-Host "FAIL -> $commandId"
    try {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $reader.BaseStream.Position = 0
      $reader.DiscardBufferedData()
      $responseBody = $reader.ReadToEnd()
      Write-Host $responseBody
    } catch {
      Write-Host $_.Exception.Message
    }
  }
}
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://127.0.0.1:3002/status' | ConvertTo-Json -Compress } catch { Write-Host 'Servidor Topdata offline'; exit 1 }"

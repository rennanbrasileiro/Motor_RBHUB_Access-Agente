@echo off
call "C:\RBHubAgent\topdata-sdk\ensure-topdata-server.cmd" >nul
if %ERRORLEVEL% NEQ 0 (
  echo ERRO: servidor Topdata nao iniciou.
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod 'http://127.0.0.1:3002/unlock?catraca=1' | ConvertTo-Json -Compress"

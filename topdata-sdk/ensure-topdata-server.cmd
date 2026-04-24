@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod 'http://127.0.0.1:3002/status' | Out-Null; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
  echo Topdata server ja esta ativo.
  exit /b 0
)

echo Iniciando Topdata server...
start "RBHub Topdata SDK Server" /min "C:\RBHubAgent\topdata-sdk\TopdataSdkServer.exe"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 20;$i++){ try { Invoke-RestMethod 'http://127.0.0.1:3002/status' | Out-Null; $ok=$true; break } catch { Start-Sleep -Milliseconds 500 } }; if($ok){ exit 0 } else { exit 1 }"
exit /b %ERRORLEVEL%

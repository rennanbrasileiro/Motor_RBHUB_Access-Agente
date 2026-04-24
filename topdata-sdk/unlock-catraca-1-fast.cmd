@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-RestMethod 'http://127.0.0.1:3002/unlock?catraca=1' | ConvertTo-Json -Compress"

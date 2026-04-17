@echo off
taskkill /F /IM node.exe 2>nul
wmic process where "CommandLine like '%%RBHubAgent%%dist\\main.js%%'" delete 2>nul
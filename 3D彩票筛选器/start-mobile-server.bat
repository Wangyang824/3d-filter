@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File ".\start-mobile-server.ps1"
pause

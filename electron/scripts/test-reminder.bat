@echo off
REM Double-cliquer pour tester les rappels SPARK (notification + planification 1 min)
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0test-reminder.ps1" -All
pause

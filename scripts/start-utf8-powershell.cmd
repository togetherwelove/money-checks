@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -NoExit -Command ". '%~dp0enable-powershell-utf8.ps1'; Set-Location -LiteralPath '%CD%'"

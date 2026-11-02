@echo off
chcp 65001 >nul
title AI Skills Hub - Web Portal & Auto Sync
cd /d "%~dp0"

echo ====================================================
echo 🚀 Starting AI Skills Hub & Auto Sync Engine...
echo ====================================================
echo.

:: 1. Build initial index and zip
echo [1/3] Building latest skills catalog and bundle zip...
node build_portal.js
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check node installation.
    pause
    exit /b %errorlevel%
)

:: 2. Launch Server in background
echo.
echo [2/3] Launching Local HTTP Server on port 5050...
start "AI Skills Web Server" /min node server.js

:: 3. Open browser
echo [3/3] Opening web browser...
start http://localhost:5050

:: 4. Start auto-sync file watcher
echo.
echo ====================================================
echo ✨ AI Skills Hub is now running!
echo 🌐 Web URL: http://localhost:5050
echo ⚡ File Watcher is active. Any edits will auto-update the web!
echo (Keep this window open to maintain background auto-sync)
echo ====================================================
echo.
node watch_and_sync.js

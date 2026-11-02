@echo off
chcp 65001 >nul
title Update AI Skills Hub
cd /d "%~dp0"

echo ====================================================
echo 🔄 Updating AI Skills Hub Web Portal & Bundle Zip...
echo ====================================================
node build_portal.js
echo.
echo ====================================================
echo ✅ Update complete!
echo ====================================================
pause

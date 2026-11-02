@echo off
chcp 65001 >nul
title Merge Updates From USB
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0merge_from_usb.ps1"

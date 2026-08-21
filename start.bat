@echo off
setlocal enabledelayedexpansion
title TVmunk - bgn Task & Workflow Hub
color 0B

echo ========================================================
echo   TVmunk - bgn Task & Workflow Dashboard
echo   Workflow: 1. bgn square 2. bgn squad 3. bgn smash
echo ========================================================
echo.

:: Add default Node.js install paths to PATH if not already present
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs"

:: Find Node executable
where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "NODE_EXE=C:\Program Files\nodejs\node.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "NODE_EXE=%LOCALAPPDATA%\Programs\nodejs\node.exe"
    ) else (
        echo [ERROR] Node.js is not found on this computer.
        echo Please install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
) else (
    set "NODE_EXE=node"
)

echo [OK] Using Node: !NODE_EXE!
echo.
echo Starting TVmunk TaskHub Server...
echo.

:: Open browser after 1.5 seconds in background
start /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

:: Start the Express server
"!NODE_EXE!" server.js

pause

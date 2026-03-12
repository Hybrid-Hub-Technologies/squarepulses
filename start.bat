@echo off
REM ============================================================
REM SquarePulse + OpenClaw Quick Start Script (Windows)
REM ============================================================
REM 
REM This script starts all components of the system
REM Usage: start.bat

setlocal enabledelayedexpansion

cls
echo.
echo 🚀 Starting SquarePulse + OpenClaw Complete System
echo ==================================================
echo.

REM Check if we're in right directory
if not exist "backend\package.json" (
    echo ❌ Error: Please run from squarepulses root directory
    pause
    exit /b 1
)

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo ✓ Node.js %NODE_VER% detected
echo.

REM Start backend server
echo [1/3] Starting Backend Server...
start "SquarePulse Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak
echo     ✓ Backend running on http://localhost:5000
echo.

REM Start OpenClaw
echo [2/3] Starting OpenClaw...
timeout /t 2 /nobreak
start "OpenClaw Gateway" cmd /k "openclaw start"
timeout /t 3 /nobreak
echo     ✓ OpenClaw running on http://localhost:18789
echo.

REM Open dashboard
echo [3/3] Opening Dashboard in browser...
timeout /t 2 /nobreak
start http://localhost:18789

echo.
echo ==================================================
echo ✅ System is running!
echo.
echo 📊 URLs:
echo   • Backend: http://localhost:5000
echo   • OpenClaw: http://localhost:18789
echo   • Frontend: Open index.html in browser
echo.
echo 📋 Commands:
echo   • View logs: openclaw logs --follow
echo   • Check status: openclaw status
echo   • See positions: openclaw positions
echo.
echo ⏹️  Stop everything: Close the terminal windows
echo ==================================================
echo.
echo Windows will open new terminals for Backend and OpenClaw.
echo Keep them open for the system to run.
echo.
pause

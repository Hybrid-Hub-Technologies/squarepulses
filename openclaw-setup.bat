@echo off
REM ============================================================
REM SquarePulse + OpenClaw Installation Setup Script (Windows)
REM ============================================================
REM 
REM This script sets up the complete system with OpenClaw
REM Run: openclaw-setup.bat

setlocal enabledelayedexpansion

echo.
echo 🚀 SquarePulse + OpenClaw Setup Wizard
echo ========================================
echo.

REM Check Node.js
echo ✓ Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Install from https://nodejs.org (v22+)
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM Check npm
echo ✓ Checking npm...
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ npm not found
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
cd backend
call npm install
cd ..
if errorlevel 1 (
    echo ❌ npm install failed
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Setup environment file
echo 🔧 Configuring environment...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
    ) else (
        echo # SquarePulse + OpenClaw Environment > .env
        echo PORT=5000 >> .env
        echo ENCRYPTION_KEY=change-this-strong-key >> .env
        echo GROQ_API_KEY=your-api-key-here >> .env
    )
    echo ⚠️  .env file created. Please edit it with your API keys
) else (
    echo ✓ .env exists
)
echo.

REM Create logs directory
echo 📁 Creating logs directory...
if not exist logs mkdir logs
echo ✓ Logs directory created
echo.

REM Install axios if not present
echo 🔨 Building OpenClaw integration...
cd backend
call npm install axios
cd ..
echo ✓ Integration built
echo.

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit .env with your API keys:
echo    - GROQ_API_KEY
echo    - EMAIL_USER ^& EMAIL_PASSWORD
echo    - ENCRYPTION_KEY (generate a strong random key)
echo    - OPENCLAW_AUTH_TOKEN
echo.
echo 2. Start the system:
echo    - Backend: npm run dev (in backend folder)
echo    - Frontend: Open index.html in browser
echo.
echo 3. Start OpenClaw:
echo    - iwr -useb https://openclaw.ai/install.ps1 ^| iex
echo    - openclaw onboard --install-daemon
echo    - openclaw dashboard
echo.
echo 📚 Documentation: Read SQUAREPULSE_OPENCLAW_SETUP.md
pause

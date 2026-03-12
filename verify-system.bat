@echo off
REM ============================================================
REM SquarePulse + OpenClaw System Verification Script (Windows)
REM ============================================================
REM 
REM Run this to verify all components are installed correctly
REM Usage: verify-system.bat

setlocal enabledelayedexpansion

cls
echo.
echo 🔍 SquarePulse + OpenClaw System Verification
echo ==============================================
echo.

set PASSED=0
set FAILED=0

REM ── Check Node.js ────────────────────────────────────────
echo Checking Node.js...
where node >nul 2>nul
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo   ✓ Found !NODE_VER!
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND
    set /a FAILED+=1
)

REM ── Check npm ────────────────────────────────────────────
echo Checking npm...
where npm >nul 2>nul
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
    echo   ✓ Found npm !NPM_VER!
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND
    set /a FAILED+=1
)

REM ── Check backend folder ─────────────────────────────────
echo Checking backend folder...
if exist "backend\" (
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND
    set /a FAILED+=1
)

REM ── Check package.json ───────────────────────────────────
echo Checking package.json...
if exist "backend\package.json" (
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND
    set /a FAILED+=1
)

REM ── Check node_modules ───────────────────────────────────
echo Checking Node modules...
if exist "backend\node_modules\" (
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND - Run: cd backend ^&^& npm install
    set /a FAILED+=1
)

REM ── Check .env file ──────────────────────────────────────
echo Checking backend\.env...
if exist "backend\.env" (
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND - Copy .env.example to .env
    set /a FAILED+=1
)

REM ── Check OpenClaw ──────────────────────────────────────
echo Checking OpenClaw...
where openclaw >nul 2>nul
if !errorlevel! equ 0 (
    for /f "tokens=*" %%i in ('openclaw --version') do set OPENCLAW_VER=%%i
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND - Run: iwr -useb https://openclaw.ai/install.ps1 ^| iex
    set /a FAILED+=1
)

REM ── Check OpenClaw config ────────────────────────────────
echo Checking OpenClaw config...
if exist "openclaw\config\openclaw.config.js" (
    echo   ✓ Found
    set /a PASSED+=1
) else (
    echo   ✗ NOT FOUND
    set /a FAILED+=1
)

REM ── Check frontend files ─────────────────────────────────
echo Checking frontend files...
if exist "index.html" (
    if exist "style.css" (
        if exist "core.js" (
            echo   ✓ Found all
            set /a PASSED+=1
        ) else (echo   ✗ core.js missing & set /a FAILED+=1)
    ) else (echo   ✗ style.css missing & set /a FAILED+=1)
) else (echo   ✗ index.html missing & set /a FAILED+=1)

REM ── Check documentation ──────────────────────────────────
echo Checking documentation...
if exist "SQUAREPULSE_OPENCLAW_SETUP.md" (
    if exist "README.md" (
        echo   ✓ Found
        set /a PASSED+=1
    ) else (echo   ✗ README.md missing & set /a FAILED+=1)
) else (echo   ✗ SQUAREPULSE_OPENCLAW_SETUP.md missing & set /a FAILED+=1)

REM ── Summary ──────────────────────────────────────────────
echo.
echo ==============================================
echo Results: %PASSED% passed ✓ ^| %FAILED% failed ✗
echo ==============================================
echo.

if %FAILED% equ 0 (
    echo ✅ All systems ready!
    echo.
    echo Next steps:
    echo 1. Edit backend\.env with your API keys
    echo 2. Run: start.bat
    echo 3. Visit: http://localhost:18789
    echo.
    pause
) else (
    echo ⚠️  Please fix the issues above before starting
    echo.
    echo Common fixes:
    echo • Install Node.js: https://nodejs.org
    echo • Install OpenClaw: iwr -useb https://openclaw.ai/install.ps1 ^| iex
    echo • Install npm packages: cd backend ^&^& npm install
    echo • Copy .env file: copy backend\.env.example backend\.env
    echo.
    pause
)

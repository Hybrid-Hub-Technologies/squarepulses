@echo off
REM SquarePulse Local Network Status Checker
color 0B
cls
echo.
echo ╔═══════════════════════════════════════════════════════════════════╗
echo ║            SQUAREPULSE - LOCAL NETWORK STATUS CHECKER             ║
echo ╚═══════════════════════════════════════════════════════════════════╝
echo.

REM Get local IP
for /f "tokens=2 delims=: " %%A in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /C:"192"') do set IP=%%A

echo 🖥️  LOCAL MACHINE IP: %IP%
echo.

REM Check Backend
echo Checking Services...
echo.

REM Check Port 5000 (Backend)
echo ⏳ Backend Server (Port 5000)...
netstat -ano | findstr :5000 >nul
if errorlevel 1 (
    echo   ❌ NOT RUNNING
) else (
    echo   ✅ RUNNING - http://%IP%:5000
)

REM Check Port 80 (XAMPP)
echo ⏳ XAMPP Web Server (Port 80)...
netstat -ano | findstr :80 >nul
if errorlevel 1 (
    echo   ❌ NOT RUNNING
) else (
    echo   ✅ RUNNING - http://%IP%
)

echo.
echo ═══════════════════════════════════════════════════════════════════
echo 📋 CONFIGURED ACCESS POINTS:
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 🌐 Frontend (Main Interface)
echo    http://%IP%/squarepulses/index.html
echo.
echo 📡 Backend API
echo    http://%IP%:5000
echo    Health Check: http://%IP%:5000/health
echo.
echo 🎯 API Endpoints
echo    Posts:     http://%IP%:5000/api/posts
echo    Portfolio: http://%IP%:5000/api/portfolio
echo    Chat:      http://%IP%:5000/api/chat
echo.
echo ═══════════════════════════════════════════════════════════════════
echo 💡 QUICK START:
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 1️⃣  Run START_LOCAL_NETWORK.bat to start all services
echo 2️⃣  Open browser: http://%IP%/squarepulses/index.html
echo 3️⃣  Access from any device on your network using the same URL
echo.
echo ═══════════════════════════════════════════════════════════════════
echo.
pause

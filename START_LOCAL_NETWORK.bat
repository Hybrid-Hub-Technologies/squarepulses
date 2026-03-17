@echo off
color 0A
cls
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║       SQUAREPULSE - LOCAL NETWORK SERVER STARTUP              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Get local IP
for /f "tokens=2 delims=: " %%A in ('ipconfig ^| findstr /C:"IPv4" ^| findstr /C:"192"') do set IP=%%A

echo 📍 LOCAL NETWORK IP: %IP%
echo.
echo Starting services...
echo.

REM Start Backend Server
cd /d c:\xampp\htdocs\squarepulse\squarepulses\backend
echo 🚀 Starting Backend Server (Port 5000)...
start "SquarePulse Backend" node server.js
timeout /t 3 /nobreak

REM Start OpenClaw Integration
cd /d c:\xampp\htdocs\squarepulse\squarepulses\openclaw
echo 🤖 Starting OpenClaw Integration (Port 18789)...
timeout /t 2 /nobreak

REM Open Frontend in Browser
cd /d c:\xampp\htdocs\squarepulse\squarepulses
echo 🌐 Opening SquarePulse Frontend...
timeout /t 2 /nobreak
start http://%IP%/squarepulses/index.html

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    🎉 ALL SERVICES RUNNING                     ║
echo ╠════════════════════════════════════════════════════════════════╣
echo ║ Frontend:  http://%IP%/squarepulses/index.html
echo ║ Backend:   http://%IP%:5000                                     
echo ║ OpenClaw:  http://%IP%:18789                                    
echo ║                                                                ║
echo ║ ✅ You can now access from any device on your network!         ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
pause

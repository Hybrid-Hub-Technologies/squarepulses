#!/bin/bash

# ============================================================
# SquarePulse + OpenClaw Quick Start Script
# ============================================================
# 
# This script starts all components of the system
# Usage: bash start.sh

echo ""
echo "🚀 Starting SquarePulse + OpenClaw Complete System"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Please run from squarepulses root directory"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Start backend server
echo -e "${BLUE}[1/3]${NC} Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
sleep 2
echo -e "${GREEN}    ✓ Backend running (PID: $BACKEND_PID)${NC}"
echo ""

# Start OpenClaw
echo -e "${BLUE}[2/3]${NC} Starting OpenClaw..."
sleep 1
openclaw start &
OPENCLAW_PID=$!
sleep  2
echo -e "${GREEN}    ✓ OpenClaw running (PID: $OPENCLAW_PID)${NC}"
echo ""

# Open dashboard
echo -e "${BLUE}[3/3]${NC} Opening Dashboard..."
sleep 2

if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:18789"  # Linux
elif command -v open &> /dev/null; then
    open "http://localhost:18789"  # macOS
fi

echo -e "${GREEN}✓ Dashboard open at http://localhost:18789${NC}"
echo ""
echo "=================================================="
echo -e "${GREEN}✅ System is running!${NC}"
echo ""
echo "📊 URLs:"
echo "  • Backend: http://localhost:5000"
echo "  • OpenClaw: http://localhost:18789"
echo "  • Frontend: file:///path/to/index.html"
echo ""
echo "📋 Commands:"
echo "  • View logs: openclaw logs --follow"
echo "  • Check status: openclaw status"
echo "  • See positions: openclaw positions"
echo ""
echo "⏹️  Stop everything: Press Ctrl+C or run: ./stop.sh"
echo ""

# Wait for user to stop
wait

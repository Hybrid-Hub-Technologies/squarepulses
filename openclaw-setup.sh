#!/bin/bash

# ============================================================
# SquarePulse + OpenClaw Installation Setup Script
# ============================================================
# 
# This script sets up the complete system with OpenClaw
# Run: bash openclaw-setup.sh

echo "🚀 SquarePulse + OpenClaw Setup Wizard"
echo "========================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org (v22+)"
    exit 1
fi
echo "✓ Node.js $(node -v) found"
echo ""

# Check npm
echo "✓ Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✓ npm $(npm -v) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install
cd ..
echo "✓ Dependencies installed"
echo ""

# Setup environment file
echo "🔧 Configuring environment..."
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
    echo "⚠️  .env file created. Please edit it with your API keys"
else
    echo "✓ .env exists"
fi
echo ""

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs
echo "✓ Logs directory created"
echo ""

# Build OpenClaw integration
echo "🔨 Building OpenClaw integration..."
cd backend
npm install axios 2>/dev/null
cd ..
echo "✓ Integration built"
echo ""

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your API keys:"
echo "   - GROQ_API_KEY"
echo "   - EMAIL_USER & EMAIL_PASSWORD"
echo "   - ENCRYPTION_KEY (generate: openssl rand -base64 32)"
echo "   - OPENCLAW_AUTH_TOKEN"
echo ""
echo "2. Start the system:"
echo "   - Backend: npm run dev (in backend folder)"
echo "   - Frontend: Open index.html in browser"
echo ""
echo "3. Start OpenClaw:"
echo "   - openclaw onboard --install-daemon"
echo "   - openclaw dashboard"
echo ""
echo "📚 Documentation: Read SQUAREPULSE_OPENCLAW_SETUP.md"

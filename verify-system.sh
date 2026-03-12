#!/bin/bash

# ============================================================
# SquarePulse + OpenClaw System Verification Script
# ============================================================
# 
# Run this to verify all components are installed correctly
# Usage: bash verify-system.sh

echo ""
echo "🔍 SquarePulse + OpenClaw System Verification"
echo "=============================================="
echo ""

PASSED=0
FAILED=0

# ── Check Node.js ────────────────────────────────────────
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    echo "✓ Found $NODE_VER"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check npm ────────────────────────────────────────────
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VER=$(npm -v)
    echo "✓ Found npm $NPM_VER"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check Git ────────────────────────────────────────────
echo -n "Checking Git... "
if command -v git &> /dev/null; then
    GIT_VER=$(git -v | awk '{print $3}')
    echo "✓ Found Git $GIT_VER"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check backend folder ─────────────────────────────────
echo -n "Checking backend folder... "
if [ -d "backend" ]; then
    echo "✓ Found"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check package.json ───────────────────────────────────
echo -n "Checking package.json... "
if [ -f "backend/package.json" ]; then
    echo "✓ Found"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check node_modules ───────────────────────────────────
echo -n "Checking Node modules installed... "
if [ -d "backend/node_modules" ]; then
    echo "✓ Found ($(ls backend/node_modules | wc -l) modules)"
    ((PASSED++))
else
    echo "✗ NOT FOUND - Run: cd backend && npm install"
    ((FAILED++))
fi

# ── Check .env file ──────────────────────────────────────
echo -n "Checking backend/.env... "
if [ -f "backend/.env" ]; then
    echo "✓ Found"
    ((PASSED++))
else
    echo "✗ NOT FOUND - Copy .env.example to .env"
    ((FAILED++))
fi

# ── Check OpenClaw ──────────────────────────────────────
echo -n "Checking OpenClaw... "
if command -v openclaw &> /dev/null; then
    OPENCLAW_VER=$(openclaw --version 2>&1 | head -1)
    echo "✓ Found ($OPENCLAW_VER)"
    ((PASSED++))
else
    echo "✗ NOT FOUND - Run: curl -fsSL https://openclaw.ai/install.sh | bash"
    ((FAILED++))
fi

# ── Check OpenClaw config ────────────────────────────────
echo -n "Checking OpenClaw config... "
if [ -f "openclaw/config/openclaw.config.js" ]; then
    echo "✓ Found"
    ((PASSED++))
else
    echo "✗ NOT FOUND"
    ((FAILED++))
fi

# ── Check OpenClaw skills ───────────────────────────────
echo -n "Checking OpenClaw skills... "
if [ -d "openclaw/skills" ] && [ $(ls openclaw/skills/*.js 2>/dev/null | wc -l) -ge 3 ]; then
    SKILL_COUNT=$(ls openclaw/skills/*.js 2>/dev/null | wc -l)
    echo "✓ Found ($SKILL_COUNT skills)"
    ((PASSED++))
else
    echo "✗ NOT FOUND or incomplete"
    ((FAILED++))
fi

# ── Check frontend files ─────────────────────────────────
echo -n "Checking frontend files... "
if [ -f "index.html" ] && [ -f "style.css" ] && [ -f "core.js" ]; then
    echo "✓ Found all"
    ((PASSED++))
else
    echo "✗ MISSING FILES"
    ((FAILED++))
fi

# ── Check documentation ──────────────────────────────────
echo -n "Checking documentation... "
if [ -f "SQUAREPULSE_OPENCLAW_SETUP.md" ] && [ -f "README.md" ]; then
    echo "✓ Found"
    ((PASSED++))
else
    echo "✗ MISSING"
    ((FAILED++))
fi

# ── Summary ──────────────────────────────────────────────
echo ""
echo "=============================================="
echo "Results: $PASSED passed ✓ | $FAILED failed ✗"
echo "=============================================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All systems ready!"
    echo ""
    echo "Next steps:"
    echo "1. Edit backend/.env with your API keys"
    echo "2. Run: bash start.sh"
    echo "3. Visit: http://localhost:18789"
    echo ""
    exit 0
else
    echo "⚠️  Please fix the issues above before starting"
    echo ""
    echo "Common fixes:"
    echo "• Install Node.js: https://nodejs.org"
    echo "• Install OpenClaw: curl -fsSL https://openclaw.ai/install.sh | bash"
    echo "• Install npm packages: cd backend && npm install"
    echo "• Copy .env file: cp backend/.env.example backend/.env"
    echo ""
    exit 1
fi

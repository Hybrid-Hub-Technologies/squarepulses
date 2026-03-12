# 🤖 SquarePulse + OpenClaw – Complete System Setup & Documentation

**Version:** 1.0.0  
**Last Updated:** March 12, 2026  
**Status:** Production Ready ✅

---

## 📑 Table of Contents

1. [What is This System?](#what-is-this-system)
2. [OpenClaw + SquarePulse Integration](#openclaw--squarepulse-integration)
3. [System Architecture](#system-architecture)
4. [Quick Start (5 Minutes)](#quick-start-5-minutes)
5. [Installation Steps](#installation-steps)
6. [Configuration Guide](#configuration-guide)
7. [How to Use](#how-to-use)
8. [OpenClaw Commands](#openclaw-commands)
9. [Trading Workflow](#trading-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Security Best Practices](#security-best-practices)
12. [FAQ](#faq)

---

## What is This System?

**SquarePulse** is a 24/7 AI-powered trading system that:
- ✅ Creates trading posts automatically
- ✅ Monitors prices every 15 minutes
- ✅ Auto-posts on Binance when targets hit
- ✅ Sends email alerts for all trades
- ✅ Stores encrypted API keys securely
- ✅ Tracks win/loss history with CSV export

**OpenClaw** is an AI assistant that:
- 🤖 Runs on your computer/server
- 🤖 Executes real trading commands
- 🤖 Connects to chat apps (Telegram, WhatsApp, etc.)
- 🤖 Can be extended with custom skills

**This integration** = SquarePulse + OpenClaw working together for a fully automated trading system

---

## OpenClaw + SquarePulse Integration

### What You Get

```
OpenClaw AI ──────────→ [Integration Layer] ──────────→ SquarePulse Backend
                                   ↓
                        [3 Trading Skills]
                        • Trading Manager
                        • Price Monitor
                        • Market Alerts
```

### Key Features

| Feature | Before | After |
|---------|--------|-------|
| **Interface** | Web only | Web + Chat Apps |
| **Automation** | Scheduled | AI-driven |
| **Control** | Manual clicks | Voice/Chat commands |
| **Monitoring** | Browser always open | 24/7 AI watching |
| **Scalability** | Single user | Multi-user ready |

---

## System Architecture

### Frontend Layer
```
┌─────────────────────────────────────┐
│   Browser (index.html)              │
├─────────────────────────────────────┤
│ • Post Composer                     │
│ • My Trades Dashboard               │
│ • API Key Manager (Encrypted)       │
│ • Email Configuration               │
└─────────────────────────────────────┘
         ↓         ↑
    JSON API (HTTPS)
         ↓         ↑
```

### Backend Layer
```
┌──────────────────────────────────────────────────────┐
│   Express Server (Node.js)                           │
├──────────────────────────────────────────────────────┤
│ • POST /api/posts - Save new trade                  │
│ • GET /api/posts - List all trades                  │
│ • GET /api/posts/alerts/pending - Check TP/SL      │
│ • POST /api/users/:id/api-key - Store encrypted key│
│ • GET /api/health - Server health check            │
└──────────────────────────────────────────────────────┘
         ↓         ↑
    Monitor Service (runs every 15 min)
    • Check prices via CoinGecko API
    • Compare with user's TP/SL levels
    • Auto-post to Binance Square on hits
    • Send email notifications
         ↓
    SQLite Database
    • users (encrypted API keys)
    • posts (all trades)
    • price_history (for analytics)
```

### OpenClaw Layer
```
┌──────────────────────────────────────────────────────┐
│   OpenClaw Gateway (AI Agent)                        │
├──────────────────────────────────────────────────────┤
│ • Web Dashboard (http://localhost:18789)            │
│ • Terminal Interface (CLI)                          │
│ • Telegram Bot (optional)                           │
│ • WhatsApp Bot (optional)                           │
└──────────────────────────────────────────────────────┘
         ↓         ↑
    [Integration Layer]
         ↓         ↑
    [3 Skills: Trading | Prices | Alerts]
         ↓         ↑
    Backend API (http://localhost:5000)
```

---

## Quick Start (5 Minutes)

### Windows Users

```powershell
# 1. Open PowerShell in your squarepulses folder

# 2. Run setup script
.\openclaw-setup.bat

# 3. Edit .env file with your keys

# 4. Start backend (in backend folder)
npm run dev

# 5. Open frontend
start index.html

# 6. Install OpenClaw (one-time)
iwr -useb https://openclaw.ai/install.ps1 | iex

# 7. Start OpenClaw
openclaw onboard --install-daemon
openclaw dashboard

# 8. Access dashboard
# http://localhost:18789 (in your browser)
```

### macOS/Linux Users

```bash
# 1. Open terminal in squarepulses folder

# 2. Run setup script
bash openclaw-setup.sh

# 3. Edit .env file with your keys
cp .env.example .env
nano .env  # or your favorite editor

# 4. Start backend (in backend folder)
npm run dev

# 5. Install OpenClaw (one-time)
curl -fsSL https://openclaw.ai/install.sh | bash

# 6. Start OpenClaw
openclaw onboard --install-daemon
openclaw dashboard

# 7. Access dashboard
# http://localhost:18789 (in your browser or press Enter)
```

---

## Installation Steps

### Step 1: Prerequisites

You need to have installed:
- **Node.js** 22+ (Download: https://nodejs.org)
- **Git** (Download: https://git-scm.com)
- **A code editor** (VS Code: https://code.visualstudio.com)

Verify installation:
```bash
node -v      # Should show v22.0.0 or higher
npm -v       # Should show 10.0.0 or higher
git -v       # Should show git version
```

### Step 2: Clone/Download SquarePulse

```bash
# If using Git
git clone https://github.com/Hybrid-Hub-Technologies/squarepulses.git
cd squarepulses

# Or download ZIP and extract
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

This installs:
- ✅ express - Web server
- ✅ axios - HTTP requests
- ✅ sqlite3 - Database
- ✅ cors - Cross-origin requests
- ✅ nodemailer - Email notifications
- ✅ dotenv - Environment variables
- ✅ node-cron - Automated tasks

### Step 4: Create & Configure .env File

```bash
# In the backend folder, create .env
PORT=5000
NODE_ENV=development

# ========== DATABASE ==========
DATABASE_FILE=posts.db

# ========== ENCRYPTION ==========
# Generate a strong key (on any system):
# Linux/Mac: openssl rand -base64 32
# Windows PowerShell: [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) | Select-Object -First 32
ENCRYPTION_KEY=your-generated-32-char-key-here

# ========== EMAIL NOTIFICATIONS ==========
# Use Gmail + App Password (NOT your regular password!)
# Generate: https://myaccount.google.com/apppasswords
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# ========== AI MODELS ==========
# OpenAI (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-...your-key...

# Groq (https://console.groq.com)
GROQ_API_KEY=gsk_...your-key...

# Google Gemini (https://ai.google.dev)
GEMINI_API_KEY=your-key...

# ========== OPENCLAW ==========
OPENCLAW_AUTH_TOKEN=your-secure-32-char-token-here
OPENCLAW_BACKEND_URL=http://localhost:5000

# ========== OPTIONAL INTEGRATIONS ==========
# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id

# Slack Bot (optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...

# Log level: debug, info, warn, error
LOG_LEVEL=info
```

### Step 5: Install OpenClaw

#### Windows PowerShell
```powershell
# Install OpenClaw globally
iwr -useb https://openclaw.ai/install.ps1 | iex

# Verify
openclaw --version
```

#### macOS/Linux
```bash
# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

If you get "command not found":
- Restart your terminal
- Or add to PATH: `export PATH="$PATH:~/.openclaw/bin"`

### Step 6: Configure OpenClaw

```bash
# Run interactive setup
openclaw onboard --install-daemon

# You'll be asked to choose:
# 1. Security settings (accept defaults)
# 2. Model (pick: OpenAI, Groq, or Gemini)
# 3. Channels (recommended: Web only, add Telegram later)
# 4. API keys (add here or skip)
# 5. Skills (enable all: trading, prices, alerts)
```

### Step 7: Start Everything

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
# Output: 🚀 SquarePulse Backend Server Running on http://localhost:5000
```

**Terminal 2 - OpenClaw:**
```bash
openclaw start
# Output: 🎯 OpenClaw Gateway started on http://localhost:18789
```

**Terminal 3 - OpenClaw Dashboard:**
```bash
openclaw dashboard
# Opens http://localhost:18789 in browser automatically
```

**Browser - Frontend:**
```
Open: file:///c:/xampp/htdocs/squarepulse/squarepulses/index.html
```

---

## Configuration Guide

### Backend Configuration

Edit `backend/.env`:

```env
# ====== CRITICAL SETTINGS ======
ENCRYPTION_KEY=Generated from: openssl rand -base64 32
EMAIL_USER=Your Gmail address
EMAIL_PASSWORD=Your Gmail app password (NOT regular password!)

# ====== AI MODEL SELECTION ======
# Choose ONE:
OPENAI_API_KEY=For GPT-4 (Most reliable)
GROQ_API_KEY=For Groq (Fastest, free tier)
GEMINI_API_KEY=For Google Gemini (Free tier available)

# ====== OPTIONAL ======
TELEGRAM_BOT_TOKEN=Only if you want Telegram bot
SLACK_BOT_TOKEN=Only if you want Slack bot
```

### OpenClaw Configuration

Edit `openclaw/config/openclaw.config.js`:

```javascript
// Change these settings:
openclaw: {
  gateway: {
    port: 18789, // Change if port is busy
    auth: {
      token: process.env.OPENCLAW_AUTH_TOKEN
    }
  }
}

channels: {
  web: {
    enabled: true // Web dashboard
  },
  telegram: {
    enabled: false // Set to true after configuring
  },
  whatsapp: {
    enabled: false
  }
}

features: {
  autoTrading: true,      // Allow AI to auto-trade
  priceMonitoring: true,  // 24/7 monitoring
  emailAlerts: true       // Send email notifications
}
```

### Frontend Configuration

Edit `index.html` (optional):

```javascript
// Line ~50, adjust if needed:
const BACKEND_URL = 'http://localhost:5000';
const POLLING_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
```

---

## How to Use

### Method 1: Web Dashboard (Recommended for Learning)

1. Go to `http://localhost:18789`
2. Click "Chat" tab
3. Type commands in natural language:
   ```
   "Open a BTC position at 50000 with TP 52000 and SL 48000"
   "Show my open positions"
   "What's the price of ETH?"
   ```

### Method 2: Terminal/CLI

```bash
# Check status
openclaw status

# Get active positions
openclaw positions

# Open a position
openclaw trade open --symbol BTC --entry 50000 --tp 52000 --sl 48000

# Check price
openclaw price --symbol BTC
```

### Method 3: Traditional Web Interface

1. Go to `http://localhost:3000` (or file://path/to/index.html)
2. Configure API keys in settings
3. Create trades manually
4. System auto-monitors and posts

### Method 4: Chat Apps (After Setup)

**Telegram:**
```
/start
@YourBotName open position BTC at 50000
@YourBotName show positions
@YourBotName price btc
```

**WhatsApp:**
```
Send to bot number: "open position BTC at 50000"
Send: "show positions"
Send: "price eth"
```

---

## OpenClaw Commands

### Trading Commands

```
// Open position
"Open a BTC position at 50000 with TP1 52000, TP2 54000, SL 48000"
"Long ETH at 3000, targets 3100 and 3200, stop at 2900"
"Enter ADA at 1.2, take profit 1.3, stop 1.1, size 100"

// Close position
"Close position POS-1234567890 at current market price"
"Exit my BTC trade at 51500"
"Close all positions"

// View positions
"Show my open positions"
"What trades do I have?"
"My portfolio status"
"Get trading stats"
```

### Price Commands

```
// Current price
"What's the price of BTC?"
"Get ETH price"
"Current price of DOGE"

// Price targets
"Is BTC near my take profit?"
"Check if ETH is close to 3100"
"Monitor BTC at 55000"

// Market analysis
"Analyze BTC market"
"Give me market data for ETH"
```

### Alert Commands

```
// Set alerts
"Alert me when BTC hits 55000"
"Notify me if ETH drops below 2900"
"Set volatility alert for BTC at 5%"

// View alerts
"Show my active alerts"
"List all price watches"
"Cancel alert ALERT-123"

// News
"Get BTC news"
"What's trending in crypto?"
"Check market sentiment"
```

### System Commands

```
// Status
"System status" or "openclaw status"
"Backend health" or "server running?"
"Integration status" or "everything working?"

// Help
"Help" or "what can you do?"
"Show commands" or "list available skills"
"Teach me how to trade"
```

---

## Trading Workflow

### Step-by-Step Example

#### 1. You Identify a Trade Setup

You see BTC forming a bullish pattern at $50,000

#### 2. Command OpenClaw to Open Trade

**Using Web Dashboard:**
```
Type: "Open BTC position at 50000, TP1 52000, TP2 54000, SL 48000"
OpenClaw: "✅ Position opened: BTC at $50,000"
```

**Using CLI:**
```bash
openclaw trade open --symbol BTC --entry 50000 --tp1 52000 --tp2 54000 --sl 48000
```

**Using Traditional Interface:**
- Go to index.html
- Fill form: BTC, 50000, 52000, 54000, 48000
- Click "Save Trade"

#### 3. System Auto-Monitors

Every 15 minutes, the backend:
- ✅ Checks BTC current price via CoinGecko
- ✅ Compares with your TP1, TP2, SL levels
- ✅ If hit: automatically posts to Binance Square
- ✅ Sends email notification with P&L

#### 4. You Get Notified

**Email Alert Example:**
```
Subject: ✅ TP1 HIT - BTC Position Closed!

Your BTC position has hit Take Profit 1!

Entry: $50,000
Exit: $52,000
Profit: +$2,000 (+4%)
Time: 2 hours 30 minutes

Position has been posted to Binance Square.
```

#### 5. Historical Tracking

All trades saved to "My Posts" tab:
- Entry price
- Exit price
- Time held
- P&L amount
- Win/Loss status

Export as CSV for tax records

### Example Trades

**Trade 1: Scalp BTC**
```
Type: "Scalp BTC from 50000 to 50500, stop 49800, size 10"
→ Takes profit in minutes → Email alert → Saved ✓
```

**Trade 2: Swing ETH**
```
Type: "Swing ETH at 3000, TP 3200, SL 2800, leverage 2x"
→ Auto-monitors for hours → Email on exit → CSV exported ✓
```

**Trade 3: Multi-Target DOGE**
```
Type: "DOGE long at 0.30, TP1 0.32, TP2 0.35, TP3 0.40, SL 0.28"
→ Posts on each TP → Tracks partial closes → Full report ✓
```

---

## Troubleshooting

### Problem: "OpenClaw command not found"

**Windows:**
```powershell
# Restart PowerShell
# Or add to PATH:
$env:Path += ";$env:LOCALAPPDATA\Programs\OpenClaw\bin"
```

**Mac/Linux:**
```bash
# Add to ~/.bash_profile or ~/.zshrc:
export PATH="$PATH:~/.openclaw/bin"

# Reload:
source ~/.bash_profile  # or source ~/.zshrc
```

### Problem: "Backend not connecting"

```bash
# Check if server is running
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# If not running, start it:
cd backend
npm run dev

# Check logs:
tail -f logs/openclaw.log
```

### Problem: "Email not sending"

1. Verify Gmail app password (NOT regular password)
   - Go to: https://myaccount.google.com/apppasswords
   - Generate new "App password"
   - Copy 16-char code to .env

2. Check if 2FA is enabled:
   ```
   Google Account → Security → 2-Step Verification (must be ON)
   ```

3. Test email manually:
   ```bash
   # In backend folder:
   node -e "require('./utils/emailNotification').sendTestEmail()"
   ```

### Problem: "Database locked error"

```bash
# Delete and recreate database
rm posts.db  # or del posts.db (Windows)

# Restart server
npm run dev
```

### Problem: "Position not auto-posting"

1. Check monitoring is running:
   ```bash
   openclaw status
   # Should show: "monitoring: active"
   ```

2. Check API key is encrypted:
   ```bash
   # In web dashboard:
   Settings → API Keys → Should be grayed out/encrypted
   ```

3. Check logs:
   ```bash
   tail -f logs/openclaw.log
   # Look for "checking position" lines
   ```

### Problem: "Port 5000 or 18789 already in use"

```bash
# Change port in .env:
PORT=5001  # Change to different port

# Or kill existing process:
# Windows:
taskkill /PID 1234 /F

# Mac/Linux:
kill -9 1234
```

---

## Security Best Practices

### ⚠️ Critical Security Rules

1. **Never expose to internet**
   ```
   ❌ Don't: openclaw gateway --public
   ✅ Do: Run on localhost only (default)
   ```

2. **Use strong encryption key**
   ```bash
   # Generate 32-character random key:
   # Windows PowerShell:
   -join ((33..126) | Get-Random -Count 32 | % {[char]$_})
   
   # Mac/Linux:
   openssl rand -base64 32
   ```

3. **Use Gmail app password**
   ```
   ❌ Don't: Use your actual Gmail password
   ✅ Do: Generate app-specific password at myaccount.google.com/apppasswords
   ```

4. **Secure your API keys**
   ```javascript
   ❌ Never: Paste keys in console
   ❌ Never: Commit .env to GitHub
   ✅ Do: Store in .env (which is in .gitignore)
   ✅ Do: Use environment variable manager (1Password, Vault, etc.)
   ```

5. **Limit access**
   ```
   ❌ Don't: Share your OpenClaw dashboard URL
   ❌ Don't: Use simple passwords like "123" or "abc"
   ✅ Do: Use auth token from openclaw.config.js
   ✅ Do: Change default token to random 32-char
   ```

### Security Checklist

Before going live:

- [ ] Strong encryption key generated
- [ ] Gmail app password created (2FA enabled)
- [ ] OpenClaw auth token changed (32+ characters)
- [ ] .env file added to .gitignore
- [ ] No sensitive data in code
- [ ] Firewall allows only localhost access
- [ ] Run security audit: `openclaw security audit --fix`
- [ ] Backup database: `cp posts.db posts.db.backup`

### Running Security Audit

```bash
# Check for security issues
openclaw security audit

# Auto-fix some issues
openclaw security audit --fix

# View detailed report
openclaw security audit --verbose
```

---

## FAQ

### Q: Can I use this on my phone?
**A:** OpenClaw can connect to Telegram/WhatsApp, so yes! Set up the Telegram bot in openclaw config and message it from your phone.

### Q: What if I want to keep the old web interface?
**A:** Both work together! Keep using index.html AND use OpenClaw at the same time. They share the same database.

### Q: Do I need to keep my computer on 24/7?
**A:** No, deploy on a cheap VPS ($5/month) and run the system there. OpenClaw supports remote backends.

### Q: How much does OpenClaw cost?
**A:** OpenClaw is free! But you need paid API keys for AI models:
- OpenAI: $0.01-0.03 per trade
- Groq: FREE tier available
- Gemini: FREE tier available

### Q: Can I automate even more?
**A:** Yes! Edit openclaw/config/openclaw.config.js hooks section:
```javascript
hooks: {
  onBoot: ['start monitoring', 'check positions'],
  onTradeAlert: ['send email', 'log to database'],
  // ... add your own
}
```

### Q: What about multiple AI models?
**A:** You can switch models in OpenClaw dashboard anytime. All API keys stored encrypted in database.

### Q: How do I backup my trades?
**A:** 
```bash
# Automatic backup
openclaw backup

# Manual backup
cp posts.db posts.db.$(date +%Y-%m-%d).backup
cp -r logs logs-backup

# Export CSV from My Posts tab
```

### Q: Can this trade for me automatically?
**A:** Yes! But set strict rules:
```javascript
// In openclaw.config.js
features: {
  autoTrading: true,  // Enable auto-trading
  maxPositionSize: 1000,  // Max trade size
  maxLeverage: 2,  // Max 2x
  dailyLossLimit: 500  // Stop if -$500
}
```

### Q: How do I update the system?
```bash
# Update SquarePulse
git pull origin main

# Update OpenClaw
openclaw update

# Update Node dependencies
cd backend
npm update
cd ..
```

### Q: What happens if the server crashes?
OpenClaw has auto-recovery:
```bash
# Daemon automatically restarts on crash (if installed with --install-daemon)
openclaw status  # Check status

# Manually restart
openclaw restart

# Or use system service:
sudo systemctl restart openclaw  # Linux
```

---

## Monitoring & Maintenance

### Daily Checklist

```bash
# Check system health
openclaw status

# View recent logs
tail -50 logs/openclaw.log

# Check backend
curl http://localhost:5000/api/health

# Verify positions are being monitored
openclaw positions
```

### Weekly Maintenance

```bash
# Backup database
cp posts.db posts.db.$(date +%Y-%m-%d).backup

# Check logs for errors
grep ERROR logs/openclaw.log

# Review closed trades
# Go to My Posts tab → download CSV

# Update dependencies
cd backend && npm update && cd ..
```

### Monthly Tasks

```bash
# Update OpenClaw
openclaw update

# Review security settings
openclaw security audit

# Optimize database
sqlite3 posts.db "VACUUM;"

# Check API key usage/limits
# LoginVto each API provider's dashboard
```

---

## Support & Resources

### Documentation
- OpenClaw Official: https://openclaw.ai/docs
- SquarePulse GitHub: https://github.com/Hybrid-Hub-Technologies/squarepulses
- Node.js Docs: https://nodejs.org/docs

### Getting Help

**For OpenClaw issues:**
```bash
# Official Discord
# https://discord.gg/openclaw

# Check logs
openclaw logs --follow

# Test integration
openclaw test-integration
```

**For SquarePulse issues:**
```bash
# Check backend logs
tail -f logs/openclaw.log

# Test endpoints
curl -X GET http://localhost:5000/api/health

# Check database
sqlite3 posts.db ".tables"
```

### API References

- CoinGecko (Free price data): https://www.coingecko.com/api
- OpenAI API: https://platform.openai.com/docs
- Groq API: https://console.groq.com/docs
- Binance Square API: https://binance.com/square/api

---

## Upgrade & Migration

### From Old SquarePulse (No OpenClaw)

If you have the old system:

```bash
# 1. Backup your database
cp posts.db posts.db.old

# 2. Install OpenClaw
# (see Installation section above)

# 3. Database will be automatically migrated
npm run dev

# 4. Old trades appear in My Posts tab
```

### From Other Trading Tools

```bash
# 1. Export your trades as CSV
# 2. Convert to SquarePulse format:
# 
# Required columns:
# - timestamp (date)
# - coin_symbol (BTC, ETH, etc.)
# - entry_price (number)
# - tp1, tp2 (numbers)
# - sl (number)
# - status (open/closed)

# 3. Import via database:
# Go to Settings → Import CSV
```

---

## System Requirements

### Minimum

- **CPU:** 1 core
- **RAM:** 512 MB
- **Storage:** 100 MB
- **Network:** 1 Mbps

### Recommended

- **CPU:** 2+ cores
- **RAM:** 2 GB
- **Storage:** 1 GB
- **Network:** 10 Mbps

### Production (VPS)

Example cheap options:
- **DigitalOcean:** $5/month (1GB RAM, 1 vCPU)
- **Linode:** $5/month (1GB RAM, 1 vCPU)
- **AWS EC2:** Free tier first year (1GB RAM)
- **Hetzner:** €3/month (2GB RAM, 1 vCPU)

---

## Testing the System

### Test 1: Backend Health

```bash
curl http://localhost:5000/api/health

# Expected response:
# {"status":"Server running","timestamp":"2026-03-12T10:00:00.000Z"}
```

### Test 2: Create Test Trade

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user",
    "coin_symbol": "BTC",
    "entry_price": 50000,
    "tp1": 52000,
    "tp2": 54000,
    "sl": 48000,
    "position_size": 1
  }'

# Expected: {"success":true,"postId":"POST-123456789"}
```

### Test 3: List Trades

```bash
curl http://localhost:5000/api/posts?user_id=test-user

# Expected: {"posts":[{"id":"POST-...","coin_symbol":"BTC",...}]}
```

### Test 4: OpenClaw Integration

```bash
# In OpenClaw dashboard or terminal:
openclaw test-integration

# Or manual test:
openclaw positions
openclaw price --symbol BTC
openclaw alert --symbol BTC --target 55000 --condition above
```

### Test 5: Email Notifications

```bash
# Test via API
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com"}'

# You should receive a test email within 1 minute
```

---

## Common Configurations

### Setup 1: Solo Trader (Web Only)

```javascript
// openclaw/config/openclaw.config.js

channels: {
  web: { enabled: true },
  telegram: { enabled: false },
  whatsapp: { enabled: false }
}

features: {
  autoTrading: true,
  priceMonitoring: true,
  emailAlerts: true
}
```

### Setup 2: Mobile Trader (Telegram Bot)

```javascript
channels: {
  web: { enabled: true },
  telegram: {
    enabled: true,
    botToken: process.env.TELEGRAM_BOT_TOKEN
  }
}
```

### Setup 3: Team Trading

```javascript
channels: {
  web: { enabled: true },
  slack: { enabled: true },
  telegram: { enabled: true }
}

// Multiple users in database
// Each user gets their own positions
```

### Setup 4: Headless (Server/VPS Only)

```javascript
channels: {
  web: { enabled: false },
  terminal: { enabled: true }
}

// No browser UI, CLI commands only
// Perfect for cheap VPS
```

---

## Performance Tips

### 1. Optimize Polling Frequency

```javascript
// openclaw/config/openclaw.config.js
polling: {
  price_check: 15 * 60 * 1000,   // 15 min (default)
  position_update: 5 * 60 * 1000, // 5 min
  alert_check: 1 * 60 * 1000      // 1 min
}

// Trade more frequently? Reduce intervals
// Use less CPU? Increase intervals
```

### 2. Database Optimization

```bash
# Clear old logs (older than 90 days)
find logs -mtime +90 -delete

# Compress database
sqlite3 posts.db "VACUUM;"
sqlite3 posts.db "ANALYZE;"

# Archive closed trades to CSV
# Settings → Export → Download CSV
```

### 3. Memory Management

```bash
# Check memory usage
# Windows: Task Manager → OpenClaw process
# Mac: Activity Monitor
# Linux: top, ps aux

# If memory > 500MB, restart:
openclaw restart
```

### 4. API Rate Limits

| API | Limit | What to Do |
|-----|-------|-----------|
| CoinGecko (free) | 10 calls/sec | OK (we use 1/15min) |
| OpenAI | 3 req/min (free) | Upgrade if needed |
| Groq | 30 req/min (free) | Good for most users |
| Gemini | 60 req/min (free) | Excellent |

---

## Logging & Debugging

### View Logs

```bash
# Real-time logs
openclaw logs --follow

# Last 100 lines
openclaw logs --lines 100

# Search for errors
openclaw logs --grep ERROR

# Export logs
openclaw logs --export logs-backup.txt
```

### Debug Mode

```bash
# Start in debug mode
openclaw start --debug

# Or set in .env:
LOG_LEVEL=debug

# More detailed output for troubleshooting
```

### Database Inspection

```bash
# View all tables
sqlite3 posts.db ".tables"

# View trade history
sqlite3 posts.db "SELECT * FROM posts LIMIT 10;"

# Count trades
sqlite3 posts.db "SELECT COUNT(*) FROM posts;"

# Export to CSV
sqlite3 posts.db ".mode csv" ".output trades.csv" "SELECT * FROM posts;" ".quit"
```

---

## License & Terms

- **SquarePulse:** MIT License (Free, open source)
- **OpenClaw:** Check https://openclaw.ai/license
- **Use responsibly:** This is a powerful tool. Always start with small position sizes.

---

## Changelog

### v1.0.0 (March 12, 2026)
- ✅ Initial OpenClaw integration
- ✅ Trading skill (open/close/monitor positions)
- ✅ Price monitor skill (auto price checks)
- ✅ Market alerts skill (price/volatility alerts)
- ✅ Web dashboard interface
- ✅ Email notifications
- ✅ Database persistence
- ✅ Complete documentation

### Planned Features
- [ ] Advanced backtesting module
- [ ] Social trading (copy trades)
- [ ] Discord integration
- [ ] Mobile app
- [ ] Advanced charting

---

## Support This Project

If you find SquarePulse + OpenClaw useful:
- ⭐ Star the GitHub repo
- 🔗 Share with other traders
- 🐛 Report bugs on GitHub Issues
- 💡 Suggest features

---

**Last Updated:** March 12, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

For latest updates: https://github.com/Hybrid-Hub-Technologies/squarepulses

---

## Quick Command Reference

```bash
# ========== Backend ==========
npm run dev              # Start development server
npm start               # Start production server
npm test                # Run tests

# ========== OpenClaw ==========
openclaw status         # Check status
openclaw start          # Start gateway
openclaw stop           # Stop gateway
openclaw restart        # Restart
openclaw dashboard      # Open web UI
openclaw logs           # View logs
openclaw positions      # List trades
openclaw price --symbol BTC  # Get price
openclaw security audit # Check security

# ========== Database ==========
sqlite3 posts.db    # Open database
.tables              # List tables
.schema              # View structure
SELECT * FROM posts; # View trades
.quit                # Exit

# ========== Utilities ==========
curl http://localhost:5000/api/health        # Health check
curl http://localhost:18789/health           # OpenClaw health
node --version       # Check Node.js
npm --version        # Check npm
```

---

**End of Documentation**

For questions, visit: https://openclaw.ai/support

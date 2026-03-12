# SquarePulse + OpenClaw Trading System

**🤖 AI-Powered 24/7 Trading Automation**

Version 1.0.0 • Production Ready ✅

---

## ⚡ Quick Start (30 Seconds)

### Windows
```bash
# 1. Run setup
.\openclaw-setup.bat

# 2. Edit backend/.env with your API keys

# 3. Start system
.\start.bat
```

### Mac/Linux
```bash
# 1. Run setup
bash openclaw-setup.sh

# 2. Edit backend/.env with your API keys

# 3. Start system
bash start.sh
```

Then open: **http://localhost:18789** in your browser

---

## 📚 Full Documentation

**Everything you need is in:** [`SQUAREPULSE_OPENCLAW_SETUP.md`](SQUAREPULSE_OPENCLAW_SETUP.md)

This single file contains:
- What is SquarePulse + OpenClaw
- System architecture diagrams
- Step-by-step installation
- Complete configuration guide
- How to use all features
- OpenClaw command examples
- Trading workflow walkthrough
- Troubleshooting & FAQs
- Security best practices
- Performance optimization tips
- And much more!

---

## 🎯 What Does This System Do?

### SquarePulse (Backend Trading System)
✅ Create trading posts with AI editing  
✅ Automatically monitor prices 24/7  
✅ Auto-post to Binance when targets hit  
✅ Send email alerts for every trade  
✅ Store encrypted API keys securely  
✅ Track P&L with CSV export  

### OpenClaw (AI Agent Interface)
🤖 Run on your computer or server  
🤖 Use web dashboard, terminal, or chat apps  
🤖 Connect to Telegram, WhatsApp, Slack  
🤖 Execute trading commands in natural language  
🤖 Never miss alerts - stays on 24/7  

### Together
🎉 Complete automated trading system  
🎉 Manage trades via chat from anywhere  
🎉 AI watches markets while you sleep  
🎉 Encrypted, secure, production-ready  

---

## 💻 System Requirements

- **Node.js** 22+ (https://nodejs.org)
- **Git** (for version control)
- **RAM:** 512MB minimum, 2GB recommended
- **Storage:** 100MB minimum
- **Internet:** Always on if using VPS

---

## 📁 File Structure

```
squarepulses/
├──📄 SQUAREPULSE_OPENCLAW_SETUP.md    ← READ THIS FIRST
├── 📄 README.md                         ← You are here
├── 🔧 .env                              ← Your secret keys (don't share!)
│
├── 🎯 index.html                        ← Web frontend
├── 💅 style.css                         ← Styling
├── 📜 core.js, myposts.js               ← Frontend logic
│
├── 🤖 backend/                          ← Node.js server
│   ├── server.js                        ← Main server
│   ├── .env.example                     ← Template (copy to .env)
│   ├── package.json                     ← Dependencies
│   ├── database.js                      ← SQLite setup
│   ├── monitoring.js                    ← 24/7 price checker
│   ├── utils/
│   │   ├── encryption.js                ← Secure API keys
│   │   ├── emailNotifications.js        ← Gmail alerts
│   │   └── binanceApi.js                ← Binance Square posting
│   └── routes/
│       ├── posts.js                     ← Trade API endpoints
│       ├── portfolio.js                 ← Portfolio endpoints
│       ├── openclaw.js                  ← OpenClaw endpoints
│       └── ...
│
└── 🧠 openclaw/                         ← OpenClaw setup
    ├── integration.js                   ← Main integration
    ├── skills/
    │   ├── trading-position-manager.js  ← Trade Skills
    │   ├── price-monitor.js             ← Price Skills
    │   └── market-alerts.js             ← Alert Skills
    └── config/
        └── openclaw.config.js           ← Configuration
```

---

## 🚀 Installation Steps

### Step 1: Prerequisites
```bash
# Check you have Node.js
node -v      # Should be v22.0.0+
npm -v       # Should be 10.0.0+
```

### Step 2: Download SquarePulse
```bash
git clone https://github.com/Hybrid-Hub-Technologies/squarepulses.git
cd squarepulses
```

### Step 3: Install Backend
```bash
cd backend
npm install
cd ..
```

### Step 4: Configure Environment
```bash
# Copy template
cp backend/.env.example backend/.env

# Edit with your keys
# Windows: notepad backend\.env
# Mac: nano backend/.env
# Linux: vim backend/.env

# Keys needed:
# - GROQ_API_KEY or OPENAI_API_KEY or GEMINI_API_KEY
# - EMAIL_USER & EMAIL_PASSWORD (Gmail)
# - ENCRYPTION_KEY (generate new one)
# - OPENCLAW_AUTH_TOKEN (generate new one)
```

### Step 5: Install OpenClaw
```bash
# Windows PowerShell
iwr -useb https://openclaw.ai/install.ps1 | iex

# Mac/Linux
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Step 6: Setup OpenClaw
```bash
openclaw onboard --install-daemon
# Follow the prompts to configure
```

### Step 7: Start the System
```bash
# Windows
.\start.bat

# Mac/Linux
bash start.sh

# Or manually:
# Terminal 1: cd backend && npm run dev
# Terminal 2: openclaw start
# Terminal 3: openclaw dashboard
```

### Step 8: Open Dashboard
```
http://localhost:18789
```

Done! ✅

---

## 🎓 How to Use

### Method 1: Web Dashboard (Easy - Start Here!)
1. Go to http://localhost:18789
2. Type commands like:
   ```
   "Open BTC at 50000, TP 52000, SL 48000"
   "Show my positions"
   "Price of ETH?"
   "Alert me when BTC hits 55000"
   ```
3. OpenClaw executes and shows results

### Method 2: Traditional Web Interface
1. Open `index.html` in browser
2. Set your API keys in settings
3. Create trades manually
4. System auto-monitors in background

### Method 3: Chat Apps (Telegram/WhatsApp)
1. Configure in `openclaw/config/openclaw.config.js`
2. Add your bot to Telegram/WhatsApp
3. Send commands anytime, anywhere
4. Get alerts on your phone

---

## 📊 Example: Create Your First Trade

```
You: "Open Bitcoin position at 50000"
     "With take profit at 52000 and 54000"
     "Stop loss at 48000"

OpenClaw: ✅ Position opened: BTC
          Entry: $50,000
          TP1: $52,000
          TP2: $54,000
          SL: $48,000

[System monitors BTC price every 15 min]

[When BTC hits $52,000]

You get email: ✅ TP1 HIT - BTC Position Closed
              Profit: +$2,000 (+4%)
              Posted to Binance Square automatically ✓
```

---

## ⚙️ Configuration

### 1. Edit Your API Keys
```bash
backend/.env
```

**Required:**
- `GROQ_API_KEY` or `OPENAI_API_KEY` (free AI model)
- `EMAIL_USER` & `EMAIL_PASSWORD` (Gmail app password)

**Recommended:**
- `ENCRYPTION_KEY` (generate: `openssl rand -base64 32`)
- `OPENCLAW_AUTH_TOKEN` (generate random 32-char)

### 2. Customize OpenClaw
```bash
openclaw/config/openclaw.config.js
```

Change:
- Gateway port (18789)
- Features (autoTrading, emailAlerts, etc.)
- Monitoring intervals
- Notification settings

### 3. Customize Frontend
```bash
core.js (around line 50)
```

Change polling intervals, UI colors, etc.

---

## 🔒 Security

### ⚠️ Critical Rules
1. **Never share .env file** - Contains API keys
2. **Never expose to internet** - Keep on localhost
3. **Use strong encryption key** - Generate random
4. **Gmail app password ONLY** - Not regular password
5. **Change default OpenClaw token** - Make it 32+ chars

### Verify Security
```bash
openclaw security audit
openclaw security audit --fix  # Auto-fix issues
```

---

## 🐛 Troubleshooting

### "Backend not running"
```bash
cd backend && npm run dev
```

### "OpenClaw command not found"
```bash
# Restart terminal, or
export PATH="$PATH:~/.openclaw/bin"
```

### "Email not sending"
```bash
# Use Gmail app password, not regular password
# Enable 2FA: https://myaccount.google.com/apppasswords
```

### "Port already in use"
```bash
# Change in .env:
PORT=5001  # Different port
# Or kill process:
lsof -i :5000  # Find PID
kill -9 <PID>  # Kill it
```

See **SQUAREPULSE_OPENCLAW_SETUP.md** for full troubleshooting section.

---

## 📞 Support

- 📖 **Full Docs:** [SQUAREPULSE_OPENCLAW_SETUP.md](SQUAREPULSE_OPENCLAW_SETUP.md)
- 🤖 **OpenClaw Help:** https://openclaw.ai/support
- 💬 **Discord:** https://discord.gg/openclaw
- 🐛 **Report Issues:** https://github.com/Hybrid-Hub-Technologies/squarepulses/issues

---

## 📋 Quick Commands

```bash
# OpenClaw
openclaw status              # Check status
openclaw start              # Start gateway
openclaw stop               # Stop gateway
openclaw dashboard          # Open UI
openclaw logs --follow      # View logs
openclaw positions          # List trades
openclaw price --symbol BTC # Get price

# Backend
npm run dev    # Development mode
npm start      # Production mode
npm test       # Run tests

# Database
sqlite3 posts.db   # Open database
SELECT * FROM posts; # View trades
```

---

## 🎯 Next Steps

1. ✅ Install & configure (see above)
2. ✅ Read [SQUAREPULSE_OPENCLAW_SETUP.md](SQUAREPULSE_OPENCLAW_SETUP.md)
3. ✅ Create first trade via dashboard
4. ✅ Setup email alerts
5. ✅ Add Telegram bot (optional)
6. ✅ Export CSV of trades
7. ✅ Monitor performance
8. ✅ Scale up with confidence!

---

## 📈 Features

- [x] 24/7 Price Monitoring
- [x] Auto Position Posting
- [x] Email Notifications
- [x] Encrypted API Keys
- [x] Web Dashboard
- [x] OpenClaw Integration
- [x] Telegram Bot Support
- [x] CSV Export
- [x] Trade History
- [x] Portfolio Tracking
- [ ] Advanced Backtesting (coming v2.0)
- [ ] Social Trading (coming v2.0)

---

## 📄 License

MIT License - Free & Open Source

**Use responsibly.** Start with small position sizes. No financial advice.

---

**Version:** 1.0.0  
**Last Updated:** March 12, 2026  
**Status:** Production Ready ✅

🚀 **Happy Trading!**

For complete documentation, read: [SQUAREPULSE_OPENCLAW_SETUP.md](SQUAREPULSE_OPENCLAW_SETUP.md)

# 📋 SquarePulse + OpenClaw Installation Checklist

Use this checklist to verify your system is properly configured.

---

## ✅ Pre-Installation (5 minutes)

- [ ] Download/clone SquarePulses repository
- [ ] Open terminal in squarepulses folder
- [ ] Check you have Node.js 22+ installed
- [ ] Check you have npm 10+ installed
- [ ] Check you have Git installed

**Verify commands:**
```bash
node -v      # Should be v22.0.0 or higher
npm -v       # Should be 10.0.0 or higher
git -v       # Should show git version
```

---

## ✅ Backend Installation (10 minutes)

- [ ] Run `cd backend && npm install`
- [ ] Wait for all packages to install
- [ ] Verify no major errors in output
- [ ] Copy `.env.example` to `.env`
- [ ] Check `.env` file exists in backend folder

**Verify:**
```bash
cd backend
ls -la | grep package.json     # Should show package.json
ls -la | grep node_modules     # Should show node_modules directory
ls -la | grep .env             # Should show .env file
```

---

## ✅ Environment Configuration (15 minutes)

Edit `backend/.env` with:

- [ ] **ENCRYPTION_KEY** - Generate 32-char random:
  ```bash
  # Windows PowerShell:
  [System.Guid]::NewGuid().ToString().Replace("-","").Substring(0,32)
  
  # Mac/Linux:
  openssl rand -base64 32
  ```

- [ ] **EMAIL_USER** - Your Gmail address

- [ ] **EMAIL_PASSWORD** - Your Gmail app password:
  - Go to https://myaccount.google.com/apppasswords
  - Enable 2FA first
  - Generate "App password" for "Mail"
  - Copy 16-character password

- [ ] **GROQ_API_KEY** (FREE) OR **OPENAI_API_KEY** (paid) OR **GEMINI_API_KEY** (FREE):
  - Groq: https://console.groq.com
  - OpenAI: https://platform.openai.com/api-keys
  - Gemini: https://ai.google.dev

- [ ] **OPENCLAW_AUTH_TOKEN** - Generate 32-char random token

**Test backend:**
```bash
npm run dev
# Should output: 🚀 SquarePulse Backend Server Running on http://localhost:5000
```

---

## ✅ OpenClaw Installation (15 minutes)

- [ ] Install OpenClaw using official method:

**Windows PowerShell:**
```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

- [ ] Verify installation:
  ```bash
  openclaw --version
  ```

- [ ] Run interactive setup:
  ```bash
  openclaw onboard --install-daemon
  ```
  - Accept security terms
  - Choose model (recommend: Groq for free, GPT-4 for best)
  - Enter API key when prompted
  - Enable Web interface
  - Configure skills (enable all)
  - Skip channels for now

---

## ✅ Verify System Components (10 minutes)

**Automated verification:**
```bash
# Windows
.\verify-system.bat

# Mac/Linux
bash verify-system.sh
```

Manual verification:

- [ ] Backend server runs without errors
  ```bash
  cd backend && npm run dev &
  curl http://localhost:5000/api/health
  # Should return: {"status":"Server running",...}
  ```

- [ ] OpenClaw responds
  ```bash
  openclaw status
  # Should show gateway status
  ```

- [ ] Frontend files exist
  ```bash
  ls -la index.html core.js style.css
  ```

- [ ] OpenClaw skills installed
  ```bash
  ls openclaw/skills/
  # Should show: trading-position-manager.js, price-monitor.js, market-alerts.js
  ```

- [ ] Configuration files exist
  ```bash
  ls openclaw/config/openclaw.config.js
  ls backend/.env
  ```

---

## ✅ Test Core Functionality (10 minutes)

### Test 1: Backend Health
```bash
curl http://localhost:5000/api/health

# Expected output:
# {"status":"Server running","timestamp":"..."}
```

### Test 2: Create Test Trade
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "coin_symbol": "BTC",
    "entry_price": 50000,
    "tp1": 52000,
    "sl": 48000
  }'

# Expected: {"success":true,"postId":"POST-..."}
```

### Test 3: Get OpenClaw Status
```bash
openclaw status

# Should show all services running
```

### Test 4: Test Integration
```bash
cd backend
npm run openclaw:test

# Should return successful response
```

### Test 5: Test Email (Optional)
```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com"}'

# You should receive test email within 1 minute
```

---

## ✅ Start the System (5 minutes)

All systems ready? Start everything!

**Windows:**
```bash
.\start.bat
```

**Mac/Linux:**
```bash
bash start.sh
```

This will:
1. ✅ Start backend server on http://localhost:5000
2. ✅ Start OpenClaw on http://localhost:18789
3. ✅ Open dashboard in browser

**Manual start (if script doesn't work):**

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
openclaw start
```

Terminal 3:
```bash
openclaw dashboard
```

---

## ✅ Initial Configuration (5 minutes)

Once dashboard opens (http://localhost:18789):

- [ ] Login with your OpenClaw token
- [ ] Go to Settings
- [ ] Configure any additional services you need
- [ ] Test by typing a command:
  ```
  "What is your status?"
  ```

---

## ✅ Create First Trade (5 minutes)

In OpenClaw dashboard, type:

```
"Open BTC position at 50000 with TP at 52000 and SL at 48000"
```

OpenClaw should respond:
```
✅ Position opened: BTC at $50,000
```

Check it was saved:
```
"Show my positions"
```

---

## ✅ Optional: Setup Chat Apps (10 minutes each)

### Telegram Bot (Recommended)
- [ ] Message @BotFather on Telegram
- [ ] Create new bot
- [ ] Get bot token
- [ ] Get your chat ID from @getidsbot
- [ ] Add to `openclaw/config/openclaw.config.js`
- [ ] Restart OpenClaw
- [ ] Message bot to test

### WhatsApp Bot (Requires Twilio)
- [ ] Create Twilio account
- [ ] Get credentials
- [ ] Configure in `.env`
- [ ] Test sending message

### Slack Bot
- [ ] Create Slack app at api.slack.com
- [ ] Get bot token
- [ ] Configure in `.env`
- [ ] Add to workspace

---

## ✅ Security Check (5 minutes)

BEFORE using with REAL MONEY:

- [ ] API keys are in `.env` (never in code)
- [ ] `.env` is in `.gitignore`
- [ ] Are backend is on localhost only (not exposed)
- [ ] OpenClaw auth token is strong (32+ chars)
- [ ] Gmail app password is used (not regular password)
- [ ] Encryption key is strong and random

Run security audit:
```bash
openclaw security audit
openclaw security audit --fix
```

---

## ✅ Backup Setup (5 minutes)

- [ ] Create backups directory
  ```bash
  mkdir backups
  ```

- [ ] Backup database regularly
  ```bash
  cp posts.db backups/posts.db.$(date +%Y-%m-%d).backup
  ```

- [ ] Setup automatic backup (optional)
  Edit `.env`:
  ```
  BACKUP_ENABLED=true
  BACKUP_INTERVAL=86400000  # 24 hours
  ```

---

## ✅ Monitoring Setup (5 minutes)

- [ ] Check logs are being created
  ```bash
  tail -f logs/openclaw.log
  ```

- [ ] Setup email alerts
  - Ensure EMAIL_USER and EMAIL_PASSWORD are in `.env`
  - Create first trade and wait for alert

- [ ] Check monitoring is running
  ```bash
  openclaw status
  # Should show "monitoring: active"
  ```

---

## ✅ Documentation Review (10 minutes)

Read these files:

- [ ] [`README.md`](README.md) - Quick reference
- [ ] [`SQUAREPULSE_OPENCLAW_SETUP.md`](SQUAREPULSE_OPENCLAW_SETUP.md) - Complete guide
- [ ] [`backend/.env.example`](backend/.env.example) - All available settings

---

## 📊 Checklist Summary

- **Pre-Installation:** 5 minutes
- **Backend Setup:** 10 minutes
- **Environment Config:** 15 minutes
- **OpenClaw Install:** 15 minutes
- **Verification:** 10 minutes
- **Testing:** 10 minutes
- **Starting:** 5 minutes
- **Initial Config:** 5 minutes
- **First Trade:** 5 minutes
- **Optional Integrations:** 10-20 minutes
- **Security:** 5 minutes
- **Backup:** 5 minutes
- **Monitoring:** 5 minutes
- **Documentation:** 10 minutes

**Total Time: ~120 minutes (2 hours) for complete setup**

---

## 🆘 Trouble Spots

If you get stuck on:

### OpenClaw Command Not Found
```bash
# Restart terminal, or add to PATH:
export PATH="$PATH:~/.openclaw/bin"
```

### npm Install Fails
```bash
# Install Git first:
# Windows: winget install git
# Mac: brew install git
# Then retry: npm install
```

### Email Not Sending
```bash
# Verify 2FA is enabled: https://myaccount.google.com/security
# Generate app password: https://myaccount.google.com/apppasswords
# Use EXACT password from Google app
```

### Port 5000 Already in Use
```bash
# Change in .env:
PORT=5001

# Or kill existing process:
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Backend Crashes
```bash
# Check logs:
tail logs/openclaw.log

# Restart:
npn run dev
```

See [SQUAREPULSE_OPENCLAW_SETUP.md](SQUAREPULSE_OPENCLAW_SETUP.md) for full troubleshooting section.

---

## ✅ Final Verification

Before you start trading with REAL MONEY:

- [ ] **Backend is running** - http://localhost:5000 returns 200 OK
- [ ] **OpenClaw is running** - http://localhost:18789 opens in browser
- [ ] **Email alerts work** - Test email sent and received
- [ ] **Encryption is working** - API keys stored safely
- [ ] **System is monitoring** - Logs show "checking position"
- [ ] **First trade executed** - BTC trade created successfully
- [ ] **Security verified** - No API keys in code, only in .env
- [ ] **Backups enabled** - Database being backed up
- [ ] **Monitoring active** - Every 15 min price checks

---

## 🚀 Ready to Trade!

If all checkboxes are ✅, you're ready!

### Next Steps:

1. Create your first REAL trade
2. Monitor OpenClaw logs
3. Wait for email alert when target hits
4. Export CSV of trades
5. Scale up gradually
6. Always start small!

---

**Questions?** See [SQUAREPULSE_OPENCLAW_SETUP.md](SQUAREPULSE_OPENCLAW_SETUP.md)

**Bugs?** Report on [GitHub Issues](https://github.com/Hybrid-Hub-Technologies/squarepulses/issues)

**Support?** https://openclaw.ai/support

---

**Happy Trading! 🚀**

Version: 1.0.0  
Last Updated: March 12, 2026

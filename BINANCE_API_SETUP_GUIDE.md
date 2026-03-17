# 🔑 Binance API Setup Guide - SquarePulse

## ✅ Quick Setup (3 Steps)

### Step 1: Get Your Binance API Credentials

1. **Go to Binance Account Settings:**
   - Open: https://www.binance.com
   - Sign in to your account
   - Click **Account** (top-right) → **API Management** (or go directly to https://www.binance.com/en/my/settings/api-management)

2. **Create API Key:**
   - Click **"Create API"** button
   - Give it a name: `SquarePulse Trading` (or any name)
   - Click **Next**

3. **Configure Permissions (IMPORTANT):**
   - ✅ **Enable Reading** - Check this
   - ✅ **Enable Spot & Margin Trading** - Check this
   - ❌ **Enable Withdrawals** - DO NOT CHECK THIS
   - Click **Next**

4. **Complete Verification:**
   - Solve security verification (SMS or Google Authenticator)
   - You'll see two keys generated:
     - **API Key** (starts with something like: `hK8...`)
     - **Secret Key** (long random string)

5. **Copy Your Keys:**
   - Click the **copy icon** next to your API Key
   - Click the **copy icon** next to your Secret Key
   - ⚠️ **IMPORTANT:** Your Secret Key only appears ONCE. Save it somewhere safe!

---

### Step 2: Add Keys to SquarePulse

1. **Open SquarePulse:**
   - Go to: `http://192.168.100.81/squarepulses/index.html`
   - Or: `http://localhost/squarepulses/index.html`

2. **Click the "⚙ API Key" button** (top-right corner)

3. **Fill in the Binance Trading API section:**
   - **Binance API Key:** Paste your API Key
   - **Binance Secret Key:** Paste your Secret Key

4. **Also fill (if you haven't):**
   - **Your Email:** For trade alerts (TP/SL hits)
   - **Binance Square Key:** For posting to Binance Square (optional)

5. **Click "Save Keys"** ✅

---

### Step 3: Verify Connection

Once you save, the system will:
- ✅ Encrypt your credentials (never stored plaintext)
- ✅ Test connection to Binance
- ✅ Load your portfolio data
- ✅ Show your holdings in USDT

You should see:
```
💰 Binance Account Added: user_xxx
📊 Portfolio: $XXXX.XX USDT
```

---

## 🎯 What Happens Next?

After your API keys are added, SquarePulse can:

### 📊 Portfolio Tracking
- View all your coin holdings in USDT value
- Real-time balance updates
- See your total account value

### 💹 Auto Trading
- Execute buy/sell orders via chatbot
- **"Buy $100 BTC"** → Executes immediately
- **"Sell $50 ETH"** → Market order executed
- **"Set TP $52000"** → Sets take profit target

### ✅ Auto TP/SL Management
- Automatically close trades at profit targets
- System monitors every 1 minute
- No manual intervention needed

### 💬 Chat-Based Trading
- Talk to OpenClaw chatbot: **"Buy Bitcoin with $5 profit target"**
- Chatbot executes the trade
- Handles all TP/SL logic autonomously

---

## ⚠️ Security Best Practices

✅ **DO:**
- ✓ Enable **Spot Trading only**
- ✓ Disable **Withdrawals**
- ✓ Use **IP Whitelist** (optional but recommended)
- ✓ Rotate keys periodically
- ✓ Keep backups of your Secret Key safe

❌ **DON'T:**
- ✗ Share your Secret Key with anyone
- ✗ Enable withdrawals (unless you're advanced)
- ✗ Use testnet keys for real trading
- ✗ Store keys in plaintext anywhere

---

## 🔄 Testing Your Connection

After adding keys, test with these commands:

### Via ChatBot:
1. Click **OpenClaw** in the interface
2. Say: **"Show my portfolio"**
3. You should see your holdings

### Via Dashboard:
1. Click **Portfolio** tab
2. Should show all your coins
3. Total USDT value displayed

---

## 🐛 Troubleshooting

**Problem:** "Connection failed" error
- ✓ Check your API Key and Secret are correct (copy again from Binance)
- ✓ Verify backend is running: `http://localhost:5000/health`
- ✓ Check internet connection

**Problem:** "Invalid credentials" or 401 error
- ✓ Keys might be wrong - regenerate on Binance
- ✓ Make sure you copied the ENTIRE key (no spaces)

**Problem:** No portfolio data showing
- ✓ You might have 0 balance (add some USDT to your Binance account)
- ✓ Check if you selected the right API key account

**Problem:** Can't execute trades
- ✓ Make sure "Spot Trading" permission is enabled
- ✓ Check if you have balance in the coin you're trying to buy
- ✓ System might need 5-10 seconds to confirm

---

## 📞 Need Help?

- Backend running at: **http://localhost:5000**
- API Health check: **http://localhost:5000/health**
- All data encrypted and stored locally

---

**Happy Trading! 🚀**

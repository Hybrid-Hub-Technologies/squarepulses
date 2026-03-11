# 🎯 Binance Spot API Integration Setup Guide

## Overview
Your SquarePulse app now has full **Binance Spot Trading API** integration for:
- ✅ Real-time portfolio tracking
- ✅ Automated bot trading
- ✅ Wealth history (portfolio snapshots)
- ✅ Trade analytics

---

## 🔑 Step 1: Get Binance API Keys

### For Bot Trading & Portfolio (Server-Side)

1. **Go to Binance Settings:**
   - Visit: https://www.binance.com/en/user/settings/api-management
   - Click "Create API"
   - Label: `SquarePulse Bot`

2. **Configure Restrictions:**
   ```
   ✓ Spot Trading (Enable Trading)
   ✓ Read access to wallet
   ✓ Read access to orders/trades
   ✓ IP restriction: Your Server IP (or leave blank for dev)
   ```

3. **Save Your Keys:**
   ```
   API Key:    abc123xyz...
   Secret Key: def456uvw...
   ```

---

## 🔧 Step 2: Configure Backend .env

Create/Update `backend/.env`:

```bash
# Binance Spot API Keys (for bot trading)
BINANCE_API_KEY=abc123xyz...
BINANCE_SECRET_KEY=def456uvw...

# Other existing configs...
PORT=5000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 📋 Step 3: Update Database

New tables automatically created on first run:
- ✅ `bot_strategies` - Store bot trading strategies
- ✅ `bot_trades` - Track executed trades
- ✅ `wealth_snapshots` - Portfolio value history

---

## 🚀 Step 4: Update Frontend

### Add Script to index.html

```html
<!-- Add BEFORE closing </body> tag -->
<script src="binance-api-client.js"></script>
```

### Use in Your Code

```javascript
// Load portfolio
const portfolio = await getPortfolioValue();
console.log('Total Value:', portfolio.data.totalValue, 'USDT');

// Get balances
const balances = await getPortfolioBalances();
console.log('Assets:', balances.data);

// Execute bot trade
const trade = await executeBotTrade('BTCUSDT', 'BUY', 0.01);
```

---

## 📊 Available Endpoints

### Portfolio APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio/balances` | GET | Get all balances |
| `/api/portfolio/value` | GET | Get portfolio value in USDT |
| `/api/portfolio/price/:symbol` | GET | Get symbol price |
| `/api/portfolio/klines/:symbol` | GET | Get candlestick data |
| `/api/portfolio/trades/:symbol` | GET | Get trade history |
| `/api/portfolio/snapshot` | POST | Save portfolio snapshot |
| `/api/portfolio/history` | GET | Get portfolio history |

### Bot Trading APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bot/strategies` | GET | Get all strategies |
| `/api/bot/strategies` | POST | Create strategy |
| `/api/bot/strategies/:id` | PUT | Update strategy |
| `/api/bot/strategies/:id` | DELETE | Delete strategy |
| `/api/bot/execute` | POST | Execute market order |
| `/api/bot/close-position` | POST | Close position |
| `/api/bot/trades` | GET | Get trades |
| `/api/bot/stats` | GET | Get trading stats |

---

## 💡 Example Usage

### Get Portfolio Value

```javascript
async function loadPortfolio() {
  const result = await getPortfolioValue();
  
  if (result.success) {
    console.log('💰 Portfolio Value:', result.data.totalValue, 'USDT');
    console.log('📊 Assets:', result.data.balances);
  } else {
    showToast('error', '❌', result.error);
  }
}
```

### Create Bot Strategy

```javascript
async function createStrategy() {
  const result = await createBotStrategy(
    'DCA Bitcoin',      // name
    'DCA',              // type
    'BTCUSDT',          // symbol
    45000,              // entry price
    50000,              // target
    40000,              // stop loss
    0.01                // quantity
  );
  
  if (result.success) {
    showToast('success', '✅', `Strategy created!`);
  }
}
```

### Execute Trade

```javascript
async function buyBitcoin() {
  const result = await executeBotTrade('BTCUSDT', 'BUY', 0.01);
  
  if (result.success) {
    showToast('success', '🚀', `Bought ${result.order.executedQty} BTC`);
  }
}
```

---

## ⚠️ Important Security Notes

1. **API Key Safety:**
   - ✅ Store keys in `.env` file
   - ✅ Add IP restrictions in Binance
   - ❌ Never commit `.env` to GitHub
   - ❌ Never share keys

2. **Testnet Available:**
   To test without real money:
   ```javascript
   // In binanceApi.js - change line 6
   const BINANCE_API_BASE = 'https://testnet.binance.vision';
   ```

3. **Rate Limits:**
   Binance has rate limits:
   - 1200 requests/minute for general endpoints
   - 100 orders/10 seconds for trading

---

## 🧪 Testing

### Test Locally

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Browser
http://localhost:3000/index.html
```

### Use Testnet First

1. Create testnet API keys
2. Switch backend to testnet mode
3. Test bot trading before using mainnet

---

## 🐛 Troubleshooting

### "API Key not configured"
- Check `/backend/.env` has values
- Restart backend: `npm start`

### "Invalid signature"
- Verify API key and secret are correct
- Check system time (must be within ±1000ms of Binance servers)

### "Permission denied"
- Verify API key has Spot Trading enabled
- Check IP restrictions

### Portfolio value is 0
- Ensure Binance API key has read access to wallet
- Check fund exists in your account

---

## 📈 Next Steps

1. ✅ Setup Binance API keys
2. ✅ Update .env file
3. ✅ Deploy backend to Render/Railway
4. ✅ Update frontend API URL
5. ✅ Test on testnet first
6. ✅ Enable bot trading features
7. ✅ Monitor trades in real-time

---

## 🎓 Learn More

- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [Binance Trading Rules](https://www.binance.com/en/trade-rule)
- [API Key Security](https://www.binance.com/en/support/faq/360002502092)

---

**Your bot is now ready to trade! 🚀**

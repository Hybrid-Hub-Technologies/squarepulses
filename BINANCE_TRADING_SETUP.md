# 🚀 SquarePulse Binance Trading - Complete Setup Guide

## Overview

Your SquarePulse system now has **full Binance trading integration** with:
- ✅ Authenticated API access to Binance Spot trading
- ✅ Secure API key management (encrypted storage)
- ✅ Autonomous trading bot with Take Profit/Stop Loss
- ✅ Real-time portfolio tracking in USDT
- ✅ OpenClaw AI assistant that can execute trades via natural language
- ✅ Trade history and PnL tracking
- ✅ Auto-closing trades based on profit targets

---

## 🔐 Getting Binance API Keys

### Step 1: Create Binance Account
1. Go to https://www.binance.com
2. Sign up or log in to your account
3. Enable 2FA (highly recommended for security)

### Step 2: Generate API Keys
1. Click on your profile icon → **API Management**
2. Click **Create API** button
3. Choose: **System Generated** (recommended)
4. Name it: `SquarePulse-Trading`
5. Complete verification (email/2FA)

### Step 3: Configure API Key Permissions
In API restrictions, enable **ONLY these permissions**:
- ✅ Spot Trading (to place orders)
- ✅ Read Account Data
- ✅ Spot Trading (order management)
- ❌ Fund Transfers (disable for safety)
- ❌ Enable Margin (disable)
- ❌ Enable Withdrawals (NEVER enable)

**Set IP whitelist** to your machine's IP if available

### Step 4: Copy Your Keys
- **API Key**: Copy and save securely
- **Secret Key**: 🔒 NEVER share this with anyone
- Store somewhere safe temporarily

---

## 📱 Integration Steps

### 1. Add API Credentials to SquarePulse

#### Via Frontend UI:
```javascript
// Coming Soon: UI Form in Dashboard
// For now, use API call below
```

#### Via API Call:
```bash
curl -X POST http://192.168.100.81:5000/api/trading/keys/add \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "main",
    "apiKey": "YOUR_BINANCE_API_KEY",
    "apiSecret": "YOUR_BINANCE_API_SECRET",
    "environment": "mainnet"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "✅ Credentials saved for account: main",
  "account": {
    "name": "main",
    "apiKey": "YOUR1...5f6g",
    "environment": "mainnet"
  }
}
```

### 2. Verify Connection

Test API connectivity:
```bash
curl http://192.168.100.81:5000/api/trading/account?account=main
```

This will return your Binance account info if configured correctly.

---

## 💼 Portfolio Management

### Get Portfolio Value (in USDT)
```bash
GET http://192.168.100.81:5000/api/trading/portfolio?account=main
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalValue": 1250.45,
    "assets": [
      {
        "asset": "BTC",
        "quantity": 0.01234,
        "free": 0.01234,
        "locked": 0,
        "usdtValue": 500.00
      },
      {
        "asset": "ETH",
        "quantity": 0.5,
        "free": 0.5,
        "locked": 0,
        "usdtValue": 200.00
      }
    ]
  }
}
```

### Get Specific Asset Balance
```bash
GET http://192.168.100.81:5000/api/trading/balance/BTC?account=main
```

### Get Current Price
```bash
GET http://192.168.100.81:5000/api/trading/price/BTCUSDT?account=main
```

---

## 🤖 Autonomous Trading Bot

### Open a New Trade

The trading bot automatically:
- Places the order at market price
- Sets profit targets (default: $5)
- Can set stop loss levels
- Monitors and auto-closes when profit target is reached

**Via API:**
```bash
curl -X POST http://192.168.100.81:5000/api/trading/bot/open-trade \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": 0.001,
    "targetProfit": 5,
    "account": "main",
    "confirm": true
  }'
```

**Parameters:**
- `symbol`: Trading pair (BTCUSDT, ETHUSDT, etc.)
- `side`: BUY or SELL
- `quantity`: Amount to trade
- `targetProfit`: Dollar amount for auto-close ($5 default)
- `stopLoss`: Optional stop loss in dollars
- `takeProfit`: Optional exact TP price level
- `confirm`: Must be `true` to execute

**Response:**
```json
{
  "success": true,
  "trade": {
    "tradeId": "BTCUSDT-1710710400000",
    "symbol": "BTCUSDT",
    "side": "BUY",
    "quantity": 0.001,
    "entryPrice": 50000,
    "targetProfit": 5,
    "takeProfit": 50005,
    "status": "OPEN",
    "entryTime": "2024-03-17T10:00:00Z"
  }
}
```

### Close a Trade Manually
```bash
curl -X POST http://192.168.100.81:5000/api/trading/bot/close-trade \
  -H "Content-Type: application/json" \
  -d '{
    "tradeId": "BTCUSDT-1710710400000",
    "account": "main",
    "confirm": true
  }'
```

### Get Active Trades
```bash
GET http://192.168.100.81:5000/api/trading/bot/trades?account=main&status=active
```

### Get Trading Statistics
```bash
GET http://192.168.100.81:5000/api/trading/bot/stats?account=main
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrades": 15,
    "activeTrades": 2,
    "closedTrades": 13,
    "totalPnL": 125.50,
    "avgPnL": 9.65,
    "winRate": 69.23,
    "winCount": 9,
    "lossCount": 4
  }
}
```

### Update Trade TP/SL
```bash
curl -X PUT http://192.168.100.81:5000/api/trading/bot/trade/BTCUSDT-1710710400000 \
  -H "Content-Type: application/json" \
  -d '{
    "takeProfit": 51000,
    "stopLoss": 49000,
    "targetProfit": 10,
    "account": "main"
  }'
```

---

## 🤖 Using OpenClaw AI Assistant

### Natural Language Trading Commands

**OpenClaw can now understand and execute trading commands:**

#### Buy Orders:
- "Buy 0.1 BTC"
- "Buy $500 of Ethereum"
- "Long 1 Bitcoin"

#### Sell Orders:
- "Sell 0.5 ETH"
- "Sell $100 worth of SOL"
- "Short Bitcoin"

#### Portfolio Management:
- "Show my portfolio"
- "What's my balance?"
- "Show BTC price"
- "What's my holdings?"

#### Trade Management:
- "Show active trades"
- "Close my position"
- "Show trading stats"
- "What's my win rate?"
- "Close trade BTCUSDT-xxxxx"

#### Take Profit / Stop Loss:
- "Take profit at $52000"
- "Set TP at $200 profit"
- "Set stop loss at $49000"
- "Update SL to $50"

### Example Conversation:

```
User: "Buy 0.1 Bitcoin with $5 profit target"

OpenClaw: "✅ BUY ORDER EXECUTED

📊 Trade Details:
  • Symbol: BTCUSDT
  • Side: BUY
  • Quantity: 0.1
  • Entry Price: $50,000
  • Target Profit: $5
  • Trade ID: BTCUSDT-1710710400000

🎯 This trade will auto-close when profit reaches $5"

---

User: "Show my portfolio"

OpenClaw: "💼 YOUR PORTFOLIO

Total Value: $10,500.45 USDT

Assets:
  • BTC: 0.15 ($7,500.00)
  • ETH: 2.5 ($5,000.45)
  • USDT: 0 ($0.00)"

---

User: "What about my trading performance?"

OpenClaw: "📊 TRADING STATISTICS

Total Trades: 15
Active: 2
Closed: 13

Total PnL: $125.50
Average PnL: $9.65
Win Rate: 69.23%
Wins: 9 | Losses: 4"
```

---

## ✅ Auto-Trading Features

### How It Works:

1. **You open a trade** with a target profit (e.g., $5)
2. **Trading bot monitors automatically** (every 1 minute by default)
3. **When profit target is hit**, the bot automatically:
   - Closes the position
   - Calculates PnL
   - Records trade history
4. **You get notified** of the closed trade

### Profit Formula:

For **BUY** trades:
```
Profit = (Current Price - Entry Price) × Quantity
```

For **SELL** trades (shorts):
```
Profit = (Entry Price - Current Price) × Quantity
```

**Auto-closes when: Profit ≥ Target Profit**

### Adjustment During Trade:

You can update targets while trade is open:

```bash
# Update TP level
curl -X PUT http://192.168.100.81:5000/api/trading/bot/trade/BTCUSDT-xxxxx \
  -H "Content-Type: application/json" \
  -d '{
    "takeProfit": 51500,
    "targetProfit": 10
  }'
```

---

## 🔒 Security Best Practices

1. **Use Testnet First**
   - Change `environment: "testnet"` when adding credentials
   - Practice with play money first
   - Test all features before mainnet

2. **API Key Restrictions**
   - Restrict to Spot Trading only
   - Whitelist your IP address
   - Never enable withdrawals
   - Disable fund transfers

3. **Secret Key Management**
   - Never share your secret key
   - Never paste in public places
   - Store in password manager
   - Rotate keys periodically

4. **Database Backups**
   - Your trades are stored in `backend/trades.json`
   - API credentials are encrypted in `backend/secure/`
   - Keep backups of important data

---

## 📊 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trading/keys/add` | Save API credentials |
| GET | `/api/trading/keys/list` | List saved accounts |
| DELETE | `/api/trading/keys/:name` | Delete account |
| GET | `/api/trading/account` | Get account info |
| GET | `/api/trading/portfolio` | Get portfolio value |
| GET | `/api/trading/price/:symbol` | Get current price |
| POST | `/api/trading/order` | Place limit order |
| POST | `/api/trading/market-order` | Place market order |
| DELETE | `/api/trading/order` | Cancel order |
| GET | `/api/trading/openorders/:symbol` | Get open orders |
| POST | `/api/trading/bot/open-trade` | Open automated trade |
| POST | `/api/trading/bot/close-trade` | Close trade |
| GET | `/api/trading/bot/trades` | List trades |
| GET | `/api/trading/bot/stats` | Get statistics |
| PUT | `/api/trading/bot/trade/:id` | Update trade TP/SL |

---

## 🐛 Troubleshooting

### "Account not found" Error
**Solution:** Add credentials first using `/api/trading/keys/add`

### "Invalid API Key" Error
**Solution:** Double-check your Binance API key and secret are correct

### "Insufficient Balance" Error
**Solution:** Check your portfolio balance - you don't have enough of that asset

### "Order rejected" Error
**Solution:** Check minimum order size on Binance (usually $5 minimum)

### Trade didn't auto-close
**Solution:** Check if backend is running and monitoring is active

### Want to use Testnet?
```bash
curl -X POST http://192.168.100.81:5000/api/trading/keys/add \
  -H "Content-Type: application/json" \
  -d '{
    "accountName": "testnet",
    "apiKey": "YOUR_TESTNET_KEY",
    "apiSecret": "YOUR_TESTNET_SECRET",
    "environment": "testnet"
  }'

# Then use: ?account=testnet in your queries
```

---

## 📝 Next Steps

1. ✅ Get Binance API keys
2. ✅ Add credentials to SquarePulse
3. ✅ Test on testnet first
4. ✅ Try your first trade
5. ✅ Use OpenClaw to manage trades via chat
6. ✅ Monitor portfolio dashboard

---

## 🎯 Summary

Your SquarePulse system now supports:
- **Complete Binance Spot Trading** with secure API key management
- **Autonomous Trading Bot** that auto-closes trades at profit targets
- **OpenClaw AI Assistant** that executes trades via natural language
- **Real-time Portfolio Tracking** in USDT value
- **Trading Statistics** and PnL monitoring
- **Manual and Automated Trade Management** with TP/SL

**Happy Trading! 🚀**

---

## Support

For issues or questions:
1. Check this guide
2. Review log output in backend terminal
3. Verify API keys are correct
4. Test on testnet first
5. Check Binance API documentation

**Backend logs will show:**
- ✅ Server started
- 🤖 Auto-trading monitor active
- 📡 API calls being made
- ❌ Any errors that occur

Good luck! 💚

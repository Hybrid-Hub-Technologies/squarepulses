# 🚀 SquarePulse 24/7 Backend Setup

## 📋 Overview

This backend provides **24/7 automatic trade tracking** with:
- ✅ Database storage for all posted trades
- 🔄 Automatic price monitoring every 15 minutes
- 📤 Auto-post when TP/SL levels are hit
- 📊 CSV export & import
- 💾 Complete trade history

---

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Create `.env` file in `/backend` folder:

```
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

**Note:** Binance Square API Key is NOT needed on backend. Each user provides their own Binance API key through the browser's API Key modal, which is stored securely in localStorage.

### 3. Start the Server

```bash
npm start
```

Expected output:
```
🚀 SquarePulse Backend Server Running on http://localhost:5000
📡 Database: posts.db
⏰ Starting 24/7 price monitoring...
```

---

## 📡 API Endpoints

### Get All Posts (with pagination)
```
GET http://localhost:5000/api/posts?page=1
Response: { posts: [], total: 50, pages: 2, current_page: 1 }
```

### Save New Trade
```
POST http://localhost:5000/api/posts
Body: {
  "coin_name": "Bitcoin",
  "coin_symbol": "BTC",
  "entry_price": 65000,
  "tp1": 68000,
  "tp2": 72000,
  "sl": 62000,
  "post_content": "Full post text..."
}
```

### Mark Trade as Posted
```
PATCH http://localhost:5000/api/posts/1/posted
```

### Close Trade
```
PATCH http://localhost:5000/api/posts/1/close
```

### Export to CSV
```
GET http://localhost:5000/api/posts/export/csv
Downloads: posts.csv
```

---

## 🔄 How 24/7 Monitoring Works

### Architecture:
- **Backend** - Monitors prices & detects TP/SL hits (runs 24/7)
- **Frontend** - Checks for alerts & auto-posts using user's Binance API key

### Process:
1. **User posts trade** → Saved to backend database
2. **Backend monitoring runs every 15 minutes** automatically
3. **Fetches current price** via CoinGecko API (free, no key needed)
4. **Checks against TP1/TP2/SL levels**
5. **Marks post when target hit** (tp1_hit_at, tp2_hit_at, sl_hit_at timestamps)
6. **Frontend polls backend** every 5 minutes for pending alerts
7. **Auto-posts milestone messages** using **user's own Binance Square API key**:
   - ✅ TP1 Hit: "🎉 TP1 HIT! BTC reached $68,000!"
   - 🚀 TP2 Hit: "🚀 TP2 HIT! BTC reached $72,000!"
   - 🛑 SL Hit: "⚠️ Stop Loss Hit! Cut losses"

**Key Advantage:** Each user's Binance key stays in their browser (localStorage) - backend never touches it!

---

## 📊 Database Schema

### Posts Table
```
id, coin_name, coin_symbol, entry_price,
tp1, tp2, sl, post_content, status,
tp1_hit_at, tp2_hit_at, sl_hit_at,
created_at, posted_to_square
```

### Price History
```
id, post_id, current_price, checked_at
```

### Auto Posts
```
id, post_id, tp_level, auto_post_content, posted_at
```

---

## 🐛 Troubleshooting

### "Backend not running" error in My Posts tab
- Check if `npm start` is running in `/backend` folder
- Verify `http://localhost:5000/health` responds

### TP alerts not auto-posting
- Ensure Binance Square API Key is set in `.env`
- Check browser console for errors
- Verify price monitoring is running (see server logs)

### CSV export not working
- Close any ad blockers or popup blockers
- Check network tab in DevTools

---

## 🔐 Security Notes

- ⚠️ Never commit `.env` file to GitHub
- **Each user's Binance API Key stays in their browser** (localStorage)
- Backend never stores or sees user Binance keys
- Backend only stores prices & tracks TP/SL hits
- Groq API key is server-side secure
- Database stored locally at `/backend/posts.db`

---

## 📝 Next Steps

### For Each User:

1. **Open SquarePulse Dashboard**
2. **Click ⚙ API Key button** → Opens API Key modal
3. **Paste your Binance Square API Key**
   - Get key from: https://www.binance.com/square/settings
4. **Click Save**
5. **Start posting trades** from any tab (Signals, News, etc)
6. **Go to "📋 My Posts" tab** to see tracking
7. **Backend monitors 24/7** - auto-posts when TP/SL hit ✅

### For Developers:

1. Start backend: `npm start`
2. Go to "My Posts" tab in app
3. Post a trade from Signals/News/etc
4. Trade will automatically appear in "My Posts"
5. Prices checked every 15 mins → auto-posts when target hit (if user set their Binance key)

**Enjoy automated trade tracking!** 🚀

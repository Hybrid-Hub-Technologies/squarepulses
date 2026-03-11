# 🚀 SquarePulse 24/7 Auto-Post & Tracking System — SETUP GUIDE

## Overview
This system enables:
- ✅ AI-powered post editing for all 6 tabs
- ✅ 24/7 automated price monitoring (even when browser closed)
- ✅ Auto-posting when TP/SL targets are hit
- ✅ Email notifications on trade milestones
- ✅ Trade history tracking with CSV export
- ✅ Encrypted API key storage for backend auto-posting

---

## Installation & Setup

### Step 1: Configure Backend Environment
Edit `backend/.env` with your credentials:

```env
GROQ_API_KEY=gsk_YOUR_ACTUAL_GROQ_KEY_HERE
PORT=5000
NODE_ENV=development
ENCRYPTION_KEY=your_super_secret_encryption_key_min_32_chars
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**IMPORTANT:**
- `ENCRYPTION_KEY`: Create a strong key (32+ characters). This encrypts your Binance API keys in the database
- `EMAIL_USER` & `EMAIL_PASSWORD`: Use Gmail + App Password (not your regular Gmail password)
  1. Go to https://myaccount.google.com/apppasswords
  2. Select "Mail" and "Windows Computer"
  3. Copy the 16-character app password to `EMAIL_PASSWORD`

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

**Installed packages:**
- express (HTTP server)
- sqlite3 (Local database)
- cors (Cross-origin requests)
- dotenv (Environment variables)
- node-cron (Scheduled monitoring)
- axios (HTTP requests)
- nodemailer (Email sending)

### Step 3: Start Backend Server
```bash
npm start
# OR for auto-reload during development:
npm run dev
```

Expected output:
```
🚀 SquarePulse Backend Server Running on http://localhost:5000
📡 Database: posts.db
⏰ Starting 24/7 price monitoring...
```

### Step 4: Configure Frontend
The frontend UI is in `index.html`. When you open it:

1. Click **⚙ API Key** button (top-right)
2. Fill in all fields:
   - **📧 Your Email**: For trade notifications (e.g., your@email.com)
   - **🚀 Binance Square Key**: Your X-Square-OpenAPI-Key
   - **🤖 Groq API Key**: Your Groq key (optional, for News/Forex/X/Intel tab)
   - **🐋 Whale Alert Key**: Optional
   - **🔍 Etherscan Key**: Optional
   - **📰 CryptoPanic Key**: Optional

3. Click **Save Keys**

### Step 5: Test the System

#### Quick Test:
1. Open `index.html` in browser
2. Go to **Signals** tab
3. Search for a coin (e.g., "Bitcoin")
4. Click **Generate Post** or write your own
5. Post using format:
   ```
   📈 $BTC Analysis
   
   Entry: $45000
   TP1: $46000
   TP2: $47000
   Stop: $44000
   
   Long setup forming...
   ```
6. Click **🚀 Post to Square**

Expected behavior:
- ✅ Post appears in **My Posts** tab
- ✅ Backend saves to database
- ✅ Backend starts monitoring automatically

#### Verify Backend is Monitoring:
Check browser console (F12 → Console):
- Should see: `✓ Post saved to tracking database & linked to user for 24/7 monitoring`

---

## How It Works

### User Posts a Trade
```
Frontend (index.html)
  ↓
1. User enters post with Entry, TP1, TP2, SL prices
2. Click "🚀 Post to Square"
3. Post sent to Binance Square API via proxy
4. Simultaneously, post data saved to backend via savePostToBackend()
   - Includes: userId, coin, entry, TP1, TP2, SL
   - User's encrypted API key already stored from API modal setup
```

### Backend Monitors 24/7
```
Backend (monitoring.js)
  ↓
Every 15 minutes:
1. Get current price from CoinGecko
2. Check against all active posts
3. If TP1 hit:
   - Decrypt user's API key
   - Auto-post to Binance Square
   - Send email notification
   - Update database
4. If TP2 hit: (repeat above)
5. If SL hit: (repeat above)
```

### User Receives Alerts
```
Email Notification (if configured)
  ↓
Subject: 🎉 BTC TP1 HIT!
To: your@email.com
Content: 
  - Coin & current price
  - Entry vs actual price
  - Suggestion to lock profits
  - Link to view on Binance Square
```

---

## Frontend Features Explained

### 1. API Key Manager (⚙ Button)
- **Stores keys locally** in browser's localStorage
- **Also syncs to backend** for 24/7 auto-posting
- Email used for trade notifications

### 2. Edit with AI (🤖 Button)
- Works on all 6 tabs: Signals, News, Forex, Whales, X Feed, Coin Intel
- Sends post to Groq API with your custom instructions
- E.g., "Make it 50% shorter, remove emojis"

### 3. My Posts Tab (📋)
- Shows all posted trades
- Real-time stats: Active / TP1 Hit / TP2 Hit / SL Hit
- Pagination (50 trades per page)
- CSV export button
- Shows age of each trade

### 4. Post Format (Required for Auto-Tracking)
Must include:
- `$SYMBOL` or `Entry: $amount`
- `TP1: $amount`
- `TP2: $amount` 
- `Stop: $amount` or `SL: $amount`

Example:
```
🚀 $ETH on the move

Entry: $2500
TP1: $2600
TP2: $2700 
Stop: $2400

Strong breakout forming 📈
```

---

## Troubleshooting

### Email Not Sending
**Issue**: Trade hits TP but no email received
**Fix**:
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `backend/.env`
2. Check Gmail app password (not regular password!)
3. Allow "Less secure apps" if using Gmail
4. Check backend logs for: `📧 Email sent to...` or `Email send failed`

### Backend Not Monitoring
**Issue**: Prices not checking, posts freeze in "ACTIVE" state
**Fix**:
1. Make sure `npm start` is running
2. Check that `ENCRYPTION_KEY` is set in `.env`
3. Verify node-cron is working: Should log `Checking prices...` every 15 min
4. Check browser console for connection errors to `localhost:5000`

### Posts Not Saving to Backend
**Issue**: My Posts tab shows empty
**Fix**:
1. Make sure API modal is filled (email required)
2. Click "Save Keys" after entering email
3. Check browser console (F12) for errors
4. Verify backend is running: `curl http://localhost:5000/health`

### API Key Not Syncing
**Issue**: Encrypted key not sent to backend
**Fix**:
1. Make sure backend is running on `http://localhost:5000`
2. Check browser Network tab (F12) for POST to `/api/users/...`
3. If connection refused: backend server not started

---

## Security Considerations

### 🔒 How Keys Are Protected

**Frontend (Browser)**
- Binance API key stored in localStorage (user's machine only)
- Used immediately for posting to Binance Square

**Backend (Database)**
- Binance API key encrypted with AES-256-CBC
- Stored in `users` table, never in plaintext
- Only decrypted when posting (every 15 min if TP/SL hit)
- Decryption key (`ENCRYPTION_KEY`) not hardcoded, from env

**Best Practices**
- Never commit `.env` file to Git
- Use strong `ENCRYPTION_KEY` (32+ random characters)
- Use Gmail app password (not regular password)
- Limit Binance API key permissions to "Post Only"

---

## Database Schema

### `posts` table
```
id, user_id, coin_name, coin_symbol, entry_price, tp1, tp2, sl,
post_content, status, tp1_hit_at, tp2_hit_at, sl_hit_at, 
posted_to_square, created_at
```

### `users` table
```
id, binance_api_key_encrypted, email, created_at, updated_at
```

### `price_history` table
```
id, post_id, current_price, checked_at
```

### `email_logs` table
```
id, user_id, post_id, email, subject, sent_at, status
```

---

## API Endpoints Reference

### POST `/api/users/:userId/api-key`
Store encrypted Binance API key
```json
{
  "apiKey": "x-square-openapi-...",
  "email": "user@example.com"
}
```

### GET `/api/users/:userId/api-key`
Retrieve decrypted key (backend only)

### POST `/api/posts`
Save a new trade post
```json
{
  "user_id": "user_xyz",
  "coin_symbol": "BTC",
  "entry_price": 45000,
  "tp1": 46000,
  "tp2": 47000,
  "sl": 44000,
  "post_content": "..."
}
```

### GET `/api/posts?page=1`
Get paginated posts (50 per page)

### GET `/api/posts/alerts/pending`
Get TP/SL hits (for frontend polling)

### PATCH `/api/posts/:id/close`
Close a trade

### PATCH `/api/posts/:id/posted`
Mark as posted to Binance

### GET `/api/posts/export/csv`
Download CSV of all posts

### GET `/health`
Server health check

---

## Performance & Limits

### Monitoring
- **Frequency**: Every 15 minutes
- **Price Source**: CoinGecko (free API, no key required)
- **Max Posts**: Unlimited (but monitor performance if 1000+)

### Emails
- **Limit**: Gmail allows ~500 emails/day
- **If Hit**: Queue emails, send in batches
- **Retry**: On first fail, retries once after 30s

### Database
- **Size**: SQLite, local file (~1MB per 10k trades)
- **Backup**: Copy `posts.db` regularly to have failsafe

---

## Deployment Notes

### Local Hosting
- ✅ Currently runs on `http://localhost:5000`
- Perfect for personal use
- Frontend in `c:\xampp\htdocs\squarepulse\squarepulses\`

### Production Deployment
- Host backend on cloud (Heroku, DigitalOcean, AWS Lambda)
- Update frontend API calls from `http://localhost:5000` to your server
- Use environment variables for all secrets
- Consider database backup strategy

---

## Support & Next Steps

### Immediate Tasks
1. ✅ Configure `.env` with your Gmail app password
2. ✅ Run `npm start` in backend folder
3. ✅ Fill API modal with email and keys
4. ✅ Post a test trade from Signals tab

### Optional Enhancements
- Add SMS notifications (Twilio)
- Add Telegram bot alerts
- Advanced post parsing (NLP)
- Trading analytics dashboard
- Multi-user support with authentication

---

## Contact & Issues

If backend monitoring not starting:
1. Check browser console for errors
2. Verify backend console shows: `Starting 24/7 price monitoring...`
3. Check that `ENCRYPTION_KEY` environment variable is set

---

**Last Updated**: 2024
**Version**: 1.0.0 (Working with 24/7 Auto-Post & Email Notifications)

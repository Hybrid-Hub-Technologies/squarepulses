# 🎯 Quick Start Checklist — 24/7 Auto-Post System

## Prerequisites ✓
- ✅ Node.js installed
- ✅ Backend `/backend` folder exists
- ✅ nodemailer installed (just did this)

---

## IMMEDIATE SETUP (5 minutes)

### 1️⃣ Email Configuration
Edit `backend/.env`:
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy 16-character password → paste to EMAIL_PASSWORD
4. Save `.env` file

### 2️⃣ Generate Encryption Key
```
ENCRYPTION_KEY=generatesomething32charsecurerandomhere!@#
```
**Use this as placeholder:**
```
ENCRYPTION_KEY=sp_secret_key_32_chars_min_length_12345
```

### 3️⃣ Start Backend Server
```bash
cd backend
npm start
```

**You should see:**
```
🚀 SquarePulse Backend Server Running on http://localhost:5000
📡 Database: posts.db
⏰ Starting 24/7 price monitoring...
```

✅ **Backend is ready!**

---

## FRONTEND SETUP (2 minutes)

### 4️⃣ Open Browser
1. Open `index.html` in Chrome/Firefox
2. Click **⚙ API Key** (top-right button)

### 5️⃣ Fill API Modal
- **📧 Email:** your@email.com (REQUIRED for alerts)
- **🚀 Binance Key:** X-Square-OpenAPI-Key
- **🤖 Groq Key:** gsk_... (get free from console.groq.com)
- Others: optional

### 6️⃣ Save Keys
- Click **Save Keys**
- Wait for confirmation: `API Keys saved & synced to backend! 🟢`
- Frontend will also send encrypted key to backend

✅ **Frontend is configured!**

---

## FIRST TRADE TEST (3 minutes)

### 7️⃣ Post a Trade
1. Go to **Signals** tab
2. Search: "Bitcoin" 
3. Click **Generate Post** (or write your own)
4. Paste example:
   ```
   $BTC Testing 24/7 System
   
   Entry: $45000
   TP1: $46000
   TP2: $47000
   Stop: $44000
   ```
5. Click **🚀 Post to Square**

### 8️⃣ Verify It Worked
1. Check **My Posts** tab
   - Trade should appear in table
   - Stats should show "Active Posts: 1"
   
2. Check browser console (F12):
   ```
   ✓ Post saved to tracking database & linked to user for 24/7 monitoring
   ```

3. Check backend console:
   ```
   BTC: $45231 (Entry: $45000)
   ```

✅ **System is working!**

---

## 24/7 MONITORING VERIFICATION (Optional)

### Backend Monitoring Active?
Monitor will run automatically every 15 minutes:
1. Fetch price from CoinGecko
2. Compare against your TP1, TP2, SL
3. Auto-post when hit
4. Send email notification

**Expected logs:**
```
[2024-01-15T10:30:00.000Z] Checking prices...
BTC: $45500 (Entry: $45000)
TP1 HIT: BTC @ $46000
✅ Auto-posted TP1 for BTC
📧 Email sent to your@email.com
```

### Email Received?
- Check spam folder if not in inbox
- Look for subject: `🎉 BTC TP1 HIT!`
- Click "View on Binance Square" link in email

---

## AUTOMATE: Set Browser to Stay Open

Since monitoring runs every 15 min, you can now:
- ✅ Close browser & still get alerts (backend running)
- ✅ Post trades from any device
- ✅ Browse other sites while tracking

**Recommended:**
- Keep `npm start` running in background (use Task Scheduler on Windows or `screen` on Mac/Linux)
- Or use PM2: `npm install -g pm2` then `pm2 start server.js`

---

## TROUBLESHOOTING

### Issue: "Could not sync key to backend"
**Solution:**
- Make sure backend is running (`npm start`)
- Check firewall allows `localhost:5000`

### Issue: No email received
**Solution:**
- Verify Gmail app password in `.env`
- Check backend logs for: `Email send failed`
- Try sending test email: curl to test endpoint

### Issue: My Posts tab empty
**Solution:**
- Fill email in API modal
- Click "Save Keys"
- Re-post the trade

### Issue: backend crashes
**Solution:**
- Check `.env` has all required fields
- Reinstall dependencies: `cd backend && npm install`
- Check for typos in ENCRYPTION_KEY

---

## NEXT STEPS

### ✨ Features to Explore
- Edit with AI (🤖 button on all tabs)
- CSV export (💾 button on My Posts)
- News/Forex/Whales/X Feed analysis
- Watch token performance

### 🚀 Advanced Setup
- Deploy backend to cloud (keep 24/7)
- Add Telegram/SMS notifications
- Analytics dashboard
- Multi-currency support

### 📚 Read Full Guide
See `SETUP_GUIDE.md` for:
- API Endpoints reference
- Database schema
- Security considerations
- Deployment options

---

## ✅ System Status

**Frontend:** ⚙️ Needs API modal filled  
**Backend:** ⏳ Needs `npm start` in terminal  
**Monitoring:** 🔄 Starts automatically every 15 min  
**Emails:** 📧 Requires Gmail app password  

**Status:** 🟡 READY FOR FIRST TEST

---

Start with Step 1️⃣ above! Happy trading! 🚀

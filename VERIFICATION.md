# 🔍 System Verification Checklist

## Pre-Start Verification (Do Before Opening Browser)

### ✅ Backend Dependencies Installed
```bash
cd backend
node -v  # Should be v14+ 
npm -v   # Should be v6+
npm list express sqlite3 dotenv axios node-cron nodemailer
```
**Expected:** All packages listed without errors

---

### ✅ Environment File Complete
Check `backend/.env` contains:
```
✓ GROQ_API_KEY=gsk_...
✓ PORT=5000
✓ NODE_ENV=development
✓ ENCRYPTION_KEY=your_super_secret_32_char_key_here
✓ EMAIL_USER=your_gmail@gmail.com
✓ EMAIL_PASSWORD=your_app_password_16_chars
```

**Test:** `cat backend/.env` (should show all 6 variables)

---

### ✅ Database Ready
Check files exist:
```
✓ backend/database.js
✓ backend/utils/encryption.js
✓ backend/utils/emailNotifications.js
✓ backend/routes/posts.js
✓ backend/monitoring.js
✓ backend/server.js
```

Database will auto-create on first `npm start`

---

## Startup Sequence (In Order)

### Step 1: Start Backend Server
```bash
cd backend
npm start
```

**Expected Output (First Run):**
```
🚀 SquarePulse Backend Server Running on http://localhost:5000
📡 Database: posts.db
⏰ Starting 24/7 price monitoring...

[timestamp] Checking prices...
```

**Common Issues:**
- `Error: Cannot find module 'express'` → Run `npm install`
- `Port already in use` → Change port in `.env` or close conflicting app
- `Cannot connect to database` → Check write permissions on `backend/` folder

---

### Step 2: Verify Backend Health
**In another terminal, test:**
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "Server running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

If error: Backend didn't start correctly. Check console output.

---

### Step 3: Open Frontend in Browser
- Open `index.html` in Chrome/Firefox
- Should load without errors
- **Check browser console (F12):**
  ```
  ℹ Could not load key from backend (expected if first time)
  ```

---

## Frontend Configuration Tests

### Test 1: API Modal Opens
**Action:** Click **⚙ API Key** button (top-right)
**Expected:** Modal appears with 5 input fields
- Email (NEW)
- Binance Square Key
- Groq API Key
- Whale Alert Key
- Etherscan Key

---

### Test 2: Email Saves
**Action:**
1. Type: `test@gmail.com` in Email field
2. Fill Binance Key: (any 20+ char string for testing)
3. Click **Save Keys**

**Expected in browser console:**
```
✓ API key encrypted and stored on backend for 24/7 auto-posting
```

**Expected in backend console:**
```
POST /users/user_abc123_1234567890/api-key
Successfully saved API key
```

---

### Test 3: Key Sync to Backend
**Action:** Check backend database

```bash
cd backend
sqlite3 posts.db "SELECT id, email FROM users LIMIT 1;"
```

**Expected Output:**
```
user_abc123_1234567890|test@gmail.com
```

---

## Post Generation Tests

### Test 4: Create Test Post
**Action:**
1. Go to **Signals** tab
2. Search: "Bitcoin"
3. Click **Generate Post**
4. Post should appear in composer

---

### Test 5: Save to Backend
**Action:**
1. Modify post to include prices:
   ```
   $BTC Test Run
   Entry: $45000
   TP1: $46000
   TP2: $47000
   Stop: $44000
   ```
2. Click **🚀 Post to Square** (ignore if posting fails, we're testing backend sync)

**Expected in browser console:**
```
✓ Post saved to tracking database & linked to user for 24/7 monitoring
```

**Verify in database:**
```bash
sqlite3 backend/posts.db "SELECT coin_symbol, entry_price, tp1, tp2, sl, status FROM posts LIMIT 1;"
```

**Expected:**
```
BTC|45000.0|46000.0|47000.0|44000.0|ACTIVE
```

---

### Test 6: My Posts Tab Shows Data
**Action:**
1. Click **📋 My Posts** tab
2. Should see table with 1 row
3. Stats should show: "Active Posts: 1"
4. Row should show: BTC | 45000 | 46000 | 47000 | 44000 | ACTIVE | <age> | [Close]

**Expected:** Table populated with test trade

---

## Monitoring Tests

### Test 7: Backend Monitoring Loop
**Expected in backend console every 15 minutes:**
```
[2024-01-15T10:30:00.000Z] Checking prices...
BTC: $45231 (Entry: $45000)
```

**If nothing appears:**
1. Check monitoring.js is importing node-cron correctly
2. Verify database has active posts: 
   ```
   sqlite3 backend/posts.db "SELECT COUNT(*) FROM posts WHERE status='ACTIVE';"
   ```

---

### Test 8: Mock TP Hit
**Manual test without waiting 15 minutes:**

1. Create post with low TP1:
   - Entry: $45000 
   - TP1: $44500 (Bitcoin currently higher)
   
2. Wait for next 15-min interval, or manually trigger check:
   ```bash
   # Add this to monitoring.js temporarily for testing:
   checkPrices(); // Run immediately instead of waiting
   ```

3. Check backend console for:
   ```
   ✅ TP1 HIT: BTC @ $44500
   📤 Auto-posted TP1 for BTC
   📧 Email sent to test@gmail.com
   ```

4. Check My Posts tab - TP1 column should change color (green)

---

## Email Notification Tests

### Test 9: Gmail Configuration Valid
**Action - Test email sending:**

Create `test_email.js` in backend folder:
```javascript
const { sendNotification, getTP1EmailTemplate } = require('./utils/emailNotifications');

sendNotification('your@email.com', '🎉 Test Email', getTP1EmailTemplate('TEST', 1000, 1100))
  .then(() => console.log('✓ Email test successful'))
  .catch(err => console.error('✗ Email failed:', err.message));
```

Run:
```bash
node test_email.js
```

**Expected:**
- ✅ Check Gmail inbox for test email (or spam folder)
- ✅ If failed: Check EMAIL_USER and EMAIL_PASSWORD are correct

---

### Test 10: TP Hit Triggers Email
**When TP is hit during monitoring:**

Expected email:
- From: `SquarePulse <your_gmail@gmail.com>`
- To: `your@email.com`
- Subject: `🎉 BTC TP1 HIT!`
- Contains: Entry price, TP price, link to Binance Square

---

## Edge Case Tests (Optional)

### Test 11: Multiple Posts
**Action:**
1. Create 3 different posts (BTC, ETH, DOGE)
2. Click **💾 Export CSV**
3. Open downloaded file

**Expected:** CSV with 3 rows, all data populated

---

### Test 12: Browser Close (24/7 Test)
**Action:**
1. Create a post with Entry: $45000, TP1: $44500
2. Close browser completely
3. Let backend run for 15 minutes
4. Reopen browser and check **My Posts** tab

**Expected:**
- TP1 Hit shows in table (marked green)
- Email was sent (check inbox)
- Backend auto-posted to Binance (if API key valid)

---

### Test 13: API Modal Persistence
**Action:**
1. Fill all fields with test data
2. Click **Save Keys**
3. Refresh page (F5)
4. Click **⚙ API Key** again

**Expected:** All fields repopulated from localStorage

---

## Troubleshooting Test Results

### ❌ "Cannot POST /api/users/:userId/api-key"
**Cause:** Frontend userId not generated or format wrong
**Fix:**
```javascript
// In browser console, run:
localStorage.getItem('sq_user_id')
// Should return something like: user_abc123_1234567890
```

### ❌ "POST /api/posts" returns error
**Cause:** Missing user_id field or database issue
**Fix:**
```bash
sqlite3 backend/posts.db ".tables"
# Should show: auto_posts email_logs posts posts_new price_history users
```

### ❌ Monitoring not checking prices
**Cause:** node-cron not executing
**Fix:**
1. Check if `node-cron` in package.json dependencies
2. Restart backend server (kill and npm start)
3. Check backend console logs

### ❌ Email not sending
**Cause:** Gmail app password or configuration issue
**Fix:**
1. Generate new Gmail app password (not regular password)
2. Update EMAIL_PASSWORD in .env
3. Restart backend server
4. Test with test_email.js script above

---

## Performance Baseline

### Expected Performance Metrics
- **Backend startup:** < 2 seconds
- **Health check response:** < 100ms
- **Price check cycle:** < 5 seconds per 50 posts
- **Email send time:** < 2 seconds
- **Database query (1K posts):** < 200ms

If slower: May need optimization (add indexes, pagination)

---

## Final System Status Verification

Run this diagnostic command (create `diagnostic.js`):
```javascript
const db = require('./database');
const fs = require('fs');

console.log('📊 System Diagnostic\n');
db.all('SELECT COUNT(*) as count FROM posts', (err, rows) => {
  console.log(`Posts: ${rows[0].count}`);
});
db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
  console.log(`Users: ${rows[0].count}`);
});
console.log(`Email config: ${process.env.EMAIL_USER ? '✓' : '✗'}`);
console.log(`Encryption key: ${process.env.ENCRYPTION_KEY ? '✓' : '✗'}`);
```

**Expected Output:**
```
📊 System Diagnostic

Posts: 1
Users: 1
Email config: ✓
Encryption key: ✓
```

---

## ✅ All Tests Passed!

If you've passed all tests above, your system is:
- ✅ Backend running 24/7
- ✅ Frontend configured with API modal
- ✅ Posts saving to database
- ✅ Monitoring checking prices every 15 min
- ✅ Email notifications working
- ✅ Browser closure doesn't stop trading system

**You're ready!** Browser can close and trading continues. 🚀

---

## Next: Real Usage

1. **First Real Trade:** Post a trade with actual TP/SL prices
2. **Monitor Dashboard:** Check My Posts for live updates
3. **Stay Logged:** Keep backend `npm start` running
4. **Email Alerts:** Watch inbox for TP/SL hits
5. **Optimize:** Adjust post format if parsing fails

---

Refer to `SETUP_GUIDE.md` for full documentation.

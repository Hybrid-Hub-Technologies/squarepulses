# 🎯 SquarePulse Local Network Setup - Quick Start Guide

## ✅ Current Status
- **Backend Server**: ✔️ Running on port 5000
- **Local IP Address**: `192.168.100.81`
- **Frontend**: Ready on XAMPP

---

## 🌐 Access Points on Your Network

### From Your Computer (Local Machine)
- **Frontend**: http://192.168.100.81/squarepulses/index.html
- **Backend API**: http://192.168.100.81:5000
- **API Health**: http://192.168.100.81:5000/health

### From Other Devices on Network
Use the same URLs above - any device on your local network (192.168.x.x) can access:
- Phones, Tablets, Laptops
- Replace `192.168.100.81` with your machine's actual IP if different

---

## 🚀 How to Start Services

### Option 1: Run Startup Script (Easiest)
```bash
START_LOCAL_NETWORK.bat
```
This will:
- Start Backend Server
- Start OpenClaw Integration  
- Open Frontend in your browser

### Option 2: Manual Start

#### Start Backend:
```bash
cd c:\xampp\htdocs\squarepulse\squarepulses\backend
npm start
```
Or:
```bash
node server.js
```

#### Start OpenClaw (Optional):
```bash
cd c:\xampp\htdocs\squarepulse\squarepulses\openclaw
node integration.js
```

---

## 📡 API Endpoints Available

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post

### Portfolio  
- `GET /api/portfolio` - Get portfolio data
- `POST /api/portfolio` - Update portfolio

### Bot
- `POST /api/bot/command` - Execute bot command

### Chat
- `POST /api/chat` - Send message to AI

### OpenClaw
- `POST /api/openclaw/process` - Process OpenClaw commands

---

## 🔧 Configuration Changes Made

1. **Backend Server** (`backend/server.js`)
   - Now listens on `0.0.0.0` (all network interfaces)
   - Displays both localhost and network IP on startup

2. **Frontend** (`app.js`)
   - Updated to connect to `192.168.100.81:5000` instead of `localhost`
   - Accessible from any device on your network

---

## 🐛 Troubleshooting

### Port 5000 Already in Use
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Backend Not Responding
1. Check if backend is running:
   ```bash
   curl http://192.168.100.81:5000/health
   ```
2. Look for error messages in the backend terminal
3. Ensure port 5000 is not blocked by firewall

### Cannot Access from Other Devices
1. Verify both devices are on same network
2. Try ping: `ping 192.168.100.81`
3. Check Windows Firewall - allow Node.js through

---

## 💾 Database
- SQLite database: `backend/posts.db`
- Automatically created on first startup
- Backup: `backend/posts.db.YYYY-MM-DD.backup`

---

## ⚙️ Need Help?
- Check logs in the backend terminal
- Review README.md files in each folder
- Check environment variables in `.env` files (if needed)

---

**Enjoy using SquarePulse on your local network! 🚀**

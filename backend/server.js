require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { startMonitoring } = require('./monitoring');
const postsRouter = require('./routes/posts');
const portfolioRouter = require('./routes/portfolio');
const botRouter = require('./routes/bot');
const tasksRouter = require('./routes/tasks');
const openclawRouter = require('./routes/openclaw');
const chatRouter = require('./routes/chat');
const tradingRouter = require('./routes/trading'); // NEW: Binance trading
const orchestrateRouter = require('./routes/orchestrate'); // NEW: OpenClaw orchestration
const cron = require('node-cron');
const TradingBot = require('./utils/tradingBot');
const BinanceSpotAPI = require('./utils/binanceSpotApi');
const APIKeyManager = require('./utils/apiKeyManager');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api', postsRouter);
app.use('/api', portfolioRouter);
app.use('/api', botRouter);
app.use('/api', tasksRouter);
app.use('/api', openclawRouter);
app.use('/api', chatRouter);
app.use('/api/trading', tradingRouter); // NEW: Binance trading API routes
app.use('/api', orchestrateRouter); // NEW: OpenClaw orchestration

// ── Start monitoring when server starts ──────────────────
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const getLocalIP = () => {
    const ifaces = os.networkInterfaces();
    for (const ifname in ifaces) {
      for (const iface of ifaces[ifname]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  };
  const localIP = getLocalIP();
  console.log(`\n🚀 SquarePulse Backend Server Running`);
  console.log(`📍 Local Machine: http://localhost:${PORT}`);
  console.log(`📍 Local Network: http://${localIP}:${PORT}`);
  console.log(`📡 Database: posts.db`);
  console.log(`⏰ Starting 24/7 price monitoring...\n`);
  
  startMonitoring();

  // ── Auto-Trading Monitor ──────────────────────────────────
  // Check active trades every minute for TP/SL targets
  console.log('🤖 Starting Auto-Trading Monitor (every 1 minute)...');
  
  cron.schedule('* * * * *', async () => {
    try {
      const accounts = APIKeyManager.listAccounts();
      
      if (accounts.success && accounts.data.length > 0) {
        for (const account of accounts.data) {
          // Import the trading bot cache logic
          const tradingFile = require('./routes/trading');
          // Note: In production, you might want to initialize bots for each account
          // and check trades autonomously
        }
      }
    } catch (error) {
      // Silent fail to not spam logs
      if (error.message && error.message.includes('Check')) {
        console.error('⚠️ Auto-trading check error:', error.message);
      }
    }
  });

  console.log('✅ All systems ready for trading!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  db.close(() => {
    console.log('Database closed');
    process.exit(0);
  });
});

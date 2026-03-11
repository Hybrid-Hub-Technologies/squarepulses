require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { startMonitoring } = require('./monitoring');
const postsRouter = require('./routes/posts');
const portfolioRouter = require('./routes/portfolio');
const botRouter = require('./routes/bot');

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

// ── Start monitoring when server starts ──────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SquarePulse Backend Server Running on http://localhost:${PORT}`);
  console.log(`📡 Database: posts.db`);
  console.log(`⏰ Starting 24/7 price monitoring...\n`);
  
  startMonitoring();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  db.close(() => {
    console.log('Database closed');
    process.exit(0);
  });
});

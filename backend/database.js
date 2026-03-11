const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'posts.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite');
});

// Create tables on startup
db.serialize(() => {
  // Posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      coin_name TEXT NOT NULL,
      coin_symbol TEXT NOT NULL,
      entry_price REAL NOT NULL,
      tp1 REAL NOT NULL,
      tp2 REAL NOT NULL,
      sl REAL NOT NULL,
      post_content TEXT,
      status TEXT DEFAULT 'ACTIVE',
      tp1_hit_at DATETIME,
      tp2_hit_at DATETIME,
      sl_hit_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      posted_to_square INTEGER DEFAULT 0
    )
  `);

  // Users table (store encrypted API keys)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      binance_api_key_encrypted TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Price tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      current_price REAL NOT NULL,
      checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);

  // Auto-posts table (for TP hit posts)
  db.run(`
    CREATE TABLE IF NOT EXISTS auto_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      tp_level TEXT,
      auto_post_content TEXT,
      posted_at DATETIME,
      square_response TEXT,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);

  // Email logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      event_type TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id)
    )
  `);

  // Personalization settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS personalization_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      niche TEXT DEFAULT 'mixed',
      brand_voice TEXT DEFAULT 'Professional',
      emoji_usage TEXT DEFAULT 'Moderate',
      post_length TEXT DEFAULT 'Medium',
      posts_per_day INTEGER DEFAULT 1,
      brand_instructions TEXT,
      auto_post_enabled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Auto trading bot strategies table
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      strategy_name TEXT NOT NULL,
      strategy_type TEXT,
      coin_symbol TEXT,
      investment_amount REAL,
      risk_level TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Bot trades table
  db.run(`
    CREATE TABLE IF NOT EXISTS bot_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id INTEGER NOT NULL,
      coin_symbol TEXT NOT NULL,
      entry_price REAL NOT NULL,
      current_price REAL,
      quantity REAL NOT NULL,
      entry_time DATETIME,
      exit_time DATETIME,
      profit_loss REAL,
      status TEXT DEFAULT 'OPEN',
      FOREIGN KEY(strategy_id) REFERENCES bot_strategies(id)
    )
  `);

  // Wealth data snapshots (for portfolio tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS wealth_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      total_value REAL NOT NULL,
      total_pnl REAL,
      pnl_percent REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;

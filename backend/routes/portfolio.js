const express = require('express');
const { decrypt } = require('../utils/encryption');
const binanceApi = require('../utils/binanceApi');
const db = require('../database');
const router = express.Router();

/**
 * GET /api/portfolio/balances
 * Get user's current balances from Binance
 */
router.get('/portfolio/balances', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  // Get encrypted API key from database
  db.get('SELECT binance_api_key_encrypted FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    try {
      const apiKey = process.env.BINANCE_API_KEY; // From environment (user's key stored server-side)
      const secretKey = process.env.BINANCE_SECRET_KEY;
      
      // For production: decrypt user's key from database
      // const apiKey = decrypt(row.binance_api_key_encrypted);
      
      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: 'Binance API key not configured' });
      }

      const result = await binanceApi.getBalances(apiKey, secretKey, false);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * GET /api/portfolio/value
 * Get total portfolio value in USDT
 */
router.get('/portfolio/value', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  db.get('SELECT binance_api_key_encrypted FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const secretKey = process.env.BINANCE_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: 'Binance API key not configured' });
      }

      const result = await binanceApi.getPortfolioValue(apiKey, secretKey, false);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * GET /api/portfolio/trades/:symbol
 * Get trade history for a symbol
 */
router.get('/portfolio/trades/:symbol', (req, res) => {
  const userId = req.query.userId;
  const symbol = req.params.symbol;
  const limit = req.query.limit || 100;
  
  if (!userId || !symbol) {
    return res.status(400).json({ error: 'userId and symbol required' });
  }

  db.get('SELECT binance_api_key_encrypted FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    try {
      const apiKey = process.env.BINANCE_API_KEY;
      const secretKey = process.env.BINANCE_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        return res.status(400).json({ error: 'Binance API key not configured' });
      }

      const result = await binanceApi.getTradeHistory(symbol, apiKey, secretKey, false, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

/**
 * GET /api/portfolio/price/:symbol
 * Get current price of a symbol
 */
router.get('/portfolio/price/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  
  try {
    const result = await binanceApi.getPrice(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/portfolio/klines/:symbol
 * Get candlestick data for charting
 */
router.get('/portfolio/klines/:symbol', async (req, res) => {
  const symbol = req.params.symbol;
  const interval = req.query.interval || '1d';
  const limit = req.query.limit || 100;
  const startTime = req.query.startTime;
  const endTime = req.query.endTime;
  
  try {
    const result = await binanceApi.getKlines(symbol, interval, limit, startTime, endTime);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Save portfolio snapshot (for wealth tracking)
 */
router.post('/portfolio/snapshot', (req, res) => {
  const { user_id, total_value, assets } = req.body;
  
  if (!user_id || total_value === undefined) {
    return res.status(400).json({ error: 'user_id and total_value required' });
  }

  db.run(`
    INSERT INTO wealth_snapshots (user_id, total_value, assets_json, taken_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `, [user_id, total_value, JSON.stringify(assets || [])], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Snapshot saved' });
  });
});

/**
 * Get portfolio history (wealth tracking)
 */
router.get('/portfolio/history', (req, res) => {
  const userId = req.query.userId;
  const days = req.query.days || 30;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  db.all(`
    SELECT * FROM wealth_snapshots
    WHERE user_id = ? AND taken_at >= ?
    ORDER BY taken_at DESC
    LIMIT 100
  `, [userId, since], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

module.exports = router;

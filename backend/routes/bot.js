const express = require('express');
const binanceApi = require('../utils/binanceApi');
const db = require('../database');
const router = express.Router();

/**
 * GET /api/bot/strategies
 * Get all bot trading strategies for a user
 */
router.get('/bot/strategies', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  db.all(`
    SELECT * FROM bot_strategies
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

/**
 * POST /api/bot/strategies
 * Create a new bot strategy
 */
router.post('/bot/strategies', (req, res) => {
  const { 
    user_id, 
    name, 
    type, 
    symbol, 
    entry_price, 
    target_price, 
    stop_loss, 
    quantity,
    enabled 
  } = req.body;

  if (!user_id || !name || !type || !symbol) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(`
    INSERT INTO bot_strategies (
      user_id, name, type, symbol, entry_price, target_price, 
      stop_loss, quantity, enabled, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    user_id, name, type, symbol, entry_price || null, target_price || null,
    stop_loss || null, quantity || 0, enabled ? 1 : 0, 'PENDING'
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      id: this.lastID, 
      message: 'Strategy created' 
    });
  });
});

/**
 * PUT /api/bot/strategies/:id
 * Update a bot strategy
 */
router.put('/bot/strategies/:id', (req, res) => {
  const strategyId = req.params.id;
  const { enabled, status } = req.body;

  db.run(`
    UPDATE bot_strategies 
    SET enabled = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [enabled ? 1 : 0, status, strategyId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Strategy updated' });
  });
});

/**
 * DELETE /api/bot/strategies/:id
 * Delete a bot strategy
 */
router.delete('/bot/strategies/:id', (req, res) => {
  const strategyId = req.params.id;

  db.run('DELETE FROM bot_strategies WHERE id = ?', [strategyId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: 'Strategy deleted' });
  });
});

/**
 * GET /api/bot/trades
 * Get all bot trades
 */
router.get('/bot/trades', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  db.all(`
    SELECT * FROM bot_trades
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, data: rows || [] });
  });
});

/**
 * POST /api/bot/execute
 * Execute a market order through the bot
 */
router.post('/bot/execute', async (req, res) => {
  const { 
    user_id, 
    strategy_id, 
    symbol, 
    side, 
    type, 
    quantity,
    price 
  } = req.body;

  if (!user_id || !symbol || !side || !type || !quantity) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'Binance API not configured' });
    }

    // Execute order on Binance
    const orderResult = await binanceApi.createOrder(
      symbol, 
      side, 
      type, 
      quantity, 
      price,
      apiKey, 
      secretKey, 
      false // mainnet
    );

    if (!orderResult.success) {
      return res.status(400).json({ error: orderResult.error, code: orderResult.code });
    }

    // Save trade record to database
    const orderId = orderResult.data.orderId;
    const executedQty = orderResult.data.executedQty;
    const executedPrice = orderResult.data.fills?.[0]?.price || price;
    
    db.run(`
      INSERT INTO bot_trades (
        user_id, strategy_id, symbol, side, quantity, 
        entry_price, order_id, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, strategy_id || null, symbol, side, executedQty,
      executedPrice, orderId, 'EXECUTED'
    ], function(err) {
      if (err) console.error('Error saving trade:', err);
    });

    res.json({
      success: true,
      order: orderResult.data,
      message: `Order executed: ${side} ${executedQty} ${symbol}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bot/close-position
 * Close an open position
 */
router.post('/bot/close-position', async (req, res) => {
  const { user_id, trade_id, symbol, quantity } = req.body;

  if (!user_id || !symbol || !quantity) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const apiKey = process.env.BINANCE_API_KEY;
    const secretKey = process.env.BINANCE_SECRET_KEY;
    
    // Determine opposite side
    const originalTrade = await new Promise((resolve) => {
      db.get('SELECT side FROM bot_trades WHERE id = ?', [trade_id], (err, row) => {
        resolve(row);
      });
    });

    const closeSide = originalTrade?.side === 'BUY' ? 'SELL' : 'BUY';

    // Execute closing order
    const closeResult = await binanceApi.createOrder(
      symbol, 
      closeSide, 
      'MARKET', 
      quantity,
      null,
      apiKey, 
      secretKey, 
      false
    );

    if (!closeResult.success) {
      return res.status(400).json({ error: closeResult.error });
    }

    // Calculate P&L
    const executedPrice = closeResult.data.fills?.[0]?.price || 0;
    
    db.run(`
      UPDATE bot_trades 
      SET exit_price = ?, status = 'CLOSED', closed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [executedPrice, trade_id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
    });

    res.json({
      success: true,
      order: closeResult.data,
      message: `Position closed: ${closeSide} ${quantity} ${symbol}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/bot/stats
 * Get bot trading statistics
 */
router.get('/bot/stats', (req, res) => {
  const userId = req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  db.all(`
    SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN status = 'EXECUTED' THEN 1 ELSE 0 END) as active_trades,
      SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_trades,
      AVG(CASE WHEN exit_price > 0 THEN ((exit_price - entry_price) / entry_price * 100) ELSE NULL END) as avg_return_percent
    FROM bot_trades
    WHERE user_id = ?
  `, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ 
      success: true, 
      data: row || { 
        total_trades: 0, 
        active_trades: 0, 
        closed_trades: 0, 
        avg_return_percent: 0 
      } 
    });
  });
});

module.exports = router;

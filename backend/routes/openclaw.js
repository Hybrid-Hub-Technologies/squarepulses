// ============================================================
// routes/openclaw.js — OpenClaw Trading Position Management
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../database');
const binanceApi = require('../utils/binanceApi');

// In-memory position storage (can be migrated to database)
let positions = [];

// ────────────────────────────────────────────────────────────
// GET /api/openclaw/positions/:userId
// Get all open positions for a user
// ────────────────────────────────────────────────────────────
router.get('/openclaw/positions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userPositions = positions.filter(p => p.user_id === userId && p.status === 'open');
    res.json({ success: true, positions: userPositions });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/openclaw/open
// Open a new trading position with OpenClaw
// ────────────────────────────────────────────────────────────
router.post('/openclaw/open', async (req, res) => {
  try {
    const {
      user_id,
      coin_symbol,
      entry_price,
      tp1,
      tp2,
      sl,
      position_size,
      leverage
    } = req.body;

    if (!user_id || !coin_symbol || !entry_price) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log(`🦅 OpenClaw: Opening ${coin_symbol} position at $${entry_price} (Size: ${position_size}, Leverage: ${leverage}x)`);

    const position = {
      id: `POS-${Date.now()}`,
      user_id,
      coin_symbol,
      entry_price: parseFloat(entry_price),
      tp1: parseFloat(tp1),
      tp2: parseFloat(tp2),
      sl: parseFloat(sl),
      position_size: parseFloat(position_size),
      leverage: parseFloat(leverage),
      current_price: parseFloat(entry_price),
      pnl: 0,
      pnl_percent: 0,
      status: 'open',
      created_at: new Date(),
      tp1_hit: false,
      tp2_hit: false,
      sl_hit: false
    };

    positions.push(position);

    res.json({
      success: true,
      message: `✅ Position opened: ${coin_symbol}`,
      position
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// PATCH /api/openclaw/close/:positionId
// Close a trading position
// ────────────────────────────────────────────────────────────
router.patch('/openclaw/close/:positionId', async (req, res) => {
  try {
    const { positionId } = req.params;
    const { close_price } = req.body;

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }

    const pnl = (close_price - position.entry_price) * position.position_size;
    const pnl_percent = ((close_price - position.entry_price) / position.entry_price) * 100;

    position.status = 'closed';
    position.close_price = parseFloat(close_price);
    position.pnl = pnl;
    position.pnl_percent = pnl_percent;
    position.closed_at = new Date();

    console.log(`✅ OpenClaw: Position closed - ${position.coin_symbol} | PnL: $${pnl.toFixed(2)} (${pnl_percent.toFixed(2)}%)`);

    res.json({
      success: true,
      message: `✅ Position closed`,
      position
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/openclaw/monitor/:positionId
// Monitor a position for TP/SL hits
// ────────────────────────────────────────────────────────────
router.get('/openclaw/monitor/:positionId', async (req, res) => {
  try {
    const { positionId } = req.params;
    const position = positions.find(p => p.id === positionId);

    if (!position || position.status !== 'open') {
      return res.json({ success: false, closed: true });
    }

    // Check TP1
    if (!position.tp1_hit && position.current_price >= position.tp1) {
      position.tp1_hit = true;
      console.log(`🎯 OpenClaw: TP1 hit on ${position.coin_symbol} at $${position.current_price}`);
    }

    // Check TP2
    if (!position.tp2_hit && position.current_price >= position.tp2) {
      position.tp2_hit = true;
      console.log(`🎯 OpenClaw: TP2 hit on ${position.coin_symbol} at $${position.current_price}`);
    }

    // Check SL
    if (!position.sl_hit && position.current_price <= position.sl) {
      position.sl_hit = true;
      position.status = 'closed';
      position.close_price = position.sl;
      position.pnl = (position.sl - position.entry_price) * position.position_size;
      console.log(`⛔ OpenClaw: SL hit on ${position.coin_symbol} at $${position.current_price}`);
    }

    res.json({
      success: true,
      position,
      tp1_hit: position.tp1_hit,
      tp2_hit: position.tp2_hit,
      sl_hit: position.sl_hit
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/openclaw/update-price/:positionId
// Update current price for position monitoring
// ────────────────────────────────────────────────────────────
router.post('/openclaw/update-price/:positionId', (req, res) => {
  try {
    const { positionId } = req.params;
    const { current_price } = req.body;

    const position = positions.find(p => p.id === positionId);
    if (!position) {
      return res.status(404).json({ success: false, error: 'Position not found' });
    }

    position.current_price = parseFloat(current_price);
    position.pnl = (current_price - position.entry_price) * position.position_size;
    position.pnl_percent = ((current_price - position.entry_price) / position.entry_price) * 100;

    res.json({
      success: true,
      pnl: position.pnl,
      pnl_percent: position.pnl_percent
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/openclaw/stats/:userId
// Get trading stats for a user
// ────────────────────────────────────────────────────────────
router.get('/openclaw/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userPositions = positions.filter(p => p.user_id === userId);

    const openPositions = userPositions.filter(p => p.status === 'open');
    const closedPositions = userPositions.filter(p => p.status === 'closed');

    const totalPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
    const winCount = closedPositions.filter(p => p.pnl > 0).length;
    const lossCount = closedPositions.filter(p => p.pnl < 0).length;
    const winRate = closedPositions.length > 0 ? (winCount / closedPositions.length * 100) : 0;

    res.json({
      success: true,
      stats: {
        open_positions: openPositions.length,
        closed_positions: closedPositions.length,
        total_trades: userPositions.length,
        total_pnl: totalPnL,
        win_count: winCount,
        loss_count: lossCount,
        win_rate: winRate.toFixed(2)
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

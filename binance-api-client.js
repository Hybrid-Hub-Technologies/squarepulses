/**
 * Binance API Client for Frontend
 * Handles portfolio tracking and bot trading
 */

const BINANCE_API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'
  : 'https://squarepulses-backend.onrender.com'; // Update with your backend URL

/**
 * Get user's portfolio balances
 */
async function getPortfolioBalances() {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) {
    showToast('error', '🔑', 'User ID not found. Please set API keys first.');
    return { success: false };
  }

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/balances?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Portfolio balances error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Get total portfolio value in USDT
 */
async function getPortfolioValue() {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/value?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Portfolio value error:', e);
    return { success: false };
  }
}

/**
 * Get price for a symbol
 */
async function getSymbolPrice(symbol) {
  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/price/${symbol}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Price fetch error:', e);
    return { success: false };
  }
}

/**
 * Get kline data for charting
 */
async function getChartData(symbol, interval = '1d', limit = 100) {
  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/klines/${symbol}?interval=${interval}&limit=${limit}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Chart data error:', e);
    return { success: false };
  }
}

/**
 * Get trade history for a symbol
 */
async function getTradeHistory(symbol, limit = 50) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/trades/${symbol}?userId=${userId}&limit=${limit}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Trade history error:', e);
    return { success: false };
  }
}

/**
 * Save portfolio snapshot
 */
async function savePortfolioSnapshot(balances, totalValue) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        total_value: totalValue,
        assets: balances
      })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Snapshot save error:', e);
    return { success: false };
  }
}

/**
 * Get portfolio history
 */
async function getPortfolioHistory(days = 30) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/portfolio/history?userId=${userId}&days=${days}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Portfolio history error:', e);
    return { success: false };
  }
}

// ════════════════════════════════════════════════════════════
// BOT TRADING FUNCTIONS
// ════════════════════════════════════════════════════════════

/**
 * Get all bot strategies
 */
async function getBotStrategies() {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/strategies?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Bot strategies error:', e);
    return { success: false };
  }
}

/**
 * Create a new bot strategy
 */
async function createBotStrategy(name, type, symbol, entryPrice, targetPrice, stopLoss, quantity) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        name,
        type,
        symbol,
        entry_price: entryPrice,
        target_price: targetPrice,
        stop_loss: stopLoss,
        quantity,
        enabled: true
      })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Create strategy error:', e);
    return { success: false };
  }
}

/**
 * Execute a bot trade
 */
async function executeBotTrade(symbol, side, quantity, strategyId = null) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        strategy_id: strategyId,
        symbol,
        side: side.toUpperCase(), // BUY or SELL
        type: 'MARKET',
        quantity
      })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Execute trade error:', e);
    return { success: false };
  }
}

/**
 * Close a bot position
 */
async function closeBotPosition(tradeId, symbol, quantity) {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/close-position`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        trade_id: tradeId,
        symbol,
        quantity
      })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Close position error:', e);
    return { success: false };
  }
}

/**
 * Get bot trades
 */
async function getBotTrades() {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/trades?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Bot trades error:', e);
    return { success: false };
  }
}

/**
 * Get bot trading stats
 */
async function getBotStats() {
  const userId = localStorage.getItem('sq_user_id');
  if (!userId) return { success: false };

  try {
    const res = await fetch(`${BINANCE_API_URL}/api/bot/stats?userId=${userId}`);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Bot stats error:', e);
    return { success: false };
  }
}

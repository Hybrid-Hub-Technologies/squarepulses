/**
 * ============================================================
 * Trading Routes - Binance Integration
 * ============================================================
 * 
 * Handles:
 * - API key management
 * - Portfolio tracking
 * - Trade execution
 * - Trade management (TP/SL)
 * - Trade history
 */

const express = require('express');
const router = express.Router();
const APIKeyManager = require('../utils/apiKeyManager');
const BinanceSpotAPI = require('../utils/binanceSpotApi');
const TradingBot = require('../utils/tradingBot');

// Global cache for initialized APIs
const apiCache = {};
const botCache = {};

/**
 * Get or initialize Binance API for account
 */
function getBinanceAPI(accountName = 'default') {
  if (apiCache[accountName]) {
    return apiCache[accountName];
  }

  const creds = APIKeyManager.loadCredentials(accountName);
  if (!creds.success) {
    return null;
  }

  const api = new BinanceSpotAPI(
    creds.data.apiKey,
    creds.data.apiSecret,
    creds.data.environment === 'testnet'
  );

  apiCache[accountName] = api;
  return api;
}

/**
 * Get or initialize Trading Bot
 */
function getTradingBot(accountName = 'default') {
  if (botCache[accountName]) {
    return botCache[accountName];
  }

  const api = getBinanceAPI(accountName);
  if (!api) return null;

  const bot = new TradingBot(api);
  botCache[accountName] = bot;
  return bot;
}

// ══════════════════════════════════════════════════════════════════════════
// API KEY MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/trading/keys/add
 * Save new Binance API credentials
 */
router.post('/keys/add', (req, res) => {
  try {
    const { accountName, apiKey, apiSecret, environment = 'mainnet' } = req.body;

    if (!accountName || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountName, apiKey, apiSecret',
      });
    }

    const result = APIKeyManager.saveCredentials(
      accountName,
      apiKey,
      apiSecret,
      environment
    );

    // Clear cache for this account
    delete apiCache[accountName];
    delete botCache[accountName];

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/keys/list
 * List all saved API accounts
 */
router.get('/keys/list', (req, res) => {
  try {
    const result = APIKeyManager.listAccounts();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/trading/keys/:accountName
 * Delete API credentials
 */
router.delete('/keys/:accountName', (req, res) => {
  try {
    const { accountName } = req.params;

    const result = APIKeyManager.deleteCredentials(accountName);

    // Clear cache
    delete apiCache[accountName];
    delete botCache[accountName];

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ACCOUNT & PORTFOLIO
// ══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/trading/account
 * Get account information
 */
router.get('/account', async (req, res) => {
  try {
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found. Add credentials first.`,
      });
    }

    const result = await api.getAccount();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/portfolio
 * Get portfolio with USDT valuation
 */
router.get('/portfolio', async (req, res) => {
  try {
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found. Add credentials first.`,
      });
    }

    const result = await api.getPortfolioValue();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/balance/:asset
 * Get specific asset balance
 */
router.get('/balance/:asset', async (req, res) => {
  try {
    const { asset } = req.params;
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.getBalance(asset);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// MARKET DATA
// ══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/trading/price/:symbol
 * Get current price
 */
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.getPrice(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/marketdata/:symbol
 * Get market data (24hr stats)
 */
router.get('/marketdata/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.getMarketData(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TRADING OPERATIONS
// ══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/trading/order
 * Place a new order (requires CONFIRM in body)
 */
router.post('/order', async (req, res) => {
  try {
    const {
      symbol,
      side,
      quantity,
      price,
      type = 'LIMIT',
      account = 'default',
      confirm = false,
    } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Transaction not confirmed. Include confirm: true to proceed.', // But actually need proper confirmation
      });
    }

    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: symbol, side, quantity',
      });
    }

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.placeOrder({
      symbol,
      side,
      type,
      quantity,
      price,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/trading/market-order
 * Place market order
 */
router.post('/market-order', async (req, res) => {
  try {
    const { symbol, side, quantity, account = 'default', confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Transaction not confirmed',
      });
    }

    if (!symbol || !side || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing: symbol, side, quantity',
      });
    }

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.placeMarketOrder(symbol, side, quantity);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/trading/order
 * Cancel order
 */
router.delete('/order', async (req, res) => {
  try {
    const { symbol, orderId, account = 'default' } = req.body;

    if (!symbol || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing: symbol, orderId',
      });
    }

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.cancelOrder(symbol, orderId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/openorders/:symbol
 * Get open orders for symbol
 */
router.get('/openorders/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { account = 'default' } = req.query;

    const api = getBinanceAPI(account);
    if (!api) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await api.getOpenOrders(symbol);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// TRADING BOT - AUTONOMOUS TRADING
// ══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/trading/bot/open-trade
 * Open a new automated trade with TP/SL
 */
router.post('/bot/open-trade', async (req, res) => {
  try {
    const {
      symbol,
      side,
      quantity,
      targetProfit = 5,
      stopLoss,
      takeProfit,
      account = 'default',
      confirm = false,
    } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Trade not confirmed',
      });
    }

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await bot.openTrade({
      symbol,
      side,
      quantity,
      targetProfit,
      stopLoss,
      takeProfit,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/trading/bot/close-trade
 * Close a trade
 */
router.post('/bot/close-trade', async (req, res) => {
  try {
    const { tradeId, closePrice, account = 'default', confirm = false } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        error: 'Trade close not confirmed',
      });
    }

    if (!tradeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing: tradeId',
      });
    }

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = await bot.closeTrade(tradeId, closePrice);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/bot/trades
 * Get active and closed trades
 */
router.get('/bot/trades', (req, res) => {
  try {
    const { account = 'default', status = 'all' } = req.query;

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    let trades = [];

    if (status === 'active' || status === 'all') {
      trades = [...trades, ...bot.getActiveTrades()];
    }

    if (status === 'closed' || status === 'all') {
      trades = [...trades, ...bot.getClosedTrades()];
    }

    res.json({
      success: true,
      data: trades,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/trading/bot/stats
 * Get trading statistics
 */
router.get('/bot/stats', (req, res) => {
  try {
    const { account = 'default' } = req.query;

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const stats = bot.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/trading/bot/trade/:tradeId
 * Update trade TP/SL
 */
router.put('/bot/trade/:tradeId', (req, res) => {
  try {
    const { tradeId } = req.params;
    const { takeProfit, stopLoss, targetProfit, account = 'default' } = req.body;

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const result = bot.updateTrade(tradeId, {
      takeProfit,
      stopLoss,
      targetProfit,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/trading/bot/check-trades
 * Check and close trades that hit TP/SL
 */
router.post('/bot/check-trades', async (req, res) => {
  try {
    const { account = 'default' } = req.body;

    const bot = getTradingBot(account);
    if (!bot) {
      return res.status(400).json({
        success: false,
        error: `Account "${account}" not found`,
      });
    }

    const closedTrades = await bot.checkAndCloseTrades();

    res.json({
      success: true,
      data: {
        closedTrades,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

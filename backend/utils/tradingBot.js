/**
 * ============================================================
 * Automated Trading Bot
 * ============================================================
 * 
 * Manages:
 * - Active trades
 * - Take Profit (TP) levels
 * - Stop Loss (SL) levels
 * - Autonomous trade closing
 * - Trade history and PnL
 */

const fs = require('fs');
const path = require('path');

const TRADES_DB = path.join(__dirname, '../trades.json');

class TradingBot {
  constructor(binanceAPI) {
    this.binanceAPI = binanceAPI;
    this.activeTrades = this._loadTrades();
  }

  /**
   * Load trades from file
   */
  _loadTrades() {
    try {
      if (fs.existsSync(TRADES_DB)) {
        return JSON.parse(fs.readFileSync(TRADES_DB, 'utf8'));
      }
    } catch (error) {
      console.error('⚠️ Error loading trades:', error.message);
    }
    return {};
  }

  /**
   * Save trades to file
   */
  _saveTrades() {
    try {
      fs.writeFileSync(TRADES_DB, JSON.stringify(this.activeTrades, null, 2));
    } catch (error) {
      console.error('⚠️ Error saving trades:', error.message);
    }
  }

  /**
   * Create a new trade
   */
  async openTrade(tradeParams) {
    const {
      symbol,
      side, // BUY or SELL
      quantity,
      entryPrice,
      targetProfit = 5, // Default $5 profit
      stopLoss = undefined, // Optional stop loss in $
      takeProfit = undefined, // Optional TP level in $
    } = tradeParams;

    try {
      // Place market order
      const orderResult = await this.binanceAPI.placeMarketOrder(symbol, side, quantity);

      if (!orderResult.success) {
        return {
          success: false,
          error: orderResult.error,
        };
      }

      const orderId = orderResult.data.orderId;
      const tradeId = `${symbol}-${Date.now()}`;

      // Calculate TP and SL if not provided
      const actualEntryPrice = parseFloat(orderResult.data.executedQty) > 0
        ? parseFloat(orderResult.data.cummulativeQuoteAssetTransacted) /
          parseFloat(orderResult.data.executedQty)
        : entryPrice || parseFloat(orderResult.data.price);

      let tpLevel = takeProfit;
      let slLevel = stopLoss;

      if (!tpLevel && targetProfit) {
        // Calculate TP based on target profit
        const profitPerUnit = targetProfit / quantity;
        tpLevel = side === 'BUY'
          ? actualEntryPrice + profitPerUnit
          : actualEntryPrice - profitPerUnit;
      }

      if (!slLevel && stopLoss !== undefined) {
        // SL in percentage or fixed amount
        const slPerUnit = stopLoss / quantity;
        slLevel = side === 'BUY'
          ? actualEntryPrice - slPerUnit
          : actualEntryPrice + slPerUnit;
      }

      const trade = {
        tradeId,
        symbol,
        side,
        quantity: parseFloat(quantity),
        entryPrice: actualEntryPrice,
        entryTime: new Date().toISOString(),
        orderId,
        status: 'OPEN',
        targetProfit,
        takeProfit: tpLevel,
        stopLoss: slLevel,
        closePrice: null,
        closeTime: null,
        pnl: null,
        pnlPercent: null,
      };

      this.activeTrades[tradeId] = trade;
      this._saveTrades();

      return {
        success: true,
        trade,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Close a trade manually
   */
  async closeTrade(tradeId, closePrice = null) {
    try {
      const trade = this.activeTrades[tradeId];

      if (!trade) {
        return {
          success: false,
          error: `Trade ${tradeId} not found`,
        };
      }

      if (trade.status === 'CLOSED') {
        return {
          success: false,
          error: `Trade ${tradeId} already closed`,
        };
      }

      // Get current price if not provided
      let exitPrice = closePrice;
      if (!exitPrice) {
        const priceResult = await this.binanceAPI.getPrice(trade.symbol);
        if (!priceResult.success) {
          return {
            success: false,
            error: `Could not get current price: ${priceResult.error}`,
          };
        }
        exitPrice = parseFloat(priceResult.data.price);
      }

      // Calculate PnL
      const pnl = trade.side === 'BUY'
        ? (exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - exitPrice) * trade.quantity;

      const pnlPercent = ((pnl / (trade.entryPrice * trade.quantity)) * 100);

      // Place closing trade
      const closingOrder = await this.binanceAPI.placeMarketOrder(
        trade.symbol,
        trade.side === 'BUY' ? 'SELL' : 'BUY',
        trade.quantity
      );

      if (!closingOrder.success) {
        return {
          success: false,
          error: `Failed to close trade: ${closingOrder.error}`,
        };
      }

      // Update trade
      trade.status = 'CLOSED';
      trade.closePrice = exitPrice;
      trade.closeTime = new Date().toISOString();
      trade.pnl = parseFloat(pnl.toFixed(2));
      trade.pnlPercent = parseFloat(pnlPercent.toFixed(2));
      trade.closingOrderId = closingOrder.data.orderId;

      this._saveTrades();

      return {
        success: true,
        trade,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check and close trades that hit TP or SL
   */
  async checkAndCloseTrades() {
    const closedTrades = [];

    for (const [tradeId, trade] of Object.entries(this.activeTrades)) {
      if (trade.status !== 'OPEN') continue;

      try {
        const priceResult = await this.binanceAPI.getPrice(trade.symbol);
        if (!priceResult.success) continue;

        const currentPrice = parseFloat(priceResult.data.price);

        let shouldClose = false;
        let closeReason = null;

        // Check Take Profit
        if (trade.takeProfit) {
          if (trade.side === 'BUY' && currentPrice >= trade.takeProfit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
          } else if (trade.side === 'SELL' && currentPrice <= trade.takeProfit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
          }
        }

        // Check Stop Loss
        if (!shouldClose && trade.stopLoss) {
          if (trade.side === 'BUY' && currentPrice <= trade.stopLoss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
          } else if (trade.side === 'SELL' && currentPrice >= trade.stopLoss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
          }
        }

        // Check profit target in dollars
        if (!shouldClose && trade.targetProfit) {
          const pnl = trade.side === 'BUY'
            ? (currentPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - currentPrice) * trade.quantity;

          if (pnl >= trade.targetProfit) {
            shouldClose = true;
            closeReason = 'PROFIT_TARGET';
          }
        }

        if (shouldClose) {
          const closeResult = await this.closeTrade(tradeId, currentPrice);
          if (closeResult.success) {
            closedTrades.push({
              ...closeResult.trade,
              closeReason,
            });
          }
        }
      } catch (error) {
        console.error(`⚠️ Error checking trade ${tradeId}:`, error.message);
      }
    }

    return closedTrades;
  }

  /**
   * Get active trades
   */
  getActiveTrades() {
    return Object.values(this.activeTrades).filter(t => t.status === 'OPEN');
  }

  /**
   * Get closed trades
   */
  getClosedTrades(limit = 100) {
    return Object.values(this.activeTrades)
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime))
      .slice(0, limit);
  }

  /**
   * Get trade statistics
   */
  getStats() {
    const allTrades = Object.values(this.activeTrades);
    const closedTrades = allTrades.filter(t => t.status === 'CLOSED');

    if (closedTrades.length === 0) {
      return {
        totalTrades: allTrades.length,
        activeTrades: this.getActiveTrades().length,
        closedTrades: closedTrades.length,
        totalPnL: 0,
        avgPnL: 0,
        winRate: 0,
        winCount: 0,
        lossCount: 0,
      };
    }

    const pnlArray = closedTrades.map(t => t.pnl);
    const totalPnL = pnlArray.reduce((a, b) => a + b, 0);
    const wins = closedTrades.filter(t => t.pnl > 0).length;
    const losses = closedTrades.filter(t => t.pnl < 0).length;

    return {
      totalTrades: allTrades.length,
      activeTrades: this.getActiveTrades().length,
      closedTrades: closedTrades.length,
      totalPnL: parseFloat(totalPnL.toFixed(2)),
      avgPnL: parseFloat((totalPnL / closedTrades.length).toFixed(2)),
      winRate: parseFloat(((wins / closedTrades.length) * 100).toFixed(2)),
      winCount: wins,
      lossCount: losses,
      bestTrade: closedTrades.reduce((a, b) => a.pnl > b.pnl ? a : b),
      worstTrade: closedTrades.reduce((a, b) => a.pnl < b.pnl ? a : b),
    };
  }

  /**
   * Get trade details
   */
  getTrade(tradeId) {
    return this.activeTrades[tradeId] || null;
  }

  /**
   * Update trade TP/SL
   */
  updateTrade(tradeId, updates) {
    const trade = this.activeTrades[tradeId];
    if (!trade) {
      return { success: false, error: 'Trade not found' };
    }

    if (trade.status === 'CLOSED') {
      return { success: false, error: 'Cannot update closed trade' };
    }

    const { takeProfit, stopLoss, targetProfit } = updates;

    if (takeProfit !== undefined) trade.takeProfit = takeProfit;
    if (stopLoss !== undefined) trade.stopLoss = stopLoss;
    if (targetProfit !== undefined) trade.targetProfit = targetProfit;

    this._saveTrades();

    return {
      success: true,
      trade,
    };
  }
}

module.exports = TradingBot;

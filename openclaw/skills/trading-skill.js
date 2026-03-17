/**
 * ============================================================
 * SquarePulse Trading Skill for OpenClaw
 * ============================================================
 * 
 * AI Assistant can now:
 * - Execute trades via natural language
 * - Manage portfolio
 * - Set take profit/stop loss
 * - Monitor positions
 * - Get market analysis
 */

const axios = require('axios');
const BinanceSpotAPI = require('../utils/binanceSpotApi');
const TradingBot = require('../utils/tradingBot');
const APIKeyManager = require('../utils/apiKeyManager');

class TradingSkill {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000/api/trading';
    this.binanceAPI = null;
    this.tradingBot = null;
    this.account = config.account || 'default';
  }

  /**
   * Initialize trading tools
   */
  _initTrading() {
    if (!this.binanceAPI) {
      const creds = APIKeyManager.loadCredentials(this.account);
      if (creds.success) {
        this.binanceAPI = new BinanceSpotAPI(
          creds.data.apiKey,
          creds.data.apiSecret,
          creds.data.environment === 'testnet'
        );
        this.tradingBot = new TradingBot(this.binanceAPI);
      }
    }
    return this.binanceAPI !== null;
  }

  /**
   * Parse trading commands from natural language
   */
  async parseCommand(input) {
    const lowerInput = input.toLowerCase();

    // BUY commands: "buy 1 BTC", "buy $100 of ETH", "long BTC"
    const buyMatch = input.match(/\b(buy|long)\s+(\$)?(\d+(?:\.\d+)?)\s+(?:of\s+)?([A-Z]{2,10})/i);
    if (buyMatch) {
      const amount = parseFloat(buyMatch[3]);
      const asset = buyMatch[4].toUpperCase();
      const isUSD = buyMatch[2] === '$';

      return {
        type: 'BUY',
        asset,
        amount,
        isUSD,
        raw: input,
      };
    }

    // SELL commands: "sell 1 BTC", "sell $200 worth of ETH", "short SOL"
    const sellMatch = input.match(/\b(sell|short)\s+(\$)?(\d+(?:\.\d+)?)\s+(?:of\s+)?([A-Z]{2,10})/i);
    if (sellMatch) {
      const amount = parseFloat(sellMatch[3]);
      const asset = sellMatch[4].toUpperCase();
      const isUSD = sellMatch[2] === '$';

      return {
        type: 'SELL',
        asset,
        amount,
        isUSD,
        raw: input,
      };
    }

    // TP commands: "take profit at 50000", "tp $200"
    const tpMatch = input.match(/\b(take\s+profit|tp)\s+(?:at\s+)?(\$)?(\d+(?:\.\d+)?)/i);
    if (tpMatch) {
      return {
        type: 'SET_TP',
        target: parseFloat(tpMatch[3]),
        isUSD: tpMatch[2] === '$',
        raw: input,
      };
    }

    // SL commands: "stop loss at 40000", "sl $100"
    const slMatch = input.match(/\b(stop\s+loss|sl)\s+(?:at\s+)?(\$)?(\d+(?:\.\d+)?)/i);
    if (slMatch) {
      return {
        type: 'SET_SL',
        target: parseFloat(slMatch[3]),
        isUSD: slMatch[2] === '$',
        raw: input,
      };
    }

    // CLOSE commands: "close position", "close trade"
    if (lowerInput.includes('close') && (lowerInput.includes('position') || lowerInput.includes('trade'))) {
      return {
        type: 'CLOSE_TRADE',
        raw: input,
      };
    }

    // PORTFOLIO commands: "show portfolio", "what's my balance"
    if (lowerInput.includes('portfolio') || lowerInput.includes('balance') || lowerInput.includes('holdings')) {
      return {
        type: 'PORTFOLIO',
        raw: input,
      };
    }

    // PRICE commands: "what's the price of BTC", "BTC price"
    const priceMatch = input.match(/\b(?:price|price\sof)?\s*([A-Z]{2,10})\b/i);
    if (lowerInput.includes('price') && priceMatch) {
      return {
        type: 'PRICE',
        symbol: priceMatch[1].toUpperCase() + 'USDT',
        raw: input,
      };
    }

    // TRADES commands: "show trades", "active trades"
    if (lowerInput.includes('trade') && (lowerInput.includes('show') || lowerInput.includes('active') || lowerInput.includes('list'))) {
      return {
        type: 'LIST_TRADES',
        raw: input,
      };
    }

    // STATS commands: "trading stats", "performance"
    if (lowerInput.includes('stat') || lowerInput.includes('performance') || lowerInput.includes('pnl')) {
      return {
        type: 'STATS',
        raw: input,
      };
    }

    return {
      type: 'UNKNOWN',
      raw: input,
    };
  }

  /**
   * Execute parsed command
   */
  async executeCommand(command) {
    try {
      switch (command.type) {
        case 'BUY':
          return await this.executeBuyOrder(command);
        case 'SELL':
          return await this.executeSellOrder(command);
        case 'PORTFOLIO':
          return await this.getPortfolio();
        case 'PRICE':
          return await this.getPrice(command.symbol);
        case 'LIST_TRADES':
          return await this.listActiveTrades();
        case 'STATS':
          return await this.getStats();
        case 'CLOSE_TRADE':
          return await this.closeTrade();
        default:
          return {
            success: false,
            message: 'I did not understand the command. Try: Buy 1 BTC, Sell 0.5 ETH, Show portfolio, etc.',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute a buy order
   */
  async executeBuyOrder(command) {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured. Add API keys first.',
      };
    }

    const { asset, amount, isUSD } = command;
    const symbol = asset + 'USDT';

    try {
      // Get current price
      const priceResult = await this.binanceAPI.getPrice(symbol);
      if (!priceResult.success) {
        return {
          success: false,
          message: `Cannot fetch price for ${asset}`,
        };
      }

      const price = parseFloat(priceResult.data.price);
      const quantity = isUSD ? (amount / price) : amount;

      // Open trade with default $5 profit target
      const tradeResult = await this.tradingBot.openTrade({
        symbol,
        side: 'BUY',
        quantity: parseFloat(quantity.toFixed(8)),
        targetProfit: 5,
      });

      if (tradeResult.success) {
        const trade = tradeResult.trade;
        return {
          success: true,
          message: `✅ BUY ORDER EXECUTED
            
📊 Trade Details:
  • Symbol: ${trade.symbol}
  • Side: BUY
  • Quantity: ${trade.quantity}
  • Entry Price: $${trade.entryPrice.toFixed(2)}
  • Target Profit: $${trade.targetProfit}
  • Trade ID: ${trade.tradeId}

🎯 This trade will auto-close when:
  • Profit reaches $${trade.targetProfit}
  • Use "take profit at $X" to adjust target`,
          data: trade,
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to execute trade: ${tradeResult.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Execute a sell order
   */
  async executeSellOrder(command) {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    const { asset, amount, isUSD } = command;
    const symbol = asset + 'USDT';

    try {
      const priceResult = await this.binanceAPI.getPrice(symbol);
      if (!priceResult.success) {
        return {
          success: false,
          message: `Cannot fetch price for ${asset}`,
        };
      }

      const price = parseFloat(priceResult.data.price);
      const quantity = isUSD ? (amount / price) : amount;

      const tradeResult = await this.tradingBot.openTrade({
        symbol,
        side: 'SELL',
        quantity: parseFloat(quantity.toFixed(8)),
        targetProfit: 5,
      });

      if (tradeResult.success) {
        const trade = tradeResult.trade;
        return {
          success: true,
          message: `✅ SELL ORDER EXECUTED
            
📊 Trade Details:
  • Symbol: ${trade.symbol}
  • Side: SELL (Short)
  • Quantity: ${trade.quantity}
  • Entry Price: $${trade.entryPrice.toFixed(2)}
  • Target Profit: $${trade.targetProfit}
  • Trade ID: ${trade.tradeId}`,
          data: trade,
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to execute trade: ${tradeResult.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Get portfolio
   */
  async getPortfolio() {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    try {
      const result = await this.binanceAPI.getPortfolioValue();

      if (result.success) {
        const { totalValue, assets } = result.data;

        let message = `💼 YOUR PORTFOLIO

Total Value: $${totalValue.toFixed(2)} USDT

Assets:
`;
        for (const asset of assets.slice(0, 10)) {
          message += `  • ${asset.asset}: ${asset.quantity.toFixed(8)} ($${asset.usdtValue.toFixed(2)})
`;
        }

        return {
          success: true,
          message,
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: `Error: ${result.error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * Get price for symbol
   */
  async getPrice(symbol) {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    try {
      const priceResult = await this.binanceAPI.getPrice(symbol);

      if (priceResult.success) {
        const price = parseFloat(priceResult.data.price);
        const displaySymbol = symbol.replace('USDT', '');

        return {
          success: true,
          message: `💰 ${displaySymbol} Price: $${price.toFixed(2)} USDT`,
          data: priceResult.data,
        };
      } else {
        return {
          success: false,
          message: `Cannot get price for ${symbol}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error.message}`,
      };
    }
  }

  /**
   * List active trades
   */
  async listActiveTrades() {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    const trades = this.tradingBot.getActiveTrades();

    if (trades.length === 0) {
      return {
        success: true,
        message: '📭 No active trades',
        data: [],
      };
    }

    let message = `📈 ACTIVE TRADES (${trades.length})\n\n`;

    for (const trade of trades) {
      const profit = this.binanceAPI.getPrice(trade.symbol)
        .then(p => {
          const curr = parseFloat(p.data.price);
          return trade.side === 'BUY'
            ? (curr - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - curr) * trade.quantity;
        });

      message += `  🔹 ${trade.symbol}
    Side: ${trade.side}
    Entry: $${trade.entryPrice.toFixed(2)}
    Qty: ${trade.quantity}
    Target Profit: $${trade.targetProfit}
    Trade ID: ${trade.tradeId}\n`;
    }

    return {
      success: true,
      message,
      data: trades,
    };
  }

  /**
   * Get trading statistics
   */
  async getStats() {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    const stats = this.tradingBot.getStats();

    const message = `📊 TRADING STATISTICS

Total Trades: ${stats.totalTrades}
Active: ${stats.activeTrades}
Closed: ${stats.closedTrades}

Total PnL: $${stats.totalPnL.toFixed(2)}
Average PnL: $${stats.avgPnL.toFixed(2)}
Win Rate: ${stats.winRate.toFixed(1)}%
Wins: ${stats.winCount} | Losses: ${stats.lossCount}`;

    return {
      success: true,
      message,
      data: stats,
    };
  }

  /**
   * Close the most recent trade
   */
  async closeTrade() {
    if (!this._initTrading()) {
      return {
        success: false,
        message: '❌ Trading not configured.',
      };
    }

    const trades = this.tradingBot.getActiveTrades();

    if (trades.length === 0) {
      return {
        success: false,
        message: '❌ No active trades to close',
      };
    }

    const latestTrade = trades[trades.length - 1];
    const result = await this.tradingBot.closeTrade(latestTrade.tradeId);

    if (result.success) {
      const trade = result.trade;
      return {
        success: true,
        message: `✅ TRADE CLOSED

📊 Results:
  • Symbol: ${trade.symbol}
  • Entry: $${trade.entryPrice.toFixed(2)}
  • Exit: $${trade.closePrice.toFixed(2)}
  • Quantity: ${trade.quantity}
  • PnL: $${trade.pnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)`,
        data: trade,
      };
    } else {
      return {
        success: false,
        message: `Error: ${result.error}`,
      };
    }
  }
}

module.exports = TradingSkill;

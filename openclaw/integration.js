/**
 * ============================================================
 * OpenClaw Integration Layer
 * ============================================================
 * 
 * Main entry point for OpenClaw to interact with SquarePulse
 * Initializes all skills and provides unified API
 */

const TradingPositionManager = require('./skills/trading-position-manager');
const PriceMonitor = require('./skills/price-monitor');
const MarketAlerts = require('./skills/market-alerts');
const SignalsAndAnalysis = require('./skills/signals-and-analysis');

class SquarePulseOpenClawIntegration {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:5000/api',
      userId: config.userId || 'openclaw-agent',
      timeout: config.timeout || 5000,
      ...config
    };

    // Initialize all skills
    this.trading = new TradingPositionManager(this.config);
    this.prices = new PriceMonitor(this.config);
    this.alerts = new MarketAlerts(this.config);
    this.signals = new SignalsAndAnalysis(this.config);

    this.skills = {
      'trading': this.trading,
      'prices': this.prices,
      'alerts': this.alerts,
      'signals': this.signals
    };
  }

  /**
   * Process a natural language command
   * @param {string} command
   * @returns {Promise<Object>}
   */
  async processCommand(command) {
    try {
      const cmd = command.toLowerCase().trim();

      // Trading commands
      if (cmd.includes('open position') || cmd.includes('long') || cmd.includes('short')) {
        return { 
          skill: 'trading',
          action: 'openPosition',
          message: 'Use openPosition skill with parameters: coin_symbol, entry_price, tp1, tp2, sl, position_size, leverage'
        };
      }

      if (cmd.includes('close position')) {
        return {
          skill: 'trading',
          action: 'closePosition',
          message: 'Use closePosition skill with parameters: position_id, close_price'
        };
      }

      if (cmd.includes('my positions') || cmd.includes('open trades')) {
        return await this.trading.getOpenPositions();
      }

      if (cmd.includes('position status') || cmd.includes('trade status')) {
        return {
          skill: 'trading',
          action: 'getPositionStatus',
          message: 'Use getPositionStatus skill with position_id'
        };
      }

      // Price commands
      if (cmd.includes('price of') || cmd.includes('current price')) {
        const match = cmd.match(/price of (\w+)|(\w+) price/i);
        if (match) {
          const symbol = match[1] || match[2];
          return await this.prices.getCurrentPrice(symbol);
        }
      }

      if (cmd.includes('check targets') || cmd.includes('near tp') || cmd.includes('near sl')) {
        return {
          skill: 'prices',
          action: 'checkTargets',
          message: 'Use checkTargets skill with parameters: symbol, tp, sl'
        };
      }

      // Alert commands
      if (cmd.includes('alert') && cmd.includes('price')) {
        return {
          skill: 'alerts',
          action: 'setPriceAlert',
          message: 'Use setPriceAlert skill with parameters: symbol, target_price, condition (above/below)'
        };
      }

      if (cmd.includes('news') || cmd.includes('trending')) {
        const match = cmd.match(/news about (\w+)|(\w+) news/i);
        if (match) {
          const symbol = match[1] || match[2];
          return await this.alerts.getMarketNews(symbol);
        } else if (cmd.includes('crypto news') || cmd.includes('latest news')) {
          return await this.signals.getCryptoNews(10);
        }
      }

      // Signals & Analysis commands
      if (cmd.includes('search') && cmd.includes('token')) {
        const match = cmd.match(/search.*?(\w+)|(\w+).*?token/i);
        if (match) {
          const keyword = match[1] || match[2];
          return await this.signals.searchTokens(keyword);
        }
      }

      if (cmd.includes('whale') || cmd.includes('whales')) {
        return await this.signals.getWhaleMovements();
      }

      if (cmd.includes('forex') || cmd.includes('economy') || cmd.includes('events')) {
        return await this.signals.getForexEvents();
      }

      if (cmd.includes('analyze market') || cmd.includes('market analysis')) {
        return await this.signals.analyzeMarket();
      }

      if (cmd.includes('trading signal') || cmd.includes('get signals')) {
        return await this.signals.getTradingSignals();
      }

      if (cmd.includes('generate post') || cmd.includes('create post')) {
        return {
          skill: 'signals',
          action: 'generateTradingPost',
          message: 'Use generateTradingPost with parameters: coin, entry, tp1, tp2, signal'
        };
      }

      // Default response
      return {
        success: false,
        message: 'Command not recognized. Available: open position, close position, my positions, price of [symbol], search tokens, whale movements, forex events, market analysis, crypto news, trading signals, generate post',
        availableSkills: Object.keys(this.skills)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Error processing command: ${error.message}`
      };
    }
  }

  /**
   * Get status of the integration
   * @returns {Object}
   */
  getStatus() {
    return {
      integration: 'SquarePulse-OpenClaw',
      status: 'active',
      version: '1.0.1',
      baseUrl: this.config.baseUrl,
      userId: this.config.userId,
      skills: {
        trading: {
          name: 'Trading Position Manager',
          methods: ['openPosition', 'getOpenPositions', 'closePosition', 'getPositionStatus', 'getTradingStats', 'modifyPosition']
        },
        prices: {
          name: 'Price Monitor',
          methods: ['getCurrentPrice', 'getPrices', 'checkTargets', 'getMarketAnalysis']
        },
        alerts: {
          name: 'Market Alerts',
          methods: ['setPriceAlert', 'getActiveAlerts', 'cancelAlert', 'getMarketNews', 'checkVolatility']
        },
        signals: {
          name: 'Signals & Market Analysis',
          methods: ['searchTokens', 'getCryptoNews', 'getWhaleMovements', 'getForexEvents', 'generateTradingPost', 'analyzeMarket', 'getTradingSignals']
        }
      },
      endpoints: {
        health: '/api/health',
        positions: '/api/openclaw/positions/:userId',
        trades: '/api/posts',
        alerts: '/api/posts/alerts/pending'
      }
    };
  }

  /**
   * Get help documentation
   * @returns {Object}
   */
  getHelp() {
    return {
      title: 'SquarePulse OpenClaw Integration - Help Guide',
      introduction: 'OpenClaw is now integrated with SquarePulse trading system. Use these commands to manage your trades.',
      
      tradingCommands: {
        'open position': {
          description: 'Open a new trading position',
          params: ['coin_symbol', 'entry_price', 'tp1', 'tp2', 'sl', 'position_size', 'leverage'],
          example: 'open BTC position at 50000 with TP1 52000, TP2 54000, SL 48000'
        },
        'close position': {
          description: 'Close an existing position',
          params: ['position_id', 'close_price'],
          example: 'close POS-1234567890 at 51500'
        },
        'show my positions': {
          description: 'List all open positions',
          params: [],
          example: 'show my open positions'
        },
        'position status': {
          description: 'Get details of a specific position',
          params: ['position_id'],
          example: 'what is the status of POS-1234567890'
        }
      },

      priceCommands: {
        'price of [symbol]': {
          description: 'Get current price of a cryptocurrency',
          params: ['symbol'],
          example: 'what is the price of BTC'
        },
        'check targets': {
          description: 'Check if current price is near TP or SL',
          params: ['symbol', 'tp', 'sl'],
          example: 'is BTC near my targets? TP 52000, SL 48000'
        },
        'market analysis': {
          description: 'Get market analysis for a coin',
          params: ['symbol'],
          example: 'give me market analysis for ETH'
        }
      },

      alertCommands: {
        'set price alert': {
          description: 'Create a price alert',
          params: ['symbol', 'target_price', 'condition'],
          example: 'alert me when BTC goes above 55000'
        },
        'show alerts': {
          description: 'List all active alerts',
          params: [],
          example: 'show my active alerts'
        },
        'market news': {
          description: 'Get trending market news',
          params: ['symbol'],
          example: 'get news about BTC'
        },
        'check volatility': {
          description: 'Check market volatility for a coin',
          params: ['symbol', 'threshold'],
          example: 'is ETH volatile today'
        }
      },

      signalsAndAnalysisCommands: {
        'search tokens': {
          description: 'Search for tokens across CEX and DEX',
          params: ['keyword'],
          example: 'search for Solana tokens'
        },
        'whale movements': {
          description: 'Get latest whale transactions and movements',
          params: [],
          example: 'show whale movements'
        },
        'forex events': {
          description: 'Get forex calendar and economic events',
          params: [],
          example: 'what forex events are coming'
        },
        'crypto news': {
          description: 'Get latest crypto news',
          params: ['limit (optional)'],
          example: 'get latest crypto news'
        },
        'market analysis': {
          description: 'Analyze overall market conditions',
          params: [],
          example: 'analyze the market'
        },
        'trading signals': {
          description: 'Get buy/sell signals based on multiple factors',
          params: [],
          example: 'get trading signals'
        },
        'generate post': {
          description: 'Generate a trading post for Binance Square',
          params: ['coin', 'entry', 'tp1', 'tp2', 'signal'],
          example: 'generate post for BTC at 50000, TP 52000'
        }
      }
    };
  }
}

module.exports = SquarePulseOpenClawIntegration;

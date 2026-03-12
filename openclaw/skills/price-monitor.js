/**
 * ============================================================
 * OpenClaw Skill: Price Monitor
 * ============================================================
 * 
 * Monitors cryptocurrency prices and alerts when targets hit
 * 
 * Usage examples:
 * - "Monitor BTC price and alert me when it hits 55000"
 * - "Get current BTC price"
 * - "Check if BTC is near my take profits"
 */

const axios = require('axios');

class PriceMonitor {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000/api';
    this.userId = config.userId || 'openclaw-agent';
    this.geckoUrl = 'https://api.coingecko.com/api/v3';
    this.timeout = config.timeout || 5000;
  }

  /**
   * Get current price of a cryptocurrency
   * @param {string} symbol - Coin symbol (BTC, ETH, etc.)
   * @returns {Promise<Object>}
   */
  async getCurrentPrice(symbol) {
    try {
      const coinId = this._mapSymbolToCoinId(symbol.toUpperCase());
      if (!coinId) throw new Error(`Unknown coin: ${symbol}`);

      const response = await axios.get(
        `${this.geckoUrl}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
            include_market_cap: true,
            include_24hr_vol: true
          },
          timeout: this.timeout
        }
      );

      const price = response.data[coinId];

      return {
        success: true,
        action: 'price_retrieved',
        symbol: symbol.toUpperCase(),
        data: {
          current_price: price.usd,
          market_cap: price.usd_market_cap,
          volume_24h: price.usd_24h_vol
        },
        message: `💰 ${symbol.toUpperCase()}: $${price.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get price: ${error.message}`
      };
    }
  }

  /**
   * Check multiple prices
   * @param {string[]} symbols - Array of coin symbols
   * @returns {Promise<Object>}
   */
  async getPrices(symbols) {
    try {
      const coinIds = symbols
        .map(s => this._mapSymbolToCoinId(s.toUpperCase()))
        .filter(Boolean);

      if (coinIds.length === 0) throw new Error('No valid coins provided');

      const response = await axios.get(
        `${this.geckoUrl}/simple/price`,
        {
          params: {
            ids: coinIds.join(','),
            vs_currencies: 'usd',
            include_24hr_change: true
          },
          timeout: this.timeout
        }
      );

      const prices = [];
      for (const [coinId, data] of Object.entries(response.data)) {
        prices.push({
          symbol: this._mapCoinIdToSymbol(coinId),
          price: data.usd,
          change_24h: data.usd_24h_change
        });
      }

      return {
        success: true,
        action: 'prices_retrieved',
        count: prices.length,
        data: prices,
        message: `📊 Retrieved ${prices.length} prices`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get prices: ${error.message}`
      };
    }
  }

  /**
   * Check if current price is near take profit or stop loss
   * @param {string} symbol - Coin symbol
   * @param {number} tp - Take profit level
   * @param {number} sl - Stop loss level
   * @returns {Promise<Object>}
   */
  async checkTargets(symbol, tp, sl) {
    try {
      const priceResult = await this.getCurrentPrice(symbol);
      if (!priceResult.success) return priceResult;

      const currentPrice = priceResult.data.current_price;
      const tpDistance = Math.abs(tp - currentPrice);
      const slDistance = Math.abs(sl - currentPrice);
      const tpPercent = ((tp - currentPrice) / currentPrice * 100).toFixed(2);
      const slPercent = ((currentPrice - sl) / currentPrice * 100).toFixed(2);

      const alerts = [];
      if (tpDistance < currentPrice * 0.02) alerts.push(`⚠️ Near TP: ${tpPercent}% away`);
      if (slDistance < currentPrice * 0.02) alerts.push(`🚨 Near SL: ${slPercent}% away`);

      return {
        success: true,
        action: 'targets_checked',
        symbol: symbol.toUpperCase(),
        data: {
          current_price: currentPrice,
          take_profit: tp,
          stop_loss: sl,
          tp_distance_percent: tpPercent,
          sl_distance_percent: slPercent,
          alerts: alerts.length > 0 ? alerts : ['✅ Safe distance from targets']
        },
        message: alerts.length > 0 ? alerts.join(' | ') : `✅ ${symbol.toUpperCase()} safe`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to check targets: ${error.message}`
      };
    }
  }

  /**
   * Get price history/resistance levels
   * @param {string} symbol
   * @returns {Promise<Object>}
   */
  async getMarketAnalysis(symbol) {
    try {
      const coinId = this._mapSymbolToCoinId(symbol.toUpperCase());
      if (!coinId) throw new Error(`Unknown coin: ${symbol}`);

      const response = await axios.get(
        `${this.geckoUrl}/coins/${coinId}`,
        {
          params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false
          },
          timeout: this.timeout
        }
      );

      const data = response.data.market_data;

      return {
        success: true,
        action: 'analysis_retrieved',
        symbol: symbol.toUpperCase(),
        data: {
          current_price: data.current_price.usd,
          all_time_high: data.ath?.usd,
          all_time_low: data.atl?.usd,
          high_24h: data.high_24h?.usd,
          low_24h: data.low_24h?.usd,
          market_cap: data.market_cap?.usd
        },
        message: `📈 Analysis for ${symbol.toUpperCase()}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to analyze: ${error.message}`
      };
    }
  }

  // ────────────────────────────────────────────────────────────
  // Helper Methods
  // ────────────────────────────────────────────────────────────

  _mapSymbolToCoinId(symbol) {
    const mapping = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar',
      'ATOM': 'cosmos',
      'AVAX': 'avalanche-2',
      'FTM': 'fantom',
      'NEAR': 'near',
      'ARB': 'arbitrum',
      'OP': 'optimism',
      'MNT': 'mantle'
    };
    return mapping[symbol] || null;
  }

  _mapCoinIdToSymbol(coinId) {
    const mapping = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'ripple': 'XRP',
      'cardano': 'ADA',
      'solana': 'SOL',
      'dogecoin': 'DOGE',
      'tether': 'USDT',
      'usd-coin': 'USDC',
      'matic-network': 'MATIC',
      'chainlink': 'LINK'
    };
    return mapping[coinId] || coinId.toUpperCase();
  }
}

module.exports = PriceMonitor;

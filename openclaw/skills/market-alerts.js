/**
 * ============================================================
 * OpenClaw Skill: Market Alerts
 * ============================================================
 * 
 * Sets up automated alerts for market conditions
 * 
 * Usage examples:
 * - "Alert me when BTC hits 55000"
 * - "Watch ETH and notify me on significant moves"
 * - "Get news about BTC"
 */

const axios = require('axios');

class MarketAlerts {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000/api';
    this.userId = config.userId || 'openclaw-agent';
    this.newsUrl = 'https://api.coingecko.com/api/v3';
    this.timeout = config.timeout || 5000;
    this.alerts = new Map();
  }

  /**
   * Set a price alert
   * @param {Object} params
   * @param {string} params.symbol - Coin symbol
   * @param {number} params.target_price - Target price
   * @param {string} params.condition - "above" or "below"
   * @returns {Promise<Object>}
   */
  async setPriceAlert(params) {
    try {
      if (!params.symbol) throw new Error('Symbol is required');
      if (!params.target_price) throw new Error('Target price is required');
      if (!params.condition) throw new Error('Condition (above/below) is required');

      const alertId = `ALERT-${Date.now()}`;
      const alert = {
        id: alertId,
        symbol: params.symbol.toUpperCase(),
        target_price: parseFloat(params.target_price),
        condition: params.condition.toLowerCase(),
        created_at: new Date(),
        status: 'active'
      };

      this.alerts.set(alertId, alert);

      return {
        success: true,
        action: 'alert_created',
        data: alert,
        message: `📢 Alert set: Notify when ${alert.symbol} goes ${alert.condition} $${alert.target_price}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to set alert: ${error.message}`
      };
    }
  }

  /**
   * Get all active alerts
   * @returns {Promise<Object>}
   */
  async getActiveAlerts() {
    try {
      const alerts = Array.from(this.alerts.values()).filter(a => a.status === 'active');

      return {
        success: true,
        action: 'alerts_retrieved',
        count: alerts.length,
        data: alerts,
        message: `📊 You have ${alerts.length} active alert(s)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get alerts: ${error.message}`
      };
    }
  }

  /**
   * Cancel an alert
   * @param {string} alertId
   * @returns {Promise<Object>}
   */
  async cancelAlert(alertId) {
    try {
      if (!this.alerts.has(alertId)) {
        throw new Error(`Alert ${alertId} not found`);
      }

      const alert = this.alerts.get(alertId);
      alert.status = 'cancelled';

      return {
        success: true,
        action: 'alert_cancelled',
        data: alert,
        message: `✅ Alert ${alertId} cancelled`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to cancel alert: ${error.message}`
      };
    }
  }

  /**
   * Get news about a cryptocurrency
   * @param {string} symbol
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  async getMarketNews(symbol, limit = 5) {
    try {
      if (!symbol) throw new Error('Symbol is required');

      // Using CoinGecko's trending endpoint as alternative
      const response = await axios.get(
        `${this.newsUrl}/search/trending`,
        { timeout: this.timeout }
      );

      const coins = response.data.coins || [];
      const symbolUpper = symbol.toUpperCase();
      
      // Filter for the requested symbol
      const relevantCoins = coins
        .filter(coin => coin.item.symbol?.toUpperCase() === symbolUpper)
        .slice(0, limit);

      if (relevantCoins.length === 0) {
        return {
          success: true,
          action: 'trending_retrieved',
          data: [],
          message: `📰 No trending data for ${symbolUpper}, but market is watching it`
        };
      }

      return {
        success: true,
        action: 'news_retrieved',
        count: relevantCoins.length,
        data: relevantCoins,
        message: `📰 Trending: ${relevantCoins.map(c => c.item.name).join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get news: ${error.message}`
      };
    }
  }

  /**
   * Check volatility alerts
   * @param {string} symbol
   * @param {number} threshold - Percentage change threshold
   * @returns {Promise<Object>}
   */
  async checkVolatility(symbol, threshold = 5) {
    try {
      const geckoUrl = 'https://api.coingecko.com/api/v3';
      const mapping = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin'
      };
      
      const coinId = mapping[symbol.toUpperCase()];
      if (!coinId) throw new Error(`Unknown coin: ${symbol}`);

      const response = await axios.get(
        `${geckoUrl}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_market_cap_change_24h: true
          },
          timeout: this.timeout
        }
      );

      const data = response.data[coinId];
      const change = Math.abs(data.usd_24h_change || 0);
      const isVolatile = change > threshold;

      return {
        success: true,
        action: 'volatility_checked',
        symbol: symbol.toUpperCase(),
        data: {
          change_24h: data.usd_24h_change,
          is_volatile: isVolatile,
          threshold: threshold
        },
        message: isVolatile 
          ? `⚡ HIGH VOLATILITY: ${symbol.toUpperCase()} moved ${change.toFixed(2)}% in 24h`
          : `✅ ${symbol.toUpperCase()} is stable (${change.toFixed(2)}% change)`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to check volatility: ${error.message}`
      };
    }
  }
}

module.exports = MarketAlerts;

/**
 * ============================================================
 * Binance Spot Trading API - Full Integration
 * ============================================================
 * 
 * Handles all Binance Spot trading operations
 * - Account management
 * - Order placement and cancellation
 * - Portfolio tracking
 * - Real-time price monitoring
 */

const crypto = require('crypto');
const axios = require('axios');

class BinanceSpotAPI {
  constructor(apiKey, apiSecret, testnet = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = testnet 
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
    this.testnet = testnet;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'User-Agent': 'binance-spot/1.0.2 (SquarePulse)',
      },
    });
  }

  /**
   * Generate signature for authenticated requests
   */
  _generateSignature(params) {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Make signed request to Binance API
   */
  async _signedRequest(method, endpoint, params = {}) {
    try {
      params.timestamp = Date.now();
      params.recvWindow = 5000;

      const signature = this._generateSignature(params);
      params.signature = signature;

      const response = await this.client({
        method,
        url: endpoint,
        params: method === 'GET' ? params : undefined,
        data: method !== 'GET' ? params : undefined,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
        code: error.response?.data?.code,
      };
    }
  }

  /**
   * Public request (no signature needed)
   */
  async _publicRequest(method, endpoint, params = {}) {
    try {
      const response = await this.client({
        method,
        url: endpoint,
        params,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
      };
    }
  }

  /**
   * Get account information (balances, limits, etc)
   */
  async getAccount() {
    return this._signedRequest('GET', '/v3/account');
  }

  /**
   * Get current balance for specific asset
   */
  async getBalance(asset) {
    const result = await this.getAccount();
    if (!result.success) return result;

    const balance = result.data.balances.find(b => b.asset === asset);
    return {
      success: true,
      data: {
        asset,
        free: balance?.free || '0',
        locked: balance?.locked || '0',
        total: parseFloat(balance?.free || 0) + parseFloat(balance?.locked || 0),
      },
    };
  }

  /**
   * Get all non-zero balances
   */
  async getAllBalances() {
    const result = await this.getAccount();
    if (!result.success) return result;

    const balances = result.data.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked),
      }));

    return {
      success: true,
      data: balances,
    };
  }

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol) {
    return this._publicRequest('GET', '/v3/ticker/price', { symbol });
  }

  /**
   * Get market data for symbol
   */
  async getMarketData(symbol) {
    const result = await this._publicRequest('GET', '/v3/ticker/24hr', { symbol });
    if (!result.success) return result;

    return {
      success: true,
      data: {
        symbol,
        price: result.data.lastPrice,
        priceChange: result.data.priceChange,
        priceChangePercent: result.data.priceChangePercent,
        bidPrice: result.data.bidPrice,
        askPrice: result.data.askPrice,
        volume: result.data.volume,
        quoteAssetVolume: result.data.quoteAssetVolume,
        highPrice: result.data.highPrice,
        lowPrice: result.data.lowPrice,
        openPrice: result.data.openPrice,
      },
    };
  }

  /**
   * Place a spot order
   */
  async placeOrder(orderParams) {
    const {
      symbol,
      side, // BUY or SELL
      type = 'LIMIT', // LIMIT, MARKET
      quantity,
      price,
      timeInForce = 'GTC',
    } = orderParams;

    const params = {
      symbol,
      side,
      type,
      quantity: quantity.toString(),
      timeInForce,
    };

    if (type === 'LIMIT' && price) {
      params.price = price.toString();
    }

    // Add newClientOrderId
    params.newClientOrderId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return this._signedRequest('POST', '/v3/order', params);
  }

  /**
   * Place market order
   */
  async placeMarketOrder(symbol, side, quantity) {
    return this.placeOrder({
      symbol,
      side,
      type: 'MARKET',
      quantity,
    });
  }

  /**
   * Place limit order
   */
  async placeLimitOrder(symbol, side, quantity, price) {
    return this.placeOrder({
      symbol,
      side,
      type: 'LIMIT',
      quantity,
      price,
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol, orderId) {
    const params = {
      symbol,
      orderId,
    };

    return this._signedRequest('DELETE', '/v3/order', params);
  }

  /**
   * Get open orders for a symbol
   */
  async getOpenOrders(symbol) {
    return this._signedRequest('GET', '/v3/openOrders', { symbol });
  }

  /**
   * Get all open orders
   */
  async getAllOpenOrders() {
    return this._signedRequest('GET', '/v3/openOrders');
  }

  /**
   * Get order status
   */
  async getOrderStatus(symbol, orderId) {
    const params = {
      symbol,
      orderId,
    };

    return this._signedRequest('GET', '/v3/order', params);
  }

  /**
   * Get trade history
   */
  async getTradeHistory(symbol, limit = 50) {
    return this._signedRequest('GET', '/v3/myTrades', {
      symbol,
      limit,
    });
  }

  /**
   * Get klines/candlestick data
   */
  async getKlines(symbol, interval = '1h', limit = 100) {
    return this._publicRequest('GET', '/v3/klines', {
      symbol,
      interval,
      limit,
    });
  }

  /**
   * Test order placement (dry run)
   */
  async testOrder(orderParams) {
    const {
      symbol,
      side,
      type = 'LIMIT',
      quantity,
      price,
      timeInForce = 'GTC',
    } = orderParams;

    const params = {
      symbol,
      side,
      type,
      quantity: quantity.toString(),
      timeInForce,
    };

    if (type === 'LIMIT' && price) {
      params.price = price.toString();
    }

    return this._signedRequest('POST', '/v3/order/test', params);
  }

  /**
   * Get account commission rates
   */
  async getCommissionRates(symbol) {
    return this._signedRequest('GET', '/v3/account/commission', { symbol });
  }

  /**
   * Get exchange info
   */
  async getExchangeInfo() {
    return this._publicRequest('GET', '/v3/exchangeInfo');
  }

  /**
   * Test connectivity
   */
  async ping() {
    return this._publicRequest('GET', '/v3/ping');
  }

  /**
   * Get server time
   */
  async getServerTime() {
    return this._publicRequest('GET', '/v3/time');
  }

  /**
   * Calculate portfolio value in USDT
   */
  async getPortfolioValue(priceCache = {}) {
    const result = await this.getAllBalances();
    if (!result.success) return result;

    let totalValue = 0;
    const portfolio = [];

    for (const balance of result.data) {
      let usdtValue = 0;

      if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
        usdtValue = balance.total;
      } else if (priceCache[balance.asset + 'USDT']) {
        const price = priceCache[balance.asset + 'USDT'];
        usdtValue = balance.total * price;
      } else {
        // Fetch price if not in cache
        const priceResult = await this.getPrice(balance.asset + 'USDT');
        if (priceResult.success) {
          const price = parseFloat(priceResult.data.price);
          usdtValue = balance.total * price;
          priceCache[balance.asset + 'USDT'] = price;
        }
      }

      if (usdtValue > 0.01) {
        portfolio.push({
          asset: balance.asset,
          quantity: balance.total,
          free: balance.free,
          locked: balance.locked,
          usdtValue: parseFloat(usdtValue.toFixed(2)),
        });

        totalValue += usdtValue;
      }
    }

    return {
      success: true,
      data: {
        totalValue: parseFloat(totalValue.toFixed(2)),
        assets: portfolio.sort((a, b) => b.usdtValue - a.usdtValue),
      },
    };
  }
}

module.exports = BinanceSpotAPI;

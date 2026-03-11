const crypto = require('crypto');
const axios = require('axios');

// Binance API configuration
const BINANCE_API_BASE = 'https://api.binance.com';
const TESTNET_API_BASE = 'https://testnet.binance.vision';

/**
 * Sign request parameters with HMAC SHA256
 */
function signRequest(params, secretKey) {
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(queryString)
    .digest('hex');
  
  return { ...params, signature };
}

/**
 * Make authenticated request to Binance API
 */
async function request(method, endpoint, params = {}, apiKey, secretKey, useTestnet = false) {
  const baseUrl = useTestnet ? TESTNET_API_BASE : BINANCE_API_BASE;
  
  // Add timestamp
  params.timestamp = Date.now();
  params.recvWindow = 5000;
  
  // Sign parameters
  const signedParams = signRequest(params, secretKey);
  
  try {
    const config = {
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'User-Agent': 'binance-spot/1.0.1 (Skill)'
      }
    };

    if (method === 'GET') {
      config.params = signedParams;
    } else {
      config.data = signedParams;
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    const errorMsg = error.response?.data?.msg || error.message;
    const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
    return { 
      success: false, 
      error: errorMsg,
      code: errorCode,
      status: error.response?.status 
    };
  }
}

/**
 * Get account information
 */
async function getAccount(apiKey, secretKey, useTestnet = false) {
  return request('GET', '/api/v3/account', {}, apiKey, secretKey, useTestnet);
}

/**
 * Get current balances
 */
async function getBalances(apiKey, secretKey, useTestnet = false) {
  const result = await getAccount(apiKey, secretKey, useTestnet);
  if (!result.success) return result;
  
  // Filter out zero balances
  const balances = result.data.balances
    .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map(b => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked)
    }));
  
  return { success: true, data: balances };
}

/**
 * Get current price of a symbol
 */
async function getPrice(symbol) {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/api/v3/ticker/price`, {
      params: { symbol }
    });
    return { success: true, data: { symbol, price: parseFloat(response.data.price) } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get account trade history
 */
async function getTradeHistory(symbol, apiKey, secretKey, useTestnet = false, limit = 100) {
  return request('GET', '/api/v3/myTrades', { symbol, limit }, apiKey, secretKey, useTestnet);
}

/**
 * Get all open orders
 */
async function getOpenOrders(apiKey, secretKey, useTestnet = false) {
  return request('GET', '/api/v3/openOrders', {}, apiKey, secretKey, useTestnet);
}

/**
 * Get order status
 */
async function getOrder(symbol, orderId, apiKey, secretKey, useTestnet = false) {
  return request('GET', '/api/v3/order', { symbol, orderId }, apiKey, secretKey, useTestnet);
}

/**
 * Create a new order (MARKET or LIMIT)
 */
async function createOrder(symbol, side, type, quantity, price = null, apiKey, secretKey, useTestnet = false) {
  const params = { symbol, side, type, quantity };
  
  if (type === 'LIMIT' && price) {
    params.price = price;
    params.timeInForce = 'GTC';
  }
  
  return request('POST', '/api/v3/order', params, apiKey, secretKey, useTestnet);
}

/**
 * Cancel an order
 */
async function cancelOrder(symbol, orderId, apiKey, secretKey, useTestnet = false) {
  return request('DELETE', '/api/v3/order', { symbol, orderId }, apiKey, secretKey, useTestnet);
}

/**
 * Get klines (candlestick) data for charting
 */
async function getKlines(symbol, interval = '1d', limit = 100, startTime = null, endTime = null) {
  try {
    const params = { symbol, interval, limit };
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    
    const response = await axios.get(`${BINANCE_API_BASE}/api/v3/klines`, { params });
    
    return { 
      success: true, 
      data: response.data.map(k => ({
        time: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[7])
      }))
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate portfolio value in USDT
 */
async function getPortfolioValue(apiKey, secretKey, useTestnet = false) {
  try {
    const balancesResult = await getBalances(apiKey, secretKey, useTestnet);
    if (!balancesResult.success) return balancesResult;
    
    const balances = balancesResult.data;
    if (balances.length === 0) return { success: true, data: { totalValue: 0, balances: [] } };
    
    // Get prices for all assets
    const pricePromises = balances.map(async (b) => {
      if (b.asset === 'USDT') {
        return { asset: b.asset, price: 1 };
      }
      const priceResult = await getPrice(`${b.asset}USDT`);
      if (priceResult.success) {
        return { asset: b.asset, price: priceResult.data.price };
      }
      return { asset: b.asset, price: 0 };
    });
    
    const prices = await Promise.all(pricePromises);
    const priceMap = Object.fromEntries(prices.map(p => [p.asset, p.price]));
    
    // Calculate total value
    let totalValue = 0;
    const valuedBalances = balances.map(b => {
      const price = priceMap[b.asset] || 0;
      const value = b.total * price;
      totalValue += value;
      return { ...b, price, value };
    });
    
    return { 
      success: true, 
      data: { 
        totalValue: Math.round(totalValue * 100) / 100,
        balances: valuedBalances.sort((a, b) => b.value - a.value)
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAccount,
  getBalances,
  getPrice,
  getTradeHistory,
  getOpenOrders,
  getOrder,
  createOrder,
  cancelOrder,
  getKlines,
  getPortfolioValue,
  signRequest,
  request
};

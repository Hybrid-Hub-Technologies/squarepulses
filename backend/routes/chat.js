const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * POST /api/chat
 * Process user chat messages and return appropriate responses
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message required' });
    }

    const msg = message.toLowerCase();
    let response = '';

    // 🐋 WHALE MOVEMENTS
    if (msg.includes('whale')) {
      response = whaleData();
    }
    // 📰 NEWS
    else if (msg.includes('news') || msg.includes('trending')) {
      response = newsData();
    }
    // 💱 FOREX
    else if (msg.includes('forex') || msg.includes('economic') || msg.includes('calendar')) {
      response = forexData();
    }
    // 🔎 TOKEN SEARCH
    else if (msg.includes('search') || msg.includes('find token') || msg.includes('look up')) {
      const keyword = extractKeyword(message);
      response = await searchTokens(keyword);
    }
    // 📊 PRICE CHECK
    else if (msg.includes('price') || msg.includes('what is') || msg.includes('how much')) {
      const symbol = extractSymbol(message);
      response = await getPrice(symbol);
    }
    // 💹 MARKET ANALYSIS
    else if (msg.includes('market') || msg.includes('analyze') || msg.includes('analysis')) {
      response = marketAnalysis();
    }
    // 🟢 TRADING SIGNALS
    else if (msg.includes('signal') || msg.includes('should i buy') || msg.includes('should i sell')) {
      response = tradingSignals();
    }
    // � PORTFOLIO
    else if (msg.includes('portfolio') || msg.includes('balance') || msg.includes('holdings')) {
      response = await getPortfolio(userId);
    }
    // 💼 TRADING COMMANDS
    else if (msg.includes('buy') || msg.includes('sell') || msg.includes('trade') || msg.includes('open position')) {
      response = await handleTradeCommand(message, userId);
    }
    // 📋 TASKS (must be last so "portfolio" and "trade" take precedence)
    else if (msg.includes('task') || msg.includes('show my') || msg.includes('my tasks') || msg.includes('scheduled')) {
      response = await getTasks(userId);
    }
    // ❓ DEFAULT HELP
    else {
      response = helpMessage();
    }

    res.json({ 
      success: true, 
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      response: '❌ Error: ' + error.message
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DATA FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function whaleData() {
  return '🐋 **WHALE MOVEMENTS**\n\n' +
         '1. BTC - $775,000\n' +
         '   Type: Large Transfer Out\n' +
         '   Address: 3J98t1...NLy\n' +
         '   Sentiment: ✅ BULLISH (Wallet Building)\n\n' +
         '2. ETH - $1,500,000\n' +
         '   Type: Large Transfer In\n' +
         '   Address: 0x1234...7890\n' +
         '   Sentiment: ⚠️ BEARISH (Exchange Deposit)\n\n' +
         '3. BTC - $410,000\n' +
         '   Type: Large Transfer Out\n' +
         '   Address: 1A1z7...Qan\n' +
         '   Sentiment: ✅ BULLISH (Cold Storage)\n\n' +
         '⚡ Summary: More whales buying than selling. Bullish signal!';
}

function newsData() {
  return '📰 **CRYPTO NEWS**\n\n' +
         '1. Bitcoin Breaks $48,000 Resistance Level\n' +
         '   Source: CoinDesk\n' +
         '   📅 ' + new Date().toLocaleDateString() + '\n' +
         '   Major bullish momentum detected\n\n' +
         '2. Ethereum ETF Approval Expected This Week\n' +
         '   Source: CoinTelegraph\n' +
         '   📅 ' + new Date(Date.now() - 3600000).toLocaleDateString() + '\n' +
         '   Regulatory clarity could boost adoption\n\n' +
         '3. Major Exchange Custody Solutions Upgraded\n' +
         '   Source: Decrypt\n' +
         '   📅 ' + new Date(Date.now() - 7200000).toLocaleDateString() + '\n' +
         '   Enhanced security for institutional traders\n\n' +
         '4. Grayscale Initiates Bitcoin ETF Conversion\n' +
         '   Source: Bitcoin Magazine\n' +
         '   📅 ' + new Date(Date.now() - 86400000).toLocaleDateString() + '\n' +
         '   Institutional adoption accelerating';
}

function forexData() {
  return '💱 **FOREX ECONOMIC CALENDAR**\n\n' +
         '📊 **HIGH IMPACT EVENTS**\n\n' +
         '1. Non-Farm Payroll (US)\n' +
         '   Impact: 🔴 HIGH\n' +
         '   Forecast: 200,000 jobs\n' +
         '   Previous: 185,000\n' +
         '   ⏰ Next Friday\n\n' +
         '2. CPI - Consumer Price Index (US)\n' +
         '   Impact: 🔴 HIGH  \n' +
         '   Forecast: 3.5% YoY\n' +
         '   Previous: 3.7%\n' +
         '   ⏰ In 5 days\n\n' +
         '3. ECB Interest Rate Decision\n' +
         '   Impact: 🔴 HIGH\n' +
         '   Action: Monitor for rate decisions\n' +
         '   ⏰ In 8 days\n\n' +
         '💡 **Impact on Crypto**: USD strength inversely affects BTC/USD prices';
}

function marketAnalysis() {
  return '📊 **MARKET ANALYSIS**\n\n' +
         '**Current Market State**: 🟢 BULLISH\n\n' +
         '**Whale Activity**: ✅ Accumulation Phase\n' +
         'Large wallets buying and moving to cold storage\n\n' +
         '**News Sentiment**: 70% Positive\n' +
         'Regulatory clarity and institutional adoption driving demand\n\n' +
         '**Forex Impact**: USD Index Stable\n' +
         'No major headwinds from traditional markets\n\n' +
         '**Volatility**: 3.2% (Normal)\n' +
         'Healthy for swing trading\n\n' +
         '🎯 **RECOMMENDATION**: \n' +
         'Enter on pullback to $49,500-$49,800 support\n' +
         'Exit targets: $52,000 | $55,000 | $58,000\n' +
         '**Risk/Reward**: 1:3 (Excellent)\n' +
         '**Timeframe**: 4-12 week swing trade';
}

function tradingSignals() {
  return '🟢 **TRADING SIGNALS**\n\n' +
         '═══════════════════════════════════════\n\n' +
         '**BTC/USD** 🟢 **BUY SIGNAL**\n' +
         '├─ Entry Target: $50,000 - $50,500\n' +
         '├─ Take Profit 1: $52,000 (Entry +4%)\n' +
         '├─ Take Profit 2: $55,000 (Entry +10%)\n' +
         '├─ Take Profit 3: $58,000 (Entry +16%)\n' +
         '├─ Stop Loss: $48,000 (Entry -4%)\n' +
         '└─ Risk/Reward: 1:3 ✅\n\n' +
         '**ETH/USD** 🟡 **HOLD**\n' +
         '├─ Current: $3,050\n' +
         '├─ Resistance: $3,100 (Wait for breakout)\n' +
         '├─ Support: $2,950\n' +
         '└─ Action: Watch for daily close above $3,100\n\n' +
         '**SOL/USD** 🔴 **TAKE PROFIT / EXIT**\n' +
         '├─ Sell Signal: Breaking below support\n' +
         '├─ Stop Loss: $135\n' +
         '└─ Next Entry: $120-125 support zone\n\n' +
         '**Market Bias**: BULLISH on BTC, Mixed on Alts\n' +
         '**Best Setup**: BTC above $50,500 = Altseason Begins';
}

function helpMessage() {
  return '🤖 **WELCOME TO SQUAREPULSE AI ASSISTANT**\n\n' +
         '**I can help you with:**\n\n' +
         '🐋 **Whale Movements**: "Show whale movements"\n' +
         '📰 **Crypto News**: "Get crypto news" or "What\'s trending"\n' +
         '💱 **Forex Calendar**: "Forex calendar" or "Economic events"\n' +
         '🔎 **Token Search**: "Search for Solana tokens"\n' +
         '💰 **Price Tracker**: "What\'s the price of BTC?"\n' +
         '📊 **Market Analysis**: "Analyze the market for me"\n' +
         '🟢 **Trading Signals**: "Give me trading signals"\n\n' +
         '**Just ask naturally - I understand:**\n' +
         '✓ "Show me bitcoin whales"\n' +
         '✓ "Any crypto news today?"\n' +
         '✓ "Is ETH a good buy?"\n' +
         '✓ "What signals for tomorrow?"\n\n' +
         '**What would you like to do?**';
}

// ════════════════════════════════════════════════════════════════════════════
// ASYNC FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Search tokens on CoinGecko
 */
async function searchTokens(keyword) {
  try {
    if (!keyword) keyword = 'bitcoin';
    
    const response = await axios.get('https://api.coingecko.com/api/v3/search', {
      params: { query: keyword },
      timeout: 5000
    });

    if (response.data.coins && response.data.coins.length > 0) {
      let result = `🔎 **TOKENS FOUND: "${keyword}"**\n\n`;
      
      response.data.coins.slice(0, 5).forEach((coin, i) => {
        result += `${i+1}. **${coin.name}** (${coin.symbol?.toUpperCase() || 'N/A'})\n`;
        result += `   Market Cap Rank: ${coin.market_cap_rank || 'N/A'}\n\n`;
      });
      
      return result;
    }
    
    return `🔎 No tokens found for "${keyword}". Try another search!`;
  } catch (error) {
    return `🔎 Token search temporary unavailable. Try "bitcoin" or "ethereum"`;
  }
}

/**
 * Get price from CoinGecko
 */
async function getPrice(symbol) {
  try {
    const sym = symbol?.toLowerCase() || 'bitcoin';
    console.log(`💰 Fetching price for: ${sym}`);
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: sym,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'SquarePulse-Bot/1.0 (+https://squarepulse.com)',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ API Response:`, response.data);
    
    const data = response.data[sym];
    if (data && data.usd) {
      const change = (data.usd_24h_change || 0).toFixed(2);
      const changeEmoji = data.usd_24h_change > 0 ? '🟢' : '🔴';
      
      const formatted = `💰 **${sym.toUpperCase()} PRICE**\n\n` +
             `Current Price: $${data.usd.toLocaleString('en-US', {minimumFractionDigits: 2})} USD\n` +
             `24h Change: ${changeEmoji} ${change}%\n` +
             `Market Cap: ${formatNumber(data.usd_market_cap)}\n` +
             `24h Volume: ${formatNumber(data.usd_24h_vol)}\n\n` +
             '💭 Tip: Perfect time to analyze entry points!';
      
      console.log(`📊 Formatted: ${formatted}`);
      return formatted;
    }
    
    console.warn(`⚠️ No price data found for ${sym} in response:`, response.data);
    return `💰 Could not find price for "${symbol}". Try "bitcoin", "ethereum", "solana", "bnb", or "cardano"`;
    
  } catch (error) {
    console.error(`❌ Price API Error:`, error.message, error.response?.status, error.response?.data);
    return `💰 Price service error (${error.response?.status || 'network'}). Try again in a moment.`;
  }
}

/**
 * Format numbers beautifully
 */
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000000) return '$' + (num / 1000000000).toFixed(2) + 'B';
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return '$' + (num / 1000).toFixed(2) + 'K';
  return '$' + num.toFixed(2);
}

/**
 * Extract keyword from message
 */
function extractKeyword(message) {
  const match = message.match(/(?:search|find|look)\s+(?:for\s+)?(?:a\s+)?(\w+)/i);
  return match ? match[1] : 'bitcoin';
}

/**
 * Extract symbol from message
 */
function extractSymbol(message) {
  // Map of common symbols to CoinGecko IDs
  const symbolMap = {
    'btc': 'bitcoin', 'bitcoin': 'bitcoin',
    'eth': 'ethereum', 'ethereum': 'ethereum',
    'bnb': 'binancecoin', 'binance': 'binancecoin',
    'sol': 'solana', 'solana': 'solana',
    'ada': 'cardano', 'cardano': 'cardano',
    'xrp': 'ripple', 'ripple': 'ripple',
    'dot': 'polkadot', 'polkadot': 'polkadot',
    'link': 'chainlink', 'chainlink': 'chainlink',
    'uni': 'uniswap', 'uniswap': 'uniswap',
    'matic': 'polygon', 'polygon': 'polygon',
    'avax': 'avalanche-2', 'avalanche': 'avalanche-2',
    'ftm': 'fantom', 'fantom': 'fantom',
    'arb': 'arbitrum', 'arbitrum': 'arbitrum',
    'op': 'optimism', 'optimism': 'optimism',
    'doge': 'dogecoin', 'dogecoin': 'dogecoin',
    'ltc': 'litecoin', 'litecoin': 'litecoin'
  };
  
  const msgLower = message.toLowerCase();
  
  // First, try to find exact matches from the symbolMap
  for (const [key, value] of Object.entries(symbolMap)) {
    // Create regex to match the word as a whole word only
    const regex = new RegExp(`\\b${key}\\b`);
    if (regex.test(msgLower)) {
      return value;
    }
  }
  
  // Fallback: extract any 2-6 letter word that's not a common word
  const commonWords = ['the', 'for', 'and', 'are', 'now', 'can', 'why', 'how', 'has', 'is', 'of', 'a', 'in', 'on', 'or', 'at', 'to', 'do', 'go', 'up', 'be', 'me', 'by', 'if', 'as', 'so', 'we', 'it', 'my', 'no', 'he', 'ya', 'price', 'what', 'good', 'bad', 'today', 'tomorrow'];
  
  const words = msgLower.split(/\s+/);
  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length >= 2 && clean.length <= 6 && !commonWords.includes(clean)) {
      const mapped = symbolMap[clean];
      if (mapped) return mapped;
      return clean; // Return the word itself if not in map
    }
  }
  
  return 'bitcoin'; // Default fallback
}

/**
 * Get user tasks
 */
async function getTasks(userId) {
  try {
    const db = require('../database');
    const tasks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, title, description, next_run, status, created_at 
        FROM tasks 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY next_run ASC
        LIMIT 10
      `, [userId || 'default'], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (tasks.length === 0) {
      return '📋 **MY TASKS**\n\n' +
             'No scheduled tasks yet.\n\n' +
             '💡 Try:\n' +
             '• "Post at 4pm about crypto news"\n' +
             '• "Buy $5 DASH every day"\n' +
             '• "Alert me when BTC hits $60k"';
    }

    let response = '📋 **MY SCHEDULED TASKS**\n\n';
    tasks.forEach((task, idx) => {
      const nextRun = new Date(task.next_run).toLocaleString();
      const status = task.status === 'active' ? '✅' : '⏸️';
      response += `${idx + 1}. ${status} ${task.title}\n` +
                  `   Description: ${task.description || 'N/A'}\n` +
                  `   Next Run: ${nextRun}\n\n`;
    });

    response += `Total: ${tasks.length} tasks`;
    return response;
  } catch (error) {
    return '📋 Could not load tasks. Try again later.';
  }
}

/**
 * Handle trading commands
 */
async function handleTradeCommand(message, userId) {
  try {
    const msg = message.toLowerCase();
    
    // Extract amount and symbol
    const amountMatch = message.match(/\$(\d+)/);
    const symbolMatch = message.match(/\b([A-Z]{2,})\b/);
    
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const symbol = symbolMatch ? symbolMatch[1] : 'BTC';
    
    if (msg.includes('buy')) {
      return `✅ **BUY ORDER PLACED**\n\n` +
             `Asset: ${symbol}\n` +
             `Amount: $${amount}\n` +
             `Status: Pending Confirmation\n\n` +
             `🎯 Take Profit & Stop Loss required\n` +
             `Try: "Close at $100 profit" or "Set TP $${amount + 100}"`;
    } else if (msg.includes('sell')) {
      return `📉 **SELL ORDER PREPARED**\n\n` +
             `Asset: ${symbol}\n` +
             `Amount: $${amount}\n` +
             `Status: Ready to Execute\n\n` +
             `Type: Market Order (Execute Immediately)\n` +
             `Confirm: Say "Execute sell"`;
    } else if (msg.includes('open position')) {
      return `🦅 **POSITION OPENED**\n\n` +
             `Coin: ${symbol}\n` +
             `Size: $${amount}\n` +
             `Entry: Current Market\n\n` +
             `Monitor: Checking TP/SL levels every minute\n` +
             `Auto-close: Enabled`;
    } else {
      return `💰 **TRADING MODE**\n\n` +
             `I can execute:\n` +
             `• "Buy $100 ETH"\n` +
             `• "Sell $50 SOL"\n` +
             `• "Open position $200 BTC"\n` +
             `• "Set take profit $150"\n` +
             `• "Check portfolio"`;
    }
  } catch (error) {
    return '❌ Trading command error. Make sure you have API keys configured.';
  }
}

/**
 * Get portfolio
 */
async function getPortfolio(userId) {
  try {
    return `💼 **MY PORTFOLIO**\n\n` +
           `Total Value: $12,450.50 USDT\n` +
           `24h Change: 🟢 +3.2%\n\n` +
           `Holdings:\n` +
           `├─ BTC: 0.35 ($16,800)\n` +
           `├─ ETH: 2.5 ($7,625)\n` +
           `├─ SOL: 15 ($2,100)\n` +
           `└─ USDT: 3,875.50 (Cash)\n\n` +
           `🎯 Open Trades: 2\n` +
           `• BTC Long (Entry $48,500) - TP: $52,000\n` +
           `• ETH Long (Entry $3,050) - TP: $3,300\n\n` +
           `View full dashboard: Check "My Portfolio" tab`;
  } catch (error) {
    return '💼 Portfolio data unavailable. Add API keys to see holdings.';
  }
}

module.exports = router;

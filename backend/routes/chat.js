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
    
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: sym,
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true
      },
      timeout: 5000
    });
    
    const data = response.data[sym];
    if (data && data.usd) {
      const change = (data.usd_24h_change || 0).toFixed(2);
      const changeEmoji = data.usd_24h_change > 0 ? '🟢' : '🔴';
      
      return `💰 **${sym.toUpperCase()} PRICE**\n\n` +
             `Current Price: $${data.usd?.toLocaleString() || 'N/A'}\n` +
             `24h Change: ${changeEmoji} ${change}%\n` +
             `Market Cap: $${formatNumber(data.usd_market_cap)}\n` +
             `24h Volume: $${formatNumber(data.usd_24h_vol)}\n\n` +
             '💭 Tip: Use this to time your entry points!';
    }
    
    return `💰 Could not find price for "${symbol}". Try "bitcoin", "ethereum", or "solana"`;
  } catch (error) {
    return `💰 Price service temporarily down. Check live price on CoinGecko or Binance`;
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
  const match = message.match(/\b([a-z]{2,})\b/i);
  return match ? match[1] : 'bitcoin';
}

module.exports = router;

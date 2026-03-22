/**
 * ============================================================
 * REAL-TIME MARKET ANALYSIS SKILL FOR OPENCLAW
 * ============================================================
 * 
 * Gives OpenClaw AI access to live Binance market data
 * Analyzes trends and generates accurate trading posts
 */

const axios = require('axios');

class RealtimeMarketSkill {
  constructor(config = {}) {
    this.config = config;
    this.lastAnalysis = null;
    this.lastUpdate = null;
    this.binanceAPI = 'https://api.binance.com/api/v3';
  }

  /**
   * Fetch real-time price data from Binance
   */
  async fetchPriceData() {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];
      const requests = symbols.map(sym => 
        axios.get(`${this.binanceAPI}/ticker/24hr?symbol=${sym}`)
      );
      
      const responses = await Promise.all(requests);
      
      const data = {};
      responses.forEach((res, idx) => {
        const ticker = res.data;
        data[symbols[idx].replace('USDT', '')] = {
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          volume: parseFloat(ticker.quoteAssetVolume),
          priceChangeAmount: parseFloat(ticker.priceChange)
        };
      });
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching price data:', error.message);
      return null;
    }
  }

  /**
   * Analyze market
   */
  analyzeMarket(priceData) {
    if (!priceData) return null;

    const trend = this.calculateTrend(priceData);
    const strength = this.calculateMarketStrength(priceData);
    const signals = this.generateSignals(priceData);
    
    return {
      trend,
      strength,
      signals,
      timestamp: new Date().toISOString()
    };
  }

  calculateTrend(data) {
    const btcChange = data.BTC?.change24h || 0;
    const ethChange = data.ETH?.change24h || 0;
    const altChange = (data.BNB?.change24h + data.SOL?.change24h + data.ADA?.change24h) / 3;

    if (btcChange > 1 && ethChange > 0.5 && altChange > 0) {
      return { direction: 'BULLISH 🟢', confidence: 'HIGH', reason: 'BTC and ALTs gaining momentum' };
    } else if (btcChange > 0 && ethChange > -1) {
      return { direction: 'NEUTRAL ⚪', confidence: 'MEDIUM', reason: 'Mixed signals - consolidation phase' };
    } else {
      return { direction: 'BEARISH 🔴', confidence: 'HIGH', reason: 'Downward pressure on majors' };
    }
  }

  calculateMarketStrength(data) {
    const volumesAdequate = Object.values(data).every(coin => coin.volume > 1000000000);
    const volatilityLow = Object.values(data).every(coin => Math.abs(coin.change24h) < 5);
    
    return {
      volumeStatus: volumesAdequate ? 'Strong Volume ✅' : 'Low Volume ⚠️',
      volatility: volatilityLow ? 'Low Volatility' : 'High Volatility',
      riskLevel: volatilityLow ? 'Low Risk' : 'High Risk'
    };
  }

  generateSignals(data) {
    const signals = [];
    
    if (data.BTC?.change24h > 2) {
      signals.push('🔷 Bitcoin Breaking Resistance - Watch for breakout');
    }
    if (data.ETH?.change24h > data.BTC?.change24h) {
      signals.push('🔶 Alt season indicators - ETH outperforming');
    }
    if (data.SOL?.change24h > 3) {
      signals.push('⚡ Solana momentum strong - DeFi activity increasing');
    }
    if (Math.abs(data.BTC?.change24h) < 0.5) {
      signals.push('⏸️ Bitcoin consolidating - Major move incoming');
    }
    
    return signals.length > 0 ? signals : ['📊 Market stabilizing - Good entry opportunities'];
  }

  generatePost(priceData, analysis) {
    const btc = priceData.BTC;
    const eth = priceData.ETH;
    const mktTrend = analysis.trend;
    
    const post = `
🚀 CRYPTO MARKET UPDATE - ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════

📊 **MARKET OVERVIEW: ${mktTrend.direction}**

🔹 **Bitcoin (BTC)**: $${btc.price.toFixed(0)}
   • 24h Change: ${btc.change24h > 0 ? '📈' : '📉'} ${btc.change24h.toFixed(2)}%
   • Range: $${btc.low24h.toFixed(0)} - $${btc.high24h.toFixed(0)}
   • Volume: $${(btc.volume / 1e9).toFixed(1)}B

🔹 **Ethereum (ETH)**: $${eth.price.toFixed(0)}
   • 24h Change: ${eth.change24h > 0 ? '📈' : '📉'} ${eth.change24h.toFixed(2)}%
   • Performance vs BTC: ${eth.change24h > btc.change24h ? '✅ LEADING' : '❌ LAGGING'}

═══════════════════════════════════════════════════════

🎯 **TECHNICAL ANALYSIS**

Market Strength: ${analysis.strength.volumeStatus} | ${analysis.strength.volatility}
Risk Level: ${analysis.strength.riskLevel}
Confidence: ${mktTrend.confidence}

**Why ${mktTrend.direction}?**
${mktTrend.reason}

═══════════════════════════════════════════════════════

🔔 **MARKET SIGNALS**

${analysis.signals.map(s => `• ${s}`).join('\n')}

═══════════════════════════════════════════════════════

💡 **TRADING RECOMMENDATION**

${this.getTradingAdvice(priceData, analysis)}

═══════════════════════════════════════════════════════

Last Updated: ${new Date().toISOString()}
Data Source: Binance Real-Time API ✅
#Crypto #Trading #Bitcoin #Ethereum #MarketAnalysis
    `.trim();

    return post;
  }

  getTradingAdvice(priceData, analysis) {
    const btc = priceData.BTC;
    const mktTrend = analysis.trend.direction;
    
    if (mktTrend.includes('BULLISH')) {
      return `📈 **BUY STRATEGY**: 
• Entry: Pullback to 4H support ${(btc.low24h * 0.98).toFixed(0)}
• Target 1: ${(btc.price * 1.02).toFixed(0)} (+2%)
• Target 2: ${(btc.price * 1.05).toFixed(0)} (+5%)
• Stop Loss: ${(btc.low24h * 0.95).toFixed(0)} (-3%)
Risk/Reward: 1:2 ✅`;
    } else if (mktTrend.includes('BEARISH')) {
      return `📉 **SHORT STRATEGY**:
• Entry: Resistance break ${(btc.high24h * 1.01).toFixed(0)}
• Target 1: ${(btc.price * 0.98).toFixed(0)} (-2%)
• Target 2: ${(btc.price * 0.95).toFixed(0)} (-5%)
• Stop Loss: ${(btc.high24h * 1.03).toFixed(0)} (+3%)
Risk/Reward: 1:2 ✅`;
    } else {
      return `⏸️ **HOLD STRATEGY**:
• Wait for breakout confirmation
• New support: ${(btc.low24h * 0.99).toFixed(0)}
• New resistance: ${(btc.high24h * 1.01).toFixed(0)}
• Range-bound: Consider stacking small positions
Risk/Reward: Neutral`;
    }
  }

  /**
   * Get real-time market analysis (NOT cached old data)
   */
  async getMarketAnalysis() {
    try {
      console.log('🔄 Fetching LIVE market data from Binance...');
      
      const priceData = await this.fetchPriceData();
      if (!priceData) throw new Error('Could not fetch price data');
      
      const analysis = this.analyzeMarket(priceData);
      
      this.lastAnalysis = {
        priceData,
        analysis,
        timestamp: new Date().toISOString()
      };
      
      this.lastUpdate = Date.now();
      
      return this.lastAnalysis;
    } catch (error) {
      console.error('❌ Market analysis error:', error.message);
      throw error;
    }
  }

  /**
   * Generate a social media post from real-time analysis
   */
  async generateMarketPost() {
    try {
      const analysis = await this.getMarketAnalysis();
      const post = this.generatePost(analysis.priceData, analysis.analysis);
      
      return {
        success: true,
        post,
        analysis: analysis.analysis,
        priceData: analysis.priceData,
        timestamp: analysis.timestamp
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Could not generate post - ' + error.message
      };
    }
  }

  /**
   * Analyze specific coin with real-time data
   */
  async analyzeCoin(symbol) {
    try {
      const coin = symbol.toUpperCase().replace('USDT', '');
      const tickerSymbol = coin + 'USDT';
      
      const res = await axios.get(`${this.binanceAPI}/ticker/24hr?symbol=${tickerSymbol}`);
      const ticker = res.data;
      
      const coinData = {
        symbol: coin,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume: parseFloat(ticker.quoteAssetVolume),
        priceChangeAmount: parseFloat(ticker.priceChange)
      };
      
      const trend = coinData.change24h > 1 ? '🟢 BULLISH' : coinData.change24h < -1 ? '🔴 BEARISH' : '⚪ NEUTRAL';
      
      return {
        success: true,
        coin: coinData,
        trend,
        analysis: this.generateCoinAnalysis(coinData),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        symbol: symbol,
        message: `Could not analyze ${symbol}`
      };
    }
  }

  /**
   * Generate trading recommendation based on real data
   */
  generateCoinAnalysis(coinData) {
    const { price, change24h, high24h, low24h } = coinData;
    const range = high24h - low24h;
    const midpoint = (high24h + low24h) / 2;
    const volatility = Math.abs(change24h);
    
    let recommendation = '';
    let entryPoint = '';
    let tp1 = '';
    let tp2 = '';
    let sl = '';
    
    if (volatility > 3) {
      // High volatility - wider targets
      if (change24h > 2) {
        recommendation = '📈 BULLISH - Continue Long';
        entryPoint = (price * 0.98).toFixed(4);
        tp1 = (price * 1.02).toFixed(4);
        tp2 = (price * 1.05).toFixed(4);
        sl = (low24h * 0.97).toFixed(4);
      } else if (change24h < -2) {
        recommendation = '📉 BEARISH - Short Setup';
        entryPoint = (price * 1.01).toFixed(4);
        tp1 = (price * 0.98).toFixed(4);
        tp2 = (price * 0.95).toFixed(4);
        sl = (high24h * 1.02).toFixed(4);
      } else {
        recommendation = '⚪ CONSOLIDATING - Await breakout';
        entryPoint = low24h.toFixed(4);
        tp1 = high24h.toFixed(4);
        tp2 = (high24h * 1.02).toFixed(4);
        sl = (low24h * 0.98).toFixed(4);
      }
    } else {
      // Low volatility - tight range
      recommendation = '⏸️ LOW VOLATILITY - Accumulation zone';
      entryPoint = (low24h * 0.99).toFixed(4);
      tp1 = (high24h * 1.01).toFixed(4);
      tp2 = (high24h * 1.03).toFixed(4);
      sl = (low24h * 0.95).toFixed(4);
    }
    
    const riskReward = ((tp2 - entryPoint) / (entryPoint - sl)).toFixed(2);
    
    return {
      recommendation,
      entryPoint,
      tp1,
      tp2,
      sl,
      riskReward: `1:${riskReward}`,
      volatility: volatility > 3 ? '⚡ HIGH' : volatility > 1.5 ? '📊 MEDIUM' : '✅ LOW'
    };
  }

  /**
   * Process natural language command with real-time data
   */
  async processCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    // Market analysis commands
    if (cmd.includes('market analysis') || cmd.includes('market update') || cmd.includes('crypto update')) {
      return await this.generateMarketPost();
    }
    
    // Specific coin analysis
    if (cmd.includes('analyze') || cmd.includes('analysis')) {
      const match = cmd.match(/analyze\s+(\w+)|(\w+)\s+analysis/i);
      if (match) {
        const coin = match[1] || match[2];
        return await this.analyzeCoin(coin);
      }
    }
    
    // Get current price
    if (cmd.includes('price') || cmd.includes('current')) {
      const match = cmd.match(/price\s+(?:of\s+)?(\w+)|(\w+)\s+price/i);
      if (match) {
        const result = await this.analyzeCoin(match[1] || match[2]);
        if (result.success) {
          return {
            success: true,
            message: `${result.coin.symbol}: $${result.coin.price} (${result.coin.change24h > 0 ? '+' : ''}${result.coin.change24h.toFixed(2)}%)`,
            price: result.coin.price,
            change: result.coin.change24h,
            trend: result.trend,
            timestamp: result.timestamp
          };
        }
        return result;
      }
    }
    
    return {
      success: false,
      message: 'Command not recognized. Try: "market analysis", "analyze BTC", or "price ETH"'
    };
  }

  /**
   * Get health status - shows if data is real-time or cached
   */
  getStatus() {
    const freshnessMs = Date.now() - (this.lastUpdate || 0);
    const isFresh = freshnessMs < 60000; // Less than 1 minute old
    
    return {
      status: isFresh ? '✅ LIVE' : '⚠️ CACHED',
      lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : 'Never',
      freshness: `${Math.floor(freshnessMs / 1000)}s ago`,
      dataSource: 'Binance API - Real-time',
      ready: true
    };
  }
}

module.exports = RealtimeMarketSkill;

/**
 * REAL-TIME CRYPTO MARKET ANALYSIS
 * Fetches live data and generates market posts
 */

const axios = require('axios');

class MarketAnalyzer {
  constructor() {
    this.binanceAPI = 'https://api.binance.com/api/v3';
    this.cryptoCompareAPI = 'https://min-api.cryptocompare.com/data';
  }

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

  async runAnalysis() {
    console.log('\n📊 Fetching live market data...\n');
    
    const priceData = await this.fetchPriceData();
    if (!priceData) return;
    
    const analysis = this.analyzeMarket(priceData);
    const post = this.generatePost(priceData, analysis);
    
    console.log('✅ LIVE MARKET ANALYSIS COMPLETE:\n');
    console.log(post);
    console.log('\n═══════════════════════════════════════════════════════\n');
    
    return { priceData, analysis, post };
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new MarketAnalyzer();
  analyzer.runAnalysis().catch(err => console.error('Error:', err));
}

module.exports = MarketAnalyzer;

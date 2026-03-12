/**
 * ============================================================
 * OpenClaw Skill: Signals & Market Analysis
 * ============================================================
 * 
 * Connects to existing Signals, News, Whales, Forex systems
 * Provides comprehensive market analysis and trading signals
 * 
 * Usage examples:
 * - "Search for Solana tokens"
 * - "Get latest crypto news"
 * - "Show whale movements"
 * - "What's happening in forex?"
 * - "Generate trading post for BTC"
 */

const axios = require('axios');

class SignalsAndAnalysis {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000/api';
    this.timeout = config.timeout || 5000;
  }

  /**
   * Search for tokens across CoinGecko and Binance DEX
   * @param {string} keyword - Token name or symbol
   * @returns {Promise<Object>}
   */
  async searchTokens(keyword) {
    try {
      if (!keyword || keyword.length < 2) {
        throw new Error('Search term must be at least 2 characters');
      }

      // Get both CEX and DEX data from proxy
      const response = await axios.get(
        `${this.baseUrl.replace('/api', '')}/proxy`,
        {
          params: { type: 'tokens', search: keyword },
          timeout: this.timeout
        }
      );

      if (!response.data.success || !response.data.data?.length) {
        return {
          success: false,
          message: `No tokens found for "${keyword}"`
        };
      }

      const tokens = response.data.data.slice(0, 10);

      return {
        success: true,
        action: 'tokens_searched',
        count: tokens.length,
        data: tokens,
        message: `🔍 Found ${tokens.length} token(s) matching "${keyword}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Search failed: ${error.message}`
      };
    }
  }

  /**
   * Get latest crypto news
   * @param {number} limit - Number of articles to return
   * @returns {Promise<Object>}
   */
  async getCryptoNews(limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseUrl.replace('/api', '')}/proxy`,
        {
          params: { type: 'news' },
          timeout: this.timeout * 2
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch news');
      }

      const news = response.data.data || [];
      const limited = news.slice(0, limit);

      return {
        success: true,
        action: 'news_retrieved',
        count: limited.length,
        data: limited,
        message: `📰 Retrieved ${limited.length} latest news articles`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ News fetch failed: ${error.message}`
      };
    }
  }

  /**
   * Get whale movements and large transactions
   * @returns {Promise<Object>}
   */
  async getWhaleMovements() {
    try {
      const response = await axios.get(
        `${this.baseUrl.replace('/api', '')}/proxy`,
        {
          params: { type: 'whales' },
          timeout: this.timeout * 2
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch whale data');
      }

      const whales = response.data.data || [];
      
      // Analyze sentiment
      const bullish = whales.filter(w => w.impact === 'BULLISH').length;
      const bearish = whales.filter(w => w.impact === 'BEARISH').length;
      const totalValue = whales.reduce((sum, w) => sum + (w.usdValueRaw || 0), 0);

      return {
        success: true,
        action: 'whales_retrieved',
        count: whales.length,
        data: whales.slice(0, 20),
        analysis: {
          bullish_count: bullish,
          bearish_count: bearish,
          total_value_usd: totalValue,
          sentiment: bullish > bearish ? 'BULLISH' : bullish < bearish ? 'BEARISH' : 'NEUTRAL'
        },
        message: `🐋 Found ${whales.length} whale movements (Sentiment: ${bullish > bearish ? 'BULLISH 📈' : 'BEARISH 📉'})`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Whale data failed: ${error.message}`
      };
    }
  }

  /**
   * Get Forex calendar and economic events
   * @returns {Promise<Object>}
   */
  async getForexEvents() {
    try {
      const response = await axios.get(
        `${this.baseUrl.replace('/api', '')}/proxy`,
        {
          params: { type: 'forex' },
          timeout: this.timeout * 2
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch forex data');
      }

      const events = response.data.data || [];
      const today = events.filter(e => e.isToday).length;
      const upcoming = events.filter(e => e.isUpcoming).length;

      return {
        success: true,
        action: 'forex_retrieved',
        count: events.length,
        data: events.slice(0, 15),
        analysis: {
          today: today,
          upcoming: upcoming
        },
        message: `💱 Forex: ${today} today, ${upcoming} upcoming`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Forex data failed: ${error.message}`
      };
    }
  }

  /**
   * Generate trading post using AI
   * @param {Object} params
   * @param {string} params.coin - Coin symbol
   * @param {number} params.entry - Entry price
   * @param {number} params.tp1 - Take profit 1
   * @param {number} params.tp2 - Take profit 2
   * @param {string} params.signal - Bullish/Bearish/Neutral
   * @returns {Promise<Object>}
   */
  async generateTradingPost(params) {
    try {
      if (!params.coin || !params.entry) {
        throw new Error('Coin and entry price required');
      }

      const prompt = `Generate a professional trading post for ${params.coin}:
Entry: $${params.entry}
TP1: $${params.tp1 || 'TBD'}
TP2: $${params.tp2 || 'TBD'}
Signal: ${params.signal || 'Analysis'}

Make it engaging and suitable for posting on Binance Square.`;

      // Use local AI or call OpenAI/Groq if configured
      // For now, return template
      return {
        success: true,
        action: 'post_generated',
        data: {
          coin: params.coin,
          entry: params.entry,
          tp1: params.tp1,
          tp2: params.tp2,
          post: this._generateDefaultPost(params),
          suggestion: 'Edit and customize the post before posting'
        },
        message: `✍️ Trading post generated for ${params.coin}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Post generation failed: ${error.message}`
      };
    }
  }

  /**
   * Analyze market conditions
   * @returns {Promise<Object>}
   */
  async analyzeMarket() {
    try {
      // Get all market data in parallel
      const [newsRes, whalesRes, forexRes] = await Promise.allSettled([
        this.getCryptoNews(5),
        this.getWhaleMovements(),
        this.getForexEvents()
      ]);

      const analysis = {
        news: newsRes.status === 'fulfilled' ? newsRes.value.count : 0,
        whales: whalesRes.status === 'fulfilled' ? whalesRes.value.analysis : {},
        forex: forexRes.status === 'fulfilled' ? forexRes.value.analysis : {},
        timestamp: new Date().toISOString()
      };

      const recommendation = this._generateMarketRecommendation(analysis);

      return {
        success: true,
        action: 'market_analyzed',
        data: analysis,
        recommendation: recommendation,
        message: `📊 Market Analysis: ${recommendation}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Get trading signals based on multiple factors
   * @returns {Promise<Object>}
   */
  async getTradingSignals() {
    try {
      const whales = await this.getWhaleMovements();
      const news = await this.getCryptoNews(3);

      const signals = {
        whale_sentiment: whales.success ? whales.analysis.sentiment : 'UNKNOWN',
        news_count: news.success ? news.count : 0,
        overall_signal: whales.success && news.success ? 
          this._calculateSignal(whales.analysis, news) : 'INCONCLUSIVE'
      };

      return {
        success: true,
        action: 'signals_calculated',
        data: signals,
        message: `🎯 Overall Signal: ${signals.overall_signal}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Signal calculation failed: ${error.message}`
      };
    }
  }

  // ────────────────────────────────────────────────────────────
  // Helper Methods
  // ────────────────────────────────────────────────────────────

  _generateDefaultPost(params) {
    return `🎯 Trading Signal: ${params.coin}

Entry: $${params.entry}
Target 1: $${params.tp1 || 'TBD'}
Target 2: $${params.tp2 || 'TBD'}
Signal: ${params.signal || 'Accumulation'}

Risk Management:
• Set stop loss 2-3% below entry
• Take profit at levels above
• Size position wisely

⚠️ DYOR - Not financial advice`;
  }

  _generateMarketRecommendation(analysis) {
    const whaleScore = analysis.whales.bullish_count > analysis.whales.bearish_count ? 1 : -1;
    const newsScore = analysis.news > 5 ? 1 : 0;

    const totalScore = whaleScore + newsScore;

    if (totalScore > 1) return '📈 BULLISH - Strong buying pressure';
    if (totalScore > 0) return '📈 Slightly BULLISH - Positive signals';
    if (totalScore < -1) return '📉 BEARISH - Strong selling pressure';
    if (totalScore < 0) return '📉 Slightly BEARISH - Negative signals';
    return '😐 NEUTRAL - Mixed signals, hold for clarity';
  }

  _calculateSignal(whaleAnalysis, newsData) {
    let score = 0;

    // Whale analysis
    if (whaleAnalysis.sentiment === 'BULLISH') score += 2;
    if (whaleAnalysis.sentiment === 'BEARISH') score -= 2;

    // News count (more news = more volatility)
    if (newsData.count > 5) score += 1;

    if (score > 2) return '🟢 STRONG BUY';
    if (score > 0) return '🟡 BUY';
    if (score < -2) return '🔴 STRONG SELL';
    if (score < 0) return '🟡 SELL';
    return '⚪ HOLD';
  }
}

module.exports = SignalsAndAnalysis;

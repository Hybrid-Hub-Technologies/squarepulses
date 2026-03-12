/**
 * ============================================================
 * OpenClaw Skill: Trading Position Manager
 * ============================================================
 * 
 * Allows OpenClaw to manage trading positions in SquarePulse
 * Can open, close, and monitor trades
 * 
 * Usage examples:
 * - "Open a BTC position at 50000 with TP at 52000 and SL at 48000"
 * - "Show my open positions"
 * - "Close position POS-1234567890"
 * - "What's the status of my trades?"
 */

const axios = require('axios');

class TradingPositionManager {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5000/api';
    this.userId = config.userId || 'openclaw-agent';
    this.timeout = config.timeout || 5000;
  }

  /**
   * Open a new trading position
   * @param {Object} params
   * @param {string} params.coin_symbol - e.g., "BTC", "ETH"
   * @param {number} params.entry_price - Entry price
   * @param {number} params.tp1 - Take Profit 1
   * @param {number} params.tp2 - Take Profit 2
   * @param {number} params.sl - Stop Loss
   * @param {number} params.position_size - Position size
   * @param {number} params.leverage - Leverage multiplier
   * @returns {Promise<Object>}
   */
  async openPosition(params) {
    try {
      const payload = {
        user_id: this.userId,
        coin_symbol: params.coin_symbol?.toUpperCase() || '',
        entry_price: parseFloat(params.entry_price),
        tp1: parseFloat(params.tp1),
        tp2: parseFloat(params.tp2),
        sl: parseFloat(params.sl),
        position_size: parseFloat(params.position_size) || 1,
        leverage: parseFloat(params.leverage) || 1
      };

      // Validation
      if (!payload.coin_symbol) throw new Error('Coin symbol is required');
      if (!payload.entry_price) throw new Error('Entry price is required');
      if (!payload.tp1) throw new Error('TP1 is required');
      if (!payload.sl) throw new Error('Stop Loss is required');

      const response = await axios.post(
        `${this.baseUrl}/openclaw/open`,
        payload,
        { timeout: this.timeout }
      );

      return {
        success: true,
        action: 'position_opened',
        data: response.data,
        message: `✅ Position opened: ${payload.coin_symbol} at $${payload.entry_price}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to open position: ${error.message}`
      };
    }
  }

  /**
   * Get all open positions for the user
   * @returns {Promise<Object>}
   */
  async getOpenPositions() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/openclaw/positions/${this.userId}`,
        { timeout: this.timeout }
      );

      const positions = response.data.positions || [];
      
      return {
        success: true,
        action: 'positions_retrieved',
        count: positions.length,
        data: positions,
        message: positions.length > 0 
          ? `📊 Found ${positions.length} open position(s)`
          : '📭 No open positions'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to retrieve positions: ${error.message}`
      };
    }
  }

  /**
   * Close a trading position
   * @param {Object} params
   * @param {string} params.position_id - Position ID to close
   * @param {number} params.close_price - Price at which to close
   * @returns {Promise<Object>}
   */
  async closePosition(params) {
    try {
      if (!params.position_id) throw new Error('Position ID is required');
      if (!params.close_price) throw new Error('Close price is required');

      const response = await axios.patch(
        `${this.baseUrl}/openclaw/close/${params.position_id}`,
        { close_price: parseFloat(params.close_price) },
        { timeout: this.timeout }
      );

      return {
        success: true,
        action: 'position_closed',
        data: response.data,
        message: `✅ Position closed at $${params.close_price}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to close position: ${error.message}`
      };
    }
  }

  /**
   * Get position details by ID
   * @param {string} positionId
   * @returns {Promise<Object>}
   */
  async getPositionStatus(positionId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/openclaw/position/${positionId}`,
        { timeout: this.timeout }
      );

      const position = response.data.position;
      
      return {
        success: true,
        action: 'position_status_retrieved',
        data: position,
        message: `📈 ${position.coin_symbol}: Entry $${position.entry_price} | Current $${position.current_price} | PnL: ${position.pnl_percent.toFixed(2)}%`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get position status: ${error.message}`
      };
    }
  }

  /**
   * Get trading statistics
   * @returns {Promise<Object>}
   */
  async getTradingStats() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/openclaw/stats/${this.userId}`,
        { timeout: this.timeout }
      );

      const stats = response.data.stats;
      
      return {
        success: true,
        action: 'stats_retrieved',
        data: stats,
        message: `📊 Stats: Open Trades: ${stats.open_count} | Closed: ${stats.closed_count} | Win Rate: ${stats.win_rate}%`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to get stats: ${error.message}`
      };
    }
  }

  /**
   * Modify position parameters
   * @param {Object} params
   * @param {string} params.position_id - Position ID
   * @param {number} params.tp1 - New TP1
   * @param {number} params.tp2 - New TP2
   * @param {number} params.sl - New SL
   * @returns {Promise<Object>}
   */
  async modifyPosition(params) {
    try {
      if (!params.position_id) throw new Error('Position ID is required');

      const payload = {
        tp1: params.tp1 ? parseFloat(params.tp1) : undefined,
        tp2: params.tp2 ? parseFloat(params.tp2) : undefined,
        sl: params.sl ? parseFloat(params.sl) : undefined
      };

      // Remove undefined values
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const response = await axios.patch(
        `${this.baseUrl}/openclaw/position/${params.position_id}`,
        payload,
        { timeout: this.timeout }
      );

      return {
        success: true,
        action: 'position_modified',
        data: response.data,
        message: `✅ Position ${params.position_id} updated`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to modify position: ${error.message}`
      };
    }
  }
}

module.exports = TradingPositionManager;

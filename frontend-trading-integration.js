/**
 * ============================================================
 * SquarePulse Binance Integration - Frontend Setup
 * ============================================================
 * 
 * Add this to your frontend's JavaScript to enable trading
 */

const TRADING_API = {
  baseURL: `${APP.apiUrl}/trading`,

  /**
   * Save Binance API credentials
   */
  async addAPICredentials(accountName, apiKey, apiSecret, environment = 'mainnet') {
    try {
      const response = await fetch(`${this.baseURL}/keys/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName,
          apiKey,
          apiSecret,
          environment,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('✅ API credentials saved!', 'success');
        return data;
      } else {
        showNotification(`❌ ${data.error}`, 'error');
        return data;
      }
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * List saved accounts
   */
  async listAccounts() {
    try {
      const response = await fetch(`${this.baseURL}/keys/list`);
      return await response.json();
    } catch (error) {
      console.error('Error listing accounts:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get portfolio
   */
  async getPortfolio(account = 'default') {
    try {
      const response = await fetch(`${this.baseURL}/portfolio?account=${account}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get current price
   */
  async getPrice(symbol, account = 'default') {
    try {
      const response = await fetch(`${this.baseURL}/price/${symbol}?account=${account}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Open a new trade
   */
  async openTrade(symbol, side, quantity, targetProfit = 5, account = 'default') {
    try {
      // Show confirmation dialog
      const confirmed = confirm(`
⚠️ TRADE CONFIRMATION

Order: ${side} ${quantity} ${symbol}
Target Profit: $${targetProfit}

Type "CONFIRM" to proceed.`);

      if (!confirmed) return { success: false, error: 'Trade cancelled' };

      const response = await fetch(`${this.baseURL}/bot/open-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side,
          quantity,
          targetProfit,
          account,
          confirm: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`✅ Trade opened: ${data.trade.tradeId}`, 'success');
      } else {
        showNotification(`❌ Trade failed: ${data.error}`, 'error');
      }

      return data;
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Close a trade
   */
  async closeTrade(tradeId, account = 'default') {
    try {
      const confirmed = confirm(`Close trade ${tradeId}?`);
      if (!confirmed) return { success: false };

      const response = await fetch(`${this.baseURL}/bot/close-trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          account,
          confirm: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showNotification(`✅ Trade closed with PnL: $${data.trade.pnl}`, 'success');
      } else {
        showNotification(`❌ ${data.error}`, 'error');
      }

      return data;
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  },

  /**
   * Get active trades
   */
  async getActiveTrades(account = 'default') {
    try {
      const response = await fetch(`${this.baseURL}/bot/trades?account=${account}&status=active`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get trading stats
   */
  async getStats(account = 'default') {
    try {
      const response = await fetch(`${this.baseURL}/bot/stats?account=${account}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Update trade TP/SL
   */
  async updateTrade(tradeId, takeProfit, stopLoss, account = 'default') {
    try {
      const response = await fetch(`${this.baseURL}/bot/trade/${tradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          takeProfit,
          stopLoss,
          account,
        }),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

/**
 * Show notification helper
 */
function showNotification(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    z-index: 10000;
    max-width: 400px;
    font-size: 14px;
  `;

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// ══════════════════════════════════════════════════════════════════════════
// HTML UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Create API Key Input Form
 */
function createAPIKeyForm() {
  return `
<div class="card" style="margin-bottom: 20px">
  <h3>🔑 Add Binance API Keys</h3>
  <form id="apiKeyForm" style="display: grid; gap: 10px">
    <input
      type="text"
      id="accountName"
      placeholder="Account name (e.g., 'main', 'trading')"
      required
      style="padding: 10px; border: 1px solid var(--border); border-radius: 6px"
    />

    <textarea
      id="apiKey"
      placeholder="Paste Binance API Key"
      required
      style="padding: 10px; border: 1px solid var(--border); border-radius: 6px; font-family: monospace; font-size: 12px"
    ></textarea>

    <textarea
      id="apiSecret"
      placeholder="Paste Binance API Secret"
      required
      style="padding: 10px; border: 1px solid var(--border); border-radius: 6px; font-family: monospace; font-size: 12px"
    ></textarea>

    <select id="environment" style="padding: 10px; border: 1px solid var(--border); border-radius: 6px">
      <option value="mainnet">🟢 Mainnet (Real Trading)</option>
      <option value="testnet">🟡 Testnet (Practice)</option>
    </select>

    <button type="submit" class="btn btn-primary">Save API Credentials</button>
  </form>
</div>
  `;
}

/**
 * Create Trading Panel
 */
function createTradingPanel() {
  return `
<div class="card">
  <h3>📊 Trading Dashboard</h3>

  <!-- Portfolio Section -->
  <div style="margin-bottom: 20px; padding: 15px; background: var(--card-bg); border-radius: 8px">
    <h4>💼 Portfolio</h4>
    <div id="portfolioDisplay" style="font-size: 14px">Loading portfolio...</div>
    <button class="btn btn-small" onclick="refreshPortfolio()">Refresh</button>
  </div>

  <!-- Active Trades -->
  <div style="margin-bottom: 20px">
    <h4>📈 Active Trades</h4>
    <div id="tradesDisplay" style="font-size: 14px; max-height: 300px; overflow-y: auto">
      Loading trades...
    </div>
  </div>

  <!-- Quick Trade Section -->
  <div style="padding: 15px; background: var(--card-bg); border-radius: 8px">
    <h4>⚡ Quick Trade</h4>
    <form id="quickTradeForm" style="display: grid; gap: 10px">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
        <input
          type="text"
          id="tradePair"
          placeholder="Symbol (e.g. BTCUSDT)"
          style="padding: 8px; border: 1px solid var(--border); border-radius: 6px"
        />
        <select id="tradeSide" style="padding: 8px; border: 1px solid var(--border); border-radius: 6px">
          <option value="BUY">🟢 BUY</option>
          <option value="SELL">🔴 SELL</option>
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px">
        <input
          type="number"
          id="tradeQty"
          placeholder="Quantity"
          step="0.00000001"
          style="padding: 8px; border: 1px solid var(--border); border-radius: 6px"
        />
        <input
          type="number"
          id="tradeTP"
          placeholder="Target Profit ($)"
          value="5"
          style="padding: 8px; border: 1px solid var(--border); border-radius: 6px"
        />
      </div>

      <button type="submit" class="btn btn-success">Execute Trade</button>
    </form>
  </div>

  <!-- Trading Stats -->
  <div style="margin-top: 20px; padding: 15px; background: var(--card-bg); border-radius: 8px">
    <h4>📊 Stats</h4>
    <div id="statsDisplay" style="font-size: 13px">Loading stats...</div>
  </div>
</div>
  `;
}

// ══════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════════════

/**
 * API Key Form Handler
 */
async function handleAPIKeyForm(e) {
  e.preventDefault();

  const accountName = document.getElementById('accountName').value;
  const apiKey = document.getElementById('apiKey').value;
  const apiSecret = document.getElementById('apiSecret').value;
  const environment = document.getElementById('environment').value;

  if (!accountName || !apiKey || !apiSecret) {
    showNotification('Please fill all fields', 'error');
    return;
  }

  const result = await TRADING_API.addAPICredentials(
    accountName,
    apiKey,
    apiSecret,
    environment
  );

  if (result.success) {
    document.getElementById('apiKeyForm').reset();
    await loadAccounts();
  }
}

/**
 * Quick Trade Handler
 */
async function handleQuickTrade(e) {
  e.preventDefault();

  const symbol = document.getElementById('tradePair').value.toUpperCase();
  const side = document.getElementById('tradeSide').value;
  const quantity = parseFloat(document.getElementById('tradeQty').value);
  const targetProfit = parseFloat(document.getElementById('tradeTP').value);

  if (!symbol || !quantity) {
    showNotification('Please fill all fields', 'error');
    return;
  }

  const result = await TRADING_API.openTrade(symbol, side, quantity, targetProfit);

  if (result.success) {
    document.getElementById('quickTradeForm').reset();
    await refreshTrades();
  }
}

/**
 * Refresh Portfolio Display
 */
async function refreshPortfolio() {
  const result = await TRADING_API.getPortfolio();

  if (result.success) {
    const { totalValue, assets } = result.data;
    let html = `<strong>Total: $${totalValue.toFixed(2)}</strong><br><br>`;

    for (const asset of assets.slice(0, 5)) {
      html += `${asset.asset}: ${asset.quantity.toFixed(8)} ($${asset.usdtValue.toFixed(2)})<br>`;
    }

    document.getElementById('portfolioDisplay').innerHTML = html;
  }
}

/**
 * Refresh Trades Display
 */
async function refreshTrades() {
  const result = await TRADING_API.getActiveTrades();

  if (result.success && result.data.length > 0) {
    let html = '';
    for (const trade of result.data) {
      html += `
<div style="padding: 10px; border-left: 3px solid ${trade.side === 'BUY' ? '#10b981' : '#ef4444'}; margin-bottom: 8px">
  <strong>${trade.symbol}</strong> - ${trade.side}<br>
  Entry: $${trade.entryPrice.toFixed(2)} | Qty: ${trade.quantity}<br>
  Target: $${trade.targetProfit} | ID: ${trade.tradeId}
  <button class="btn btn-small" onclick="closeTrade('${trade.tradeId}')">Close</button>
</div>
      `;
    }
    document.getElementById('tradesDisplay').innerHTML = html;
  } else {
    document.getElementById('tradesDisplay').innerHTML = '<em>No active trades</em>';
  }
}

/**
 * Close Trade Handler
 */
async function closeTrade(tradeId) {
  const result = await TRADING_API.closeTrade(tradeId);
  if (result.success) {
    await refreshTrades();
    await refreshPortfolio();
  }
}

/**
 * Load Accounts and refresh UI
 */
async function loadAccounts() {
  const result = await TRADING_API.listAccounts();
  if (result.success && result.data.length > 0) {
    showNotification(`✅ ${result.data.length} account(s) configured`, 'success');
  }
}

// Init event listeners when DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('apiKeyForm');
  if (form) {
    form.addEventListener('submit', handleAPIKeyForm);
  }

  const tradeForm = document.getElementById('quickTradeForm');
  if (tradeForm) {
    tradeForm.addEventListener('submit', handleQuickTrade);
  }

  // Load initial data
  loadAccounts();
  refreshPortfolio();
  refreshTrades();

  // Auto-refresh every 30 seconds
  setInterval(() => {
    refreshPortfolio();
    refreshTrades();
  }, 30000);
});

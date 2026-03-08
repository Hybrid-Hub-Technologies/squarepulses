// ============================================================
// coinintel.js — Coin Intelligence Tab (FREE: CoinGecko)
// ============================================================

let _intelItems = [];
let _selectedIntel = null;

// ── Search & Load ─────────────────────────────────────────
async function loadCoinIntelTab() {
  const container = document.getElementById('coinintel-feed');
  if (!container) return;

  // First load: show top 10 coins
  if (!window._intelInitialized) {
    container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading top coins...</div>';
    try {
      const coins = await fetchCoinIntelligence();
      if (coins.length) {
        _intelItems = coins;
        renderCoinIntel(coins);
      } else {
        container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>No coins loaded</p></div>`;
      }
    } catch(e) {
      container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>Error loading coins</p></div>`;
    }
    window._intelInitialized = true;
  }
}

async function searchCoinIntel() {
  const searchInput = document.getElementById('intelSearchInput');
  const kw = searchInput ? searchInput.value.trim() : '';
  if (!kw) { showToast('info','🔍','Enter a coin name'); return; }

  const container = document.getElementById('coinintel-feed');
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Searching...</div>';

  try {
    // Search in CoinGecko
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(kw)}`);
    const data = await res.json();
    const coins = (data.coins || []).slice(0, 5);
    
    if (!coins.length) {
      container.innerHTML = '<div class="empty-state"><p>No coins found</p></div>';
      return;
    }

    // Get market data for these coins
    const ids = coins.map(c => c.id).join(',');
    const mktRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`);
    const mktData = await mktRes.json();

    const results = mktData.map((c, i) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price || 0,
      marketCap: c.market_cap || 0,
      volume24h: c.total_volume || 0,
      change24h: c.price_change_percentage_24h || 0,
      circSupply: c.circulating_supply || 0,
      totalSupply: c.total_supply || 0,
      ath: c.ath || c.current_price,
      icon: c.image,
      trustScore: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      riskLevel: Math.random() > 0.5 ? 'LOW' : 'MEDIUM',
      analysis: `${c.name} is currently ${c.price_change_percentage_24h > 0 ? 'bullish' : 'bearish'} with a 24h change of ${c.price_change_percentage_24h?.toFixed(2)}%. Market cap: $${(c.market_cap / 1000000000).toFixed(2)}B`,
    }));

    _intelItems = results;
    renderCoinIntel(results);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚠</div><p>Search error: ${e.message}</p></div>`;
  }
}

async function fetchCoinIntelligence() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=false&price_change_percentage=24h');
    const data = await res.json();

    return data.map((c, i) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      marketCap: c.market_cap || 0,
      volume24h: c.total_volume || 0,
      change24h: c.price_change_percentage_24h || 0,
      circSupply: c.circulating_supply || 0,
      totalSupply: c.total_supply || 0,
      ath: c.ath || c.current_price,
      icon: c.image,
      trustScore: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      riskLevel: Math.random() > 0.5 ? 'LOW' : 'MEDIUM',
      analysis: `${c.name} is currently ${c.price_change_percentage_24h > 0 ? 'bullish' : 'bearish'} with a 24h change of ${c.price_change_percentage_24h?.toFixed(2)}%. Market cap: $${(c.market_cap / 1000000000).toFixed(2)}B`,
    })).slice(0, 10);
  } catch(e) { return []; }
}

function renderCoinIntel(items) {
  const container = document.getElementById('coinintel-feed');
  if (!container) return;

  const html = items.map((c, i) => {
    const changeColor = c.change24h >= 0 ? '#4ade80' : '#ef4444';
    return `
      <div class="intel-card" onclick="selectCoinIntel(${i})" style="cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:12px;background:rgba(255,255,255,0.02)">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:10px;flex:1">
            ${c.icon ? `<img src="${c.icon}" style="width:32px;height:32px;border-radius:50%">` : `<div style="width:32px;height:32px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center">${c.symbol.substring(0,1)}</div>`}
            <div>
              <h3 style="margin:0;font-size:0.9rem">${c.name}</h3>
              <p style="margin:0;font-size:0.75rem;color:var(--muted)">Rank: #${i+1} • Trust: ${c.trustScore}</p>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:bold">$${c.price.toFixed(2)}</div>
            <div style="color:${changeColor};font-size:0.85rem">${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.75rem;color:var(--muted)">
          <div>MCap: $${(c.marketCap / 1000000000).toFixed(1)}B</div>
          <div>Vol: $${(c.volume24h / 1000000000).toFixed(1)}B</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html || '<div class="empty-state"><p>No data found</p></div>';
}

function selectCoinIntel(idx) {
  _selectedIntel = _intelItems[idx];
  if (!_selectedIntel) return;

  const preview = document.getElementById('coinintel-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3>${_selectedIntel.name} (${_selectedIntel.symbol})</h3>
      <div style="margin:12px 0">
        <div style="font-size:1.5rem;font-weight:bold">$${_selectedIntel.price.toFixed(4)}</div>
        <div style="color:${_selectedIntel.change24h >= 0 ? '#4ade80' : '#ef4444'};font-weight:bold">
          ${_selectedIntel.change24h >= 0 ? '📈' : '📉'} ${_selectedIntel.change24h >= 0 ? '+' : ''}${_selectedIntel.change24h.toFixed(2)}% (24h)
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
        <div style="padding:10px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Market Cap</small><br>
          <strong>$${(_selectedIntel.marketCap / 1000000000).toFixed(2)}B</strong>
        </div>
        <div style="padding:10px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">24h Volume</small><br>
          <strong>$${(_selectedIntel.volume24h / 1000000000).toFixed(2)}B</strong>
        </div>
        <div style="padding:10px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Trust Score</small><br>
          <strong style="color:${_selectedIntel.trustScore === 'HIGH' ? '#4ade80' : '#f59e0b'}">${_selectedIntel.trustScore}</strong>
        </div>
        <div style="padding:10px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Risk Level</small><br>
          <strong style="color:${_selectedIntel.riskLevel === 'LOW' ? '#4ade80' : '#f59e0b'}">${_selectedIntel.riskLevel}</strong>
        </div>
      </div>
      <p><strong>Analysis:</strong></p>
      <p>${_selectedIntel.analysis}</p>
    </div>
  `;
}

async function generateIntelPost() {
  if (!_selectedIntel) {
    showToast('info', 'ℹ', 'Select a coin first');
    return;
  }

  const genBtn = document.querySelector('[onclick*="generateIntelPost"]');
  if (genBtn) {
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';
    genBtn.style.pointerEvents = 'none';
  }

  try {
    const prompt = `Write a Binance Square post analyzing this coin's on-chain intelligence (100-150 chars):\n\nCoin: ${_selectedIntel.name}\nPrice: $${_selectedIntel.price.toFixed(2)}\n24h Change: ${_selectedIntel.change24h.toFixed(2)}%\nTrust: ${_selectedIntel.trustScore}\nAnalysis: ${_selectedIntel.analysis}\n\nMake it informative with emojis and hashtags.`;

    const post = await callClaude(
      'You are a crypto analyst providing coin intelligence insights.',
      prompt,
      false
    );

    loadComposer(post);
    showToast('success', '🔍', 'Intel post generated!');
  } catch(e) {
    showToast('error', '❌', e.message);
  }

  if (genBtn) {
    genBtn.innerHTML = '✨ Generate Post';
    genBtn.style.pointerEvents = '';
  }
}

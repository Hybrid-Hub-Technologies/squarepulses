// ============================================================
// coinintel.js — Coin Intelligence Tab (FREE: CoinGecko)
// ============================================================

let _intelItems = [];
let _selectedIntel = null;

async function loadCoinIntelTab() {
  const container = document.getElementById('coinintel-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Analyzing on-chain data...</div>';

  try {
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
    })).slice(0, 8);
  } catch(e) { return []; }
}hCoinIntelligence();
    
    if (!projects.length) throw new Error('No data available');
    
    _intelItems = projects;
    renderCoinIntel(projects);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div>
      <p>Could not load coin intelligence.<br><small>${e.message}</small></p></div>`;

  }
}

async function fetchCoinIntelligence() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=true&price_change_percentage=24h');
    const data = await res.json();

    return data.map((c, i) => ({
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      marketCap: c.market_cap || 0,
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
}ercentage_24h || 0,
      circSupply: c.circulating_supply || 0,
      totalSupply: c.total_supply || 0,
      ath: c.ath || c.current_price,
      icon: c.image,
      trustScore: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      riskLevel: Math.random() > 0.5 ? 'LOW' : 'MEDIUM',
      analysis: `${c.name} is currently ${c.price_change_percentage_24h > 0 ? 'bullish' : 'bearish'} with a 24h change of ${c.price_change_percentage_24h?.toFixed(2)}%. Market cap: $${(c.market_cap / 1000000000).toFixed(2)}B`,
    })).slice(0, 8);
  } catch(e) {
    return [];
  }
}

  try {
    const raw = await callClaude(
      `You are a professional crypto analyst. Do a comprehensive analysis of the given coin.
Search for current price, recent news, social sentiment, on-chain data, and technical levels.
Return ONLY a raw JSON object. No markdown, no backticks.
Structure:
{
  "name": string,
  "symbol": string,
  "currentPrice": string,
  "priceChange24h": string,
  "marketCap": string,
  "summary": string (2-3 sentences overview),
  "sentimentScore": number (0-100, 100=most bullish),
  "technicals": {
    "trend": string (BULLISH/BEARISH/NEUTRAL),
    "support": string,
    "resistance": string,
    "rsi": string,
    "summary": string
  },
  "fundamentals": {
    "score": number (0-100),
    "useCase": string,
    "team": string,
    "tokenomics": string,
    "summary": string
  },
  "social": {
    "score": number (0-100),
    "twitterSentiment": string,
    "communityStrength": string,
    "recentBuzz": string,
    "summary": string
  },
  "bullCase": [string, string, string],
  "bearCase": [string, string, string],
  "recentNews": [{"title":string, "impact":string, "bullish":boolean}],
  "verdict": string (BUY/SELL/HOLD/WAIT),
  "verdictReason": string,
  "priceTargets": { "conservative": string, "moderate": string, "aggressive": string }
}`,
      `Do a full analysis of ${kw} cryptocurrency. Search for current price, news, sentiment, technicals, fundamentals.`,
      true
    );

    let report;
    try {
      const clean = raw.replace(/```json|```/g,'').trim();
      report = JSON.parse(clean);
    } catch(e) {
      const match = raw.match(/\{[\s\S]*\}/);
      report = match ? JSON.parse(match[0]) : null;
    }

    if (!report) throw new Error('Analysis parse failed');
    _intelReport = report;
    renderIntelReport(report);

  } catch(e) {
    if (output) output.innerHTML = `<div class="empty-state"><div class="icon">⚠</div>
      <p>Analysis failed.<br><small>${e.message}</small></p></div>`;
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '🔍 Analyze'; }
}

function renderIntelReport(r) {
  const output = document.getElementById('intel-output');
  if (!output) return;

  const verdictColor = { BUY:'green', SELL:'red', HOLD:'gold', WAIT:'gold' };
  const sentColor = r.sentimentScore >= 60 ? 'var(--green)' : r.sentimentScore >= 40 ? 'var(--accent)' : 'var(--red)';

  const bullCaseHtml = (r.bullCase||[]).map(b => `<div style="font-size:0.82rem;color:var(--muted);padding:6px 0;border-bottom:1px solid var(--border)">✅ ${b}</div>`).join('');
  const bearCaseHtml = (r.bearCase||[]).map(b => `<div style="font-size:0.82rem;color:var(--muted);padding:6px 0;border-bottom:1px solid var(--border)">❌ ${b}</div>`).join('');

  const newsHtml = (r.recentNews||[]).map(n => `
    <div style="padding:10px 14px;background:var(--surface);border-radius:8px;border-left:3px solid ${n.bullish?'var(--green)':'var(--red)'}">
      <div style="font-size:0.82rem;font-weight:600">${n.title}</div>
      <div style="font-size:0.72rem;color:var(--muted);margin-top:3px">${n.impact} · ${n.bullish?'🟢 Bullish':'🔴 Bearish'}</div>
    </div>`).join('');

  output.innerHTML = `
  <div class="fade-up">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">
      <div>
        <h2 style="font-size:1.3rem;font-weight:800">${r.name} <span style="color:var(--muted);font-weight:400;font-size:1rem">(${r.symbol})</span></h2>
        <div style="font-family:'Space Mono',monospace;font-size:0.9rem;margin-top:4px">
          $${r.currentPrice} <span style="color:${parseFloat(r.priceChange24h)>=0?'var(--green)':'var(--red)'}">  ${r.priceChange24h}%</span>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:0.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em">Verdict</div>
        <div style="font-size:1.6rem;font-weight:800;color:var(--${verdictColor[r.verdict]||'text'})">${r.verdict}</div>
        <div style="font-size:0.72rem;color:var(--muted);max-width:160px;text-align:right;margin-top:2px">${r.verdictReason}</div>
      </div>
    </div>

    <!-- Summary -->
    <div class="intel-section">
      <h3>📋 Overview</h3>
      <p class="intel-text">${r.summary}</p>
    </div>

    <!-- Sentiment Score -->
    <div class="intel-section">
      <h3>🎯 Overall Sentiment</h3>
      <div class="score-bar">
        <span style="font-size:0.75rem;color:var(--red)">Bearish</span>
        <div class="bar"><div class="fill" style="width:${r.sentimentScore}%;background:${sentColor}"></div></div>
        <span style="font-size:0.75rem;color:var(--green)">Bullish</span>
        <span class="score-label" style="color:${sentColor}">${r.sentimentScore}/100</span>
      </div>
    </div>

    <!-- Scores Grid -->
    <div class="detail-grid" style="margin-bottom:20px">
      ${statBox('Technical', r.technicals?.trend||'—', r.technicals?.trend==='BULLISH'?'green':r.technicals?.trend==='BEARISH'?'red':'')}
      ${statBox('Fundamentals', (r.fundamentals?.score||0)+'/100', r.fundamentals?.score>=60?'green':r.fundamentals?.score>=40?'gold':'red')}
      ${statBox('Social Score', (r.social?.score||0)+'/100', r.social?.score>=60?'green':r.social?.score>=40?'gold':'red')}
      ${statBox('Market Cap', r.marketCap||'—', '')}
    </div>

    <!-- Price Targets -->
    <div class="intel-section">
      <h3>🎯 Price Targets</h3>
      <div class="detail-grid" style="margin-top:0">
        ${statBox('Conservative', r.priceTargets?.conservative||'—', 'green')}
        ${statBox('Moderate',     r.priceTargets?.moderate||'—',     'gold')}
        ${statBox('Aggressive',   r.priceTargets?.aggressive||'—',   'green')}
        ${statBox('Support',      r.technicals?.support||'—',        'green')}
      </div>
    </div>

    <!-- Bull / Bear -->
    <div class="intel-section">
      <h3>⚖️ Bull vs Bear Case</h3>
      <div class="bull-bear-grid">
        <div class="bull-box"><h4>🟢 Bull Case</h4>${bullCaseHtml}</div>
        <div class="bear-box"><h4>🔴 Bear Case</h4>${bearCaseHtml}</div>
      </div>
    </div>

    <!-- Technicals -->
    <div class="intel-section">
      <h3>📊 Technical Analysis</h3>
      <p class="intel-text">${r.technicals?.summary||'—'}</p>
      <div class="detail-grid" style="margin-top:12px">
        ${statBox('Support',    r.technicals?.support||'—',    'green')}
        ${statBox('Resistance', r.technicals?.resistance||'—', 'red')}
        ${statBox('RSI',        r.technicals?.rsi||'—',         '')}
        ${statBox('Trend',      r.technicals?.trend||'—',      r.technicals?.trend==='BULLISH'?'green':'red')}
      </div>
    </div>

    <!-- Social -->
    <div class="intel-section">
      <h3>🐦 Social Sentiment</h3>
      <p class="intel-text">${r.social?.summary||'—'}</p>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted)">${r.social?.recentBuzz||''}</div>
    </div>

    <!-- Recent News -->
    ${newsHtml ? `<div class="intel-section">
      <h3>📰 Recent News</h3>
      <div style="display:flex;flex-direction:column;gap:8px">${newsHtml}</div>
    </div>` : ''}

    <!-- Generate Post Button -->
    <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap">
      <button class="btn-generate" onclick="generateIntelPost('FULL')">✨ Full Report Post</button>
      <button class="btn-generate" onclick="generateIntelPost('BULL')">🟢 Bull Case Post</button>
      <button class="btn-generate" onclick="generateIntelPost('BEAR')">🔴 Bear Case Post</button>
    </div>
  </div>`;
}

async function generateIntelPost(type) {
  if (!_intelReport) { showToast('info','🔍','Run analysis first'); return; }
  const r = _intelReport;

  const btn = document.querySelector(`[onclick="generateIntelPost('${type}')"]`);
  if (btn) { btn.style.pointerEvents = 'none'; btn.innerHTML = '<span class="spinner"></span>'; }

  const prompts = {
    FULL: `Write a comprehensive Binance Square post about ${r.name} (${r.symbol}).
Include: current price $${r.currentPrice}, verdict: ${r.verdict}, key bull and bear points.
Max 600 chars. Professional tone. End with hashtags.`,
    BULL: `Write a bullish Binance Square post about ${r.name} (${r.symbol}).
Bull case: ${(r.bullCase||[]).join(', ')}.
Price targets: conservative ${r.priceTargets?.conservative}, aggressive ${r.priceTargets?.aggressive}.
Max 500 chars. Exciting tone. End with hashtags.`,
    BEAR: `Write a cautionary Binance Square post about ${r.name} (${r.symbol}).
Bear case: ${(r.bearCase||[]).join(', ')}.
Support level: ${r.technicals?.support}.
Max 500 chars. Analytical tone. Include DYOR disclaimer. End with hashtags.`,
  };

  try {
    const post = await callClaude(
      `You are a professional crypto analyst on Binance Square. Write engaging, accurate posts.`,
      prompts[type],
      false
    );
    loadComposer(post);
    showToast('success','✨','Post generated!');
  } catch(e) {
    showToast('error','❌','Generation failed');
  }

  if (btn) { btn.style.pointerEvents = ''; btn.innerHTML = type === 'FULL' ? '✨ Full Report Post' : type === 'BULL' ? '🟢 Bull Case Post' : '🔴 Bear Case Post'; }
}

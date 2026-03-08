// ============================================================
// coinintel.js — Coin Intelligence Tab
// Full analysis: price chart, technicals, on-chain data, AI analysis
// Uses CoinGecko free API (no key needed)
// ============================================================

let _intelItems   = [];
let _selectedIntel = null;
let _chartInstance = null;

// ── Load Tab (top 10 on init) ─────────────────────────────
async function loadCoinIntelTab() {
  if (window._intelInitialized) return;
  window._intelInitialized = true;

  const container = document.getElementById('coinintel-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading top coins...</div>';

  try {
    const coins = await fetchTopCoins();
    if (!coins.length) throw new Error('No data');
    _intelItems = coins;
    renderCoinIntelList(coins);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">❌</div><p>${e.message}</p></div>`;
  }
}

// ── Search ────────────────────────────────────────────────
async function searchCoinIntel() {
  const kw = document.getElementById('intelSearchInput')?.value.trim();
  if (!kw) { showToast('info','🔍','Enter a coin name'); return; }

  const btn = document.getElementById('intelSearchBtn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span>'; }

  const container = document.getElementById('coinintel-feed');
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Searching...</div>';

  try {
    const srchRes  = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(kw)}`);
    const srchData = await srchRes.json();
    const top5     = (srchData.coins || []).slice(0, 5);
    if (!top5.length) { container.innerHTML = '<div class="empty-state"><p>No coins found</p></div>'; return; }

    const ids    = top5.map(c => c.id).join(',');
    const mktRes = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`);
    const mktData = await mktRes.json();

    _intelItems = mktData.map(c => mapCoinData(c));
    renderCoinIntelList(_intelItems);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚠</div><p>${e.message}</p></div>`;
  }

  if (btn) { btn.disabled=false; btn.innerHTML='🔍 Search'; }
}

// ── Fetch top 10 coins ────────────────────────────────────
async function fetchTopCoins() {
  const res  = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=1h,24h,7d');
  const data = await res.json();
  return data.map(c => mapCoinData(c));
}

// ── Map CoinGecko data to our format ──────────────────────
function mapCoinData(c) {
  const change24h = c.price_change_percentage_24h || 0;
  const change7d  = c.price_change_percentage_7d_in_currency || 0;
  const change1h  = c.price_change_percentage_1h_in_currency || 0;

  // Calculate trust & risk from real data
  const mcapB      = (c.market_cap || 0) / 1e9;
  const volMcapRatio = c.market_cap ? (c.total_volume || 0) / c.market_cap : 0;
  const athDropPct   = c.ath ? ((c.ath - c.current_price) / c.ath) * 100 : 0;

  const trustScore = mcapB > 10 ? 'HIGH' : mcapB > 1 ? 'MEDIUM' : 'LOW';
  const riskLevel  = mcapB > 10 ? 'LOW'  : mcapB > 1 ? 'MEDIUM' : 'HIGH';

  // Momentum score (0-100)
  const momentum = Math.min(100, Math.max(0,
    50 + (change24h * 2) + (change7d * 0.5) + (change1h * 5)
  ));

  // Volume analysis
  const volSignal = volMcapRatio > 0.3 ? 'Very High' : volMcapRatio > 0.15 ? 'High' : volMcapRatio > 0.05 ? 'Normal' : 'Low';

  return {
    id:           c.id,
    name:         c.name,
    symbol:       c.symbol.toUpperCase(),
    price:        c.current_price || 0,
    marketCap:    c.market_cap || 0,
    volume24h:    c.total_volume || 0,
    change1h,
    change24h,
    change7d,
    circSupply:   c.circulating_supply || 0,
    totalSupply:  c.total_supply || 0,
    maxSupply:    c.max_supply || null,
    ath:          c.ath || 0,
    athDate:      c.ath_date ? new Date(c.ath_date).toLocaleDateString() : 'N/A',
    atl:          c.atl || 0,
    athDropPct:   athDropPct.toFixed(1),
    icon:         c.image,
    rank:         c.market_cap_rank || '?',
    sparkline:    c.sparkline_in_7d?.price || [],
    trustScore,
    riskLevel,
    momentum:     momentum.toFixed(0),
    volSignal,
    volMcapRatio: (volMcapRatio * 100).toFixed(1),
  };
}

// ── Render coin list ──────────────────────────────────────
function renderCoinIntelList(items) {
  const container = document.getElementById('coinintel-feed');
  if (!container) return;

  container.innerHTML = items.map((c, i) => {
    const cc = c.change24h >= 0 ? '#4ade80' : '#ef4444';
    const momentumColor = c.momentum > 60 ? '#4ade80' : c.momentum < 40 ? '#ef4444' : '#f0b90b';
    return `
      <div onclick="selectCoinIntel(${i})"
        style="cursor:pointer;display:flex;gap:12px;align-items:center;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02);transition:all 0.2s"
        onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.15)'"
        onmouseout="this.style.background='rgba(255,255,255,0.02)';this.style.borderColor='rgba(255,255,255,0.08)'">

        <!-- Icon + rank -->
        <div style="position:relative;flex-shrink:0">
          ${c.icon
            ? `<img src="${c.icon}" style="width:36px;height:36px;border-radius:50%">`
            : `<div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:bold">${c.symbol.substring(0,2)}</div>`
          }
          <span style="position:absolute;bottom:-2px;right:-4px;font-size:0.58rem;background:#1a1a2e;padding:1px 3px;border-radius:3px;color:var(--muted)">#${c.rank}</span>
        </div>

        <!-- Name + symbol -->
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:0.88rem">${c.name}</div>
          <div style="font-size:0.72rem;color:var(--muted)">${c.symbol} · ${c.trustScore} trust</div>
        </div>

        <!-- Sparkline mini -->
        <div style="flex-shrink:0">
          ${renderMiniSparkline(c.sparkline, c.change7d >= 0)}
        </div>

        <!-- Price + change -->
        <div style="text-align:right;flex-shrink:0">
          <div style="font-weight:700;font-size:0.9rem">$${formatPrice(c.price)}</div>
          <div style="font-size:0.78rem;color:${cc};font-weight:bold">${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%</div>
        </div>

        <!-- Momentum bar -->
        <div style="flex-shrink:0;text-align:center;width:36px">
          <div style="font-size:0.65rem;color:var(--muted);margin-bottom:2px">MOM</div>
          <div style="font-size:0.75rem;font-weight:bold;color:${momentumColor}">${c.momentum}</div>
        </div>
      </div>
    `;
  }).join('') || '<div class="empty-state"><p>No coins found</p></div>';
}

// ── Mini SVG sparkline ────────────────────────────────────
function renderMiniSparkline(prices, isUp) {
  if (!prices || prices.length < 2) return '<div style="width:60px;height:28px"></div>';
  const w = 60, h = 28;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const color = isUp ? '#4ade80' : '#ef4444';
  return `<svg width="${w}" height="${h}" style="display:block"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// ── Select coin → show full detail ────────────────────────
async function selectCoinIntel(idx) {
  _selectedIntel = _intelItems[idx];
  if (!_selectedIntel) return;

  // Inject detail panel into right panel if not present
  ensureIntelDetailPanel();

  const panel = document.getElementById('intel-detail-panel');
  if (panel) {
    panel.style.display = 'block';
    panel.innerHTML = '<div class="loading-overlay" style="position:relative;padding:40px 0;text-align:center"><span class="spinner"></span><p style="margin-top:10px;color:var(--muted)">Loading full analysis...</p></div>';
  }

  try {
    // Fetch detailed coin data + 30d price history in parallel
    const [detailRes, chartRes] = await Promise.allSettled([
      fetch(`https://api.coingecko.com/api/v3/coins/${_selectedIntel.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`),
      fetch(`https://api.coingecko.com/api/v3/coins/${_selectedIntel.id}/market_chart?vs_currency=usd&days=30&interval=daily`)
    ]);

    let detail = null, chartData = null;
    if (detailRes.status === 'fulfilled' && detailRes.value.ok) detail = await detailRes.value.json();
    if (chartRes.status  === 'fulfilled' && chartRes.value.ok)  chartData = await chartRes.value.json();

    renderCoinDetail(_selectedIntel, detail, chartData);
  } catch(e) {
    renderCoinDetail(_selectedIntel, null, null);
  }
}

// ── Ensure detail panel exists in DOM ─────────────────────
function ensureIntelDetailPanel() {
  if (document.getElementById('intel-detail-panel')) return;

  // Find the right panel in coinintel tab and inject detail panel before composer
  const rightPanel = document.querySelector('#mt-coinintel .right-panel');
  if (!rightPanel) return;

  const composerLabel = rightPanel.querySelector('.section-label');
  const div = document.createElement('div');
  div.id = 'intel-detail-panel';
  div.style.cssText = 'margin-bottom:20px';
  if (composerLabel) {
    rightPanel.insertBefore(div, composerLabel);
  } else {
    rightPanel.prepend(div);
  }
}

// ── Render full coin detail ───────────────────────────────
function renderCoinDetail(coin, detail, chartData) {
  const panel = document.getElementById('intel-detail-panel');
  if (!panel) return;

  const c = coin;
  const d = detail?.market_data || {};
  const cc = c.change24h >= 0 ? '#4ade80' : '#ef4444';

  // Extra data from detail endpoint
  const fdv       = d.fully_diluted_valuation?.usd || 0;
  const totalVol  = d.total_volume?.usd || c.volume24h;
  const communityScore = detail?.community_score || 0;
  const sentimentUp    = detail?.sentiment_votes_up_percentage || 50;
  const sentimentDown  = detail?.sentiment_votes_down_percentage || 50;
  const description    = detail?.description?.en
    ? detail.description.en.replace(/<[^>]*>/g,'').substring(0, 300) + '...'
    : null;

  // Supply analysis
  const supplyPct = c.maxSupply ? ((c.circSupply / c.maxSupply) * 100).toFixed(1) : null;

  // Generate chart HTML
  const chartId = 'intel-chart-' + c.id;

  panel.innerHTML = `
    <div class="section-label" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px">
        ${c.icon ? `<img src="${c.icon}" style="width:22px;height:22px;border-radius:50%">` : ''}
        ${c.name} Intelligence
      </div>
    </div>
    <div class="card" style="padding:16px">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
        <div>
          <div style="font-size:1.6rem;font-weight:800">$${formatPrice(c.price)}</div>
          <div style="display:flex;gap:12px;margin-top:4px">
            <span style="color:${cc};font-weight:bold;font-size:0.9rem">${c.change24h >= 0 ? '▲' : '▼'} ${Math.abs(c.change24h).toFixed(2)}% 24h</span>
            <span style="color:${c.change7d >= 0 ? '#4ade80' : '#ef4444'};font-size:0.8rem">${c.change7d >= 0 ? '▲' : '▼'} ${Math.abs(c.change7d).toFixed(2)}% 7d</span>
            <span style="color:${c.change1h >= 0 ? '#4ade80' : '#ef4444'};font-size:0.8rem">${c.change1h >= 0 ? '▲' : '▼'} ${Math.abs(c.change1h).toFixed(2)}% 1h</span>
          </div>
        </div>
        <div style="text-align:right">
          <span style="padding:4px 10px;border-radius:6px;font-size:0.72rem;font-weight:bold;
            background:${c.trustScore==='HIGH'?'rgba(74,222,128,0.15)':c.trustScore==='MEDIUM'?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)'};
            color:${c.trustScore==='HIGH'?'#4ade80':c.trustScore==='MEDIUM'?'#f59e0b':'#ef4444'}">
            ${c.trustScore} TRUST
          </span><br>
          <span style="font-size:0.72rem;color:var(--muted);margin-top:4px;display:inline-block">Rank #${c.rank}</span>
        </div>
      </div>

      <!-- 30 Day Price Chart -->
      <div style="margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:8px">📈 30-Day Price Chart</div>
        <div style="position:relative;height:120px;background:rgba(255,255,255,0.02);border-radius:8px;overflow:hidden">
          <canvas id="${chartId}" style="width:100%;height:120px"></canvas>
          ${!chartData ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.8rem">Chart unavailable</div>' : ''}
        </div>
      </div>

      <!-- Key metrics grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${statItem('Market Cap',   '$'+fmtNum(c.marketCap))}
        ${statItem('24h Volume',   '$'+fmtNum(c.volume24h))}
        ${statItem('Vol/MCap',     c.volMcapRatio+'%',  c.volMcapRatio > 20 ? '#4ade80' : '')}
        ${statItem('FDV',          fdv ? '$'+fmtNum(fdv) : 'N/A')}
        ${statItem('ATH',          '$'+formatPrice(c.ath))}
        ${statItem('From ATH',     '-'+c.athDropPct+'%', '#ef4444')}
        ${statItem('Circ. Supply', fmtNum(c.circSupply)+' '+c.symbol)}
        ${supplyPct ? statItem('Supply Used', supplyPct+'%', supplyPct > 80 ? '#f59e0b' : '#4ade80') : statItem('Max Supply', c.maxSupply ? fmtNum(c.maxSupply) : '∞')}
      </div>

      <!-- Sentiment bar -->
      <div style="margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">Community Sentiment</div>
        <div style="display:flex;border-radius:20px;overflow:hidden;height:8px">
          <div style="width:${sentimentUp}%;background:#4ade80;transition:width 0.5s"></div>
          <div style="width:${sentimentDown}%;background:#ef4444"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.7rem">
          <span style="color:#4ade80">▲ ${sentimentUp.toFixed(0)}% Bullish</span>
          <span style="color:#ef4444">▼ ${sentimentDown.toFixed(0)}% Bearish</span>
        </div>
      </div>

      <!-- Momentum score -->
      <div style="margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">Momentum Score</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;background:rgba(255,255,255,0.06);border-radius:20px;height:8px;overflow:hidden">
            <div style="width:${c.momentum}%;height:100%;background:${c.momentum>60?'#4ade80':c.momentum<40?'#ef4444':'#f0b90b'};border-radius:20px;transition:width 0.5s"></div>
          </div>
          <span style="font-weight:bold;font-size:0.88rem;color:${c.momentum>60?'#4ade80':c.momentum<40?'#ef4444':'#f0b90b'};min-width:32px">${c.momentum}/100</span>
        </div>
      </div>

      <!-- Volume signal -->
      <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:16px;font-size:0.82rem">
        <strong>Volume Signal:</strong> <span style="color:${c.volSignal==='Very High'||c.volSignal==='High'?'#4ade80':'var(--muted)'}">${c.volSignal}</span>
        &nbsp;·&nbsp;
        <strong>Risk:</strong> <span style="color:${c.riskLevel==='LOW'?'#4ade80':c.riskLevel==='MEDIUM'?'#f59e0b':'#ef4444'}">${c.riskLevel}</span>
        &nbsp;·&nbsp;
        <strong>ATH Date:</strong> <span style="color:var(--muted)">${c.athDate}</span>
      </div>

      ${description ? `
      <!-- Description -->
      <div style="margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px">About ${c.name}</div>
        <p style="font-size:0.8rem;line-height:1.6;color:rgba(255,255,255,0.65);margin:0">${description}</p>
      </div>` : ''}

      <!-- Generate post button -->
      <button onclick="generateIntelPost()" class="btn-generate" style="width:100%;margin-top:4px">
        ✨ Generate Analysis Post
      </button>
    </div>
  `;

  // Draw chart after DOM update
  if (chartData?.prices?.length) {
    requestAnimationFrame(() => drawIntelChart(chartId, chartData.prices, c.change24h >= 0));
  }
}

// ── Draw chart using Canvas ───────────────────────────────
function drawIntelChart(canvasId, prices, isUp) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  canvas.width  = canvas.offsetWidth  || canvas.parentElement.offsetWidth  || 300;
  canvas.height = canvas.offsetHeight || 120;

  const ctx  = canvas.getContext('2d');
  const w    = canvas.width;
  const h    = canvas.height;
  const vals = prices.map(p => p[1]);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const rng  = max - min || 1;
  const pad  = { t:8, b:20, l:4, r:4 };

  ctx.clearRect(0, 0, w, h);

  const color = isUp ? '#4ade80' : '#ef4444';

  // Gradient fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, isUp ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  const xStep = (w - pad.l - pad.r) / (vals.length - 1);
  const toY   = v => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / rng);

  // Fill path
  ctx.beginPath();
  ctx.moveTo(pad.l, h - pad.b);
  vals.forEach((v, i) => ctx.lineTo(pad.l + i * xStep, toY(v)));
  ctx.lineTo(pad.l + (vals.length-1) * xStep, h - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = pad.l + i * xStep, y = toY(v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // X-axis labels (start / mid / end dates)
  ctx.fillStyle   = 'rgba(255,255,255,0.3)';
  ctx.font        = '9px monospace';
  ctx.textAlign   = 'left';
  const startDate = new Date(prices[0][0]).toLocaleDateString('en',{month:'short',day:'numeric'});
  const midDate   = new Date(prices[Math.floor(prices.length/2)][0]).toLocaleDateString('en',{month:'short',day:'numeric'});
  const endDate   = new Date(prices[prices.length-1][0]).toLocaleDateString('en',{month:'short',day:'numeric'});
  ctx.fillText(startDate, pad.l, h - 4);
  ctx.textAlign = 'center';
  ctx.fillText(midDate, w/2, h - 4);
  ctx.textAlign = 'right';
  ctx.fillText(endDate, w - pad.r, h - 4);
}

// ── Generate AI post for selected coin ───────────────────
async function generateIntelPost() {
  if (!_selectedIntel) { showToast('info','ℹ','Select a coin first'); return; }

  const btn = document.querySelector('#intel-detail-panel .btn-generate') ||
              document.querySelector('[onclick="generateIntelPost()"]');
  if (btn) { btn.innerHTML='<span class="spinner"></span> Analyzing...'; btn.style.pointerEvents='none'; }

  const c = _selectedIntel;
  try {
    const prompt = `Write a detailed Binance Square post for this coin analysis:

Coin: ${c.name} (${c.symbol})
Price: $${formatPrice(c.price)}
24h Change: ${c.change24h >= 0 ? '+' : ''}${c.change24h.toFixed(2)}%
7d Change: ${c.change7d >= 0 ? '+' : ''}${c.change7d.toFixed(2)}%
Market Cap: $${fmtNum(c.marketCap)}
Volume 24h: $${fmtNum(c.volume24h)}
Volume Signal: ${c.volSignal}
Momentum Score: ${c.momentum}/100
Trust Score: ${c.trustScore}
Risk Level: ${c.riskLevel}
From ATH: -${c.athDropPct}%
Supply Circulating: ${fmtNum(c.circSupply)} / ${c.maxSupply ? fmtNum(c.maxSupply) : '∞'}

Write an engaging post (400-500 chars):
- Give a clear bullish/bearish/neutral stance
- Highlight key strengths and risks
- Provide actionable insights for traders
- Suggest who might be interested in this coin (e.g. "good for long-term holders", "potential swing trade", etc.)
- Mention key numbers with a bit of flair (e.g. "surging with a 75 momentum score", "facing resistance after dropping 30% from ATH", etc.)
- Mention entry/exit points if relevant (e.g. "watch for a bounce at $X", "could see a breakout above $Y", etc.)
- Use emojis
- Add hashtags: #${c.symbol} #CryptoAnalysis #Binance

Write ONLY the post.`;

    const post = await callClaude('You are a professional crypto analyst on Binance Square.', prompt, false);
    loadComposer(post);
    showToast('success','🔍','Intel post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (btn) { btn.innerHTML='✨ Generate Analysis Post'; btn.style.pointerEvents=''; }
}

// ── Helpers ───────────────────────────────────────────────
function statItem(label, val, color) {
  return `
    <div style="padding:8px;background:rgba(255,255,255,0.04);border-radius:6px">
      <div style="font-size:0.68rem;color:var(--muted);margin-bottom:2px">${label}</div>
      <div style="font-size:0.82rem;font-weight:bold${color?';color:'+color:''}">${val}</div>
    </div>`;
}

function fmtNum(n) {
  const num = parseFloat(n) || 0;
  if (num >= 1e12) return (num/1e12).toFixed(2)+'T';
  if (num >= 1e9)  return (num/1e9).toFixed(2)+'B';
  if (num >= 1e6)  return (num/1e6).toFixed(2)+'M';
  if (num >= 1e3)  return (num/1e3).toFixed(2)+'K';
  return num.toFixed(2);
}

function formatPrice(p) {
  const n = parseFloat(p) || 0;
  if (n >= 1000)   return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (n >= 1)      return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(4);
}
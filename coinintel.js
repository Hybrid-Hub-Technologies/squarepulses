// ============================================================
// coinintel.js — Coin Intelligence Tab
// Full report: technicals + fundamentals + social + bull/bear
// ============================================================

let _intelCoin   = null;
let _intelReport = null;

async function loadCoinIntelTab() {
  // Tab is ready — waiting for user input
  const input = document.getElementById('intelSearchInput');
  if (input) input.focus();
}

async function runCoinIntel() {
  const kw = document.getElementById('intelSearchInput')?.value?.trim();
  if (!kw) { showToast('info','🔍','Enter a coin name or symbol'); return; }

  const btn     = document.getElementById('intelSearchBtn');
  const output  = document.getElementById('intel-output');
  if (btn)    { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Analyzing...'; }
  if (output) output.innerHTML = `
    <div class="loading-overlay" style="padding:60px;flex-direction:column;gap:16px">
      <span class="spinner" style="width:32px;height:32px;border-width:3px"></span>
      <div style="color:var(--muted);font-size:0.85rem">Running full analysis for <strong>${kw}</strong>...<br>
      Fetching price data, news, social sentiment...</div>
    </div>`;

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

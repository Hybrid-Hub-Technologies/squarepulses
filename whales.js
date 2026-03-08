// ============================================================
// whales.js — Whale Movements
// Data from /api/proxy?type=whales (no CORS, real on-chain data)
// Sources: Whale Alert (if key) + Bitcoin blockchain + Ethereum + CoinGecko
// ============================================================

let _whaleItems   = [];
let _selectedWhale = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadWhalesTab() {
  const container = document.getElementById('whales-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Scanning whale movements...</div>';

  try {
    // Pass optional API keys from SP so proxy can use them
    const waKey  = (window.SP?.waKey  || '');
    const ethKey = (window.SP?.ethKey || '');
    const params = new URLSearchParams({ type: 'whales' });
    if (waKey)  params.append('waKey',  waKey);
    if (ethKey) params.append('ethKey', ethKey);

    const res  = await fetch(`/api/proxy?${params}`);
    const data = await res.json();

    if (!data.success || !data.data?.length) throw new Error(data.message || 'No whale data');

    _whaleItems = data.data;
    renderWhalesFeed(_whaleItems);

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🐋</div>
        <p>Could not load whale data.<br><small>${e.message}</small></p>
      </div>`;
  }
}

// ── Render feed ───────────────────────────────────────────
function renderWhalesFeed(items) {
  const container = document.getElementById('whales-feed');
  if (!container) return;

  // Stats bar
  const bullish = items.filter(w => w.impact === 'BULLISH').length;
  const bearish = items.filter(w => w.impact === 'BEARISH').length;
  const totalUsd = items.reduce((s, w) => s + (w.usdValueRaw || 0), 0);

  const statsBar = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
      <div style="padding:10px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:8px;text-align:center">
        <div style="font-size:1.1rem;font-weight:bold;color:#4ade80">${bullish}</div>
        <div style="font-size:0.7rem;color:var(--muted)">Bullish Moves</div>
      </div>
      <div style="padding:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;text-align:center">
        <div style="font-size:1.1rem;font-weight:bold;color:#ef4444">${bearish}</div>
        <div style="font-size:0.7rem;color:var(--muted)">Bearish Moves</div>
      </div>
      <div style="padding:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;text-align:center">
        <div style="font-size:1.1rem;font-weight:bold">$${fmtNum(totalUsd)}</div>
        <div style="font-size:0.7rem;color:var(--muted)">Total Volume</div>
      </div>
    </div>`;

  const impactColor = { BULLISH:'#4ade80', BEARISH:'#ef4444', NEUTRAL:'#94a3b8' };
  const typeIcon    = { EXCHANGE_IN:'📤', EXCHANGE_OUT:'📥', TRANSFER:'🔄', MINT:'🆕', BURN:'🔥' };

  const html = items.map((w, i) => `
    <div id="wh-${w.id}" onclick="selectWhale('${w.id}')"
      style="cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:10px;background:rgba(255,255,255,0.02);transition:background 0.2s"
      onmouseover="this.style.background='rgba(255,255,255,0.05)'"
      onmouseout="this.style.background='rgba(255,255,255,0.02)'">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <h3 style="margin:0;font-size:0.9rem">
            ${typeIcon[w.type]||'🔄'} ${w.coin} 
            <span style="font-size:0.75rem;color:var(--muted);font-weight:normal">${w.type.replace('_',' ')}</span>
          </h3>
          <p style="margin:3px 0;color:var(--muted);font-size:0.75rem">${w.source} • ${whaleTimeLabel(w.time)}</p>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:10px">
          <div style="font-weight:bold;color:#f0b90b;font-size:0.9rem">${w.usdValue}</div>
          <div style="font-size:0.72rem;color:var(--muted)">${w.amount}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <p style="margin:0;font-size:0.78rem;color:var(--muted);flex:1">${w.from} → ${w.to}</p>
        <span style="font-size:0.7rem;font-weight:bold;padding:2px 8px;border-radius:10px;
          color:${impactColor[w.impact]||'#94a3b8'};
          background:${w.impact==='BULLISH'?'rgba(74,222,128,0.1)':w.impact==='BEARISH'?'rgba(239,68,68,0.1)':'rgba(148,163,184,0.1)'};
          border:1px solid ${impactColor[w.impact]||'#94a3b8'}40;margin-left:8px">
          ${w.impact}
        </span>
      </div>
    </div>
  `).join('');

  container.innerHTML = statsBar + (html || '<div class="empty-state"><p>No whale transactions found</p></div>');
}

// ── Select whale ──────────────────────────────────────────
function selectWhale(id) {
  // Remove previous selection highlight
  document.querySelectorAll('[id^="wh-"]').forEach(el => el.style.borderColor = 'rgba(255,255,255,0.08)');
  const el = document.getElementById('wh-' + id);
  if (el) el.style.borderColor = 'rgba(240,185,11,0.4)';

  _selectedWhale = _whaleItems.find(w => w.id == id);
  if (!_selectedWhale) return;

  const preview = document.getElementById('whale-preview');
  if (!preview) return;

  const w = _selectedWhale;
  const impactColor = { BULLISH:'#4ade80', BEARISH:'#ef4444', NEUTRAL:'#94a3b8' };
  const typeIcon    = { EXCHANGE_IN:'📤', EXCHANGE_OUT:'📥', TRANSFER:'🔄', MINT:'🆕', BURN:'🔥' };

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      <h3 style="margin:0 0 4px 0">${typeIcon[w.type]||'🔄'} ${w.amount}</h3>
      <p style="color:var(--muted);font-size:0.8rem;margin:0 0 12px 0">${w.source} • ${whaleTimeLabel(w.time)}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">USD Value</small><br>
          <strong style="color:#f0b90b">${w.usdValue}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Impact</small><br>
          <strong style="color:${impactColor[w.impact]||'#94a3b8'}">${w.impact}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Type</small><br>
          <strong>${w.type.replace('_',' ')}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Network</small><br>
          <strong>${w.coin}</strong>
        </div>
      </div>

      <div style="font-size:0.78rem;color:var(--muted);margin-bottom:4px">From:</div>
      <code style="font-size:0.72rem;color:var(--text);word-break:break-all">${w.from}</code>
      <div style="font-size:0.78rem;color:var(--muted);margin:8px 0 4px 0">To:</div>
      <code style="font-size:0.72rem;color:var(--text);word-break:break-all">${w.to}</code>

      <div style="margin-top:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:0.82rem;line-height:1.5">
        ${w.analysis}
      </div>

      ${w.explorerUrl
        ? `<a href="${w.explorerUrl}" target="_blank"
             style="display:inline-block;margin-top:10px;font-size:0.78rem;color:var(--accent);text-decoration:none">
             🔗 View on Explorer →
           </a>`
        : ''
      }
    </div>
  `;
}

// ── Generate post via Groq ────────────────────────────────
async function generateWhalePost() {
  if (!_selectedWhale) { showToast('info','🐋','Select a whale movement first'); return; }

  const btn = document.getElementById('whaleGenBtn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Analyzing...'; }

  const w = _selectedWhale;
  try {
    const prompt = `Write an urgent Binance Square post about this whale movement:

Amount: ${w.amount} (${w.usdValue})
Type: ${w.type.replace('_',' ')}
From: ${w.from} → To: ${w.to}
Market Impact: ${w.impact}
Analysis: ${w.analysis}

Rules:
- Max 400 characters
- Use 🐋 emoji
- Be urgent and attention-grabbing
- Explain market impact clearly
- End with hashtags: #WhaleAlert #${w.coin} #Crypto #OnChain

Write ONLY the post.`;

    const post = await callClaude(
      'You are a blockchain analyst breaking whale movement news on Binance Square.',
      prompt,
      false
    );
    loadComposer(post);
    showToast('success','🐋','Whale post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (btn) { btn.disabled=false; btn.innerHTML='✨ Generate Post'; }
}

// ── Helpers ───────────────────────────────────────────────
function whaleTimeLabel(timeStr) {
  if (!timeStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(timeStr)) / 60000);
  if (isNaN(diff) || diff < 0) return 'Just now';
  if (diff < 1)   return 'Just now';
  if (diff < 60)  return diff + 'm ago';
  if (diff < 1440)return Math.floor(diff/60) + 'h ago';
  return Math.floor(diff/1440) + 'd ago';
}

function fmtNum(n) {
  const num = parseFloat(n) || 0;
  if (num >= 1e9) return (num/1e9).toFixed(2)+'B';
  if (num >= 1e6) return (num/1e6).toFixed(2)+'M';
  if (num >= 1e3) return (num/1e3).toFixed(2)+'K';
  return num.toFixed(2);
}
// ============================================================
// xfeed.js — X / Social Feed Tab
// Data from /api/proxy?type=xfeed (CryptoPanic via proxy)
// Real crypto news posts with community sentiment scores
// ============================================================

let _xfeedItems = [];
let _selectedX  = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadXfeedTab() {
  const container = document.getElementById('xfeed-container');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading crypto social feed...</div>';

  try {
    const cpKey  = window.SP?.cpKey || '';
    const params = new URLSearchParams({ type: 'xfeed' });
    if (cpKey) params.append('cpKey', cpKey);

    const res  = await fetch(`http://localhost:5000/api/proxy?${params}`);
    const data = await res.json();

    if (!data.success || !data.data?.length) throw new Error(data.message || 'No posts available');

    _xfeedItems = data.data;
    renderXFeed(_xfeedItems);

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🐦</div>
        <p>Could not load feed.<br><small>${e.message}</small></p>
        <button class="btn btn-ghost" style="margin-top:16px"
          onclick="window._xfeedLoaded=false;loadXfeedTab()">🔄 Retry</button>
      </div>`;
  }
}

// ── Render feed ───────────────────────────────────────────
function renderXFeed(items) {
  const container = document.getElementById('xfeed-container');
  if (!container) return;

  const effectColor = { BULLISH:'#4ade80', BEARISH:'#ef4444', NEUTRAL:'#94a3b8' };
  const impactBg    = {
    HIGH:   'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#ef4444',
    MEDIUM: 'background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#f59e0b',
    LOW:    'background:rgba(148,163,184,0.1);border:1px solid rgba(148,163,184,0.2);color:#94a3b8',
  };

  container.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px">` +
    items.map(item => `
      <div id="xp-${item.id}"
        onclick="selectXPost('${item.id}')"
        style="cursor:pointer;padding:14px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:rgba(255,255,255,0.02);transition:all 0.2s"
        onmouseover="this.style.background='rgba(255,255,255,0.05)';this.style.borderColor='rgba(255,255,255,0.15)'"
        onmouseout="this.style.background='rgba(255,255,255,0.02)';this.style.borderColor='rgba(255,255,255,0.08)'">

        <!-- Header row -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <div style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">
            ${item.emoji}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:0.88rem">${item.author}</div>
            <div style="font-size:0.73rem;color:var(--muted)">@${item.handle} · ${item.time}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            <span style="font-size:0.65rem;font-weight:bold;padding:2px 7px;border-radius:4px;${impactBg[item.impact]||impactBg.LOW}">
              ${item.impact}
            </span>
            <span style="font-size:0.7rem;font-weight:700;color:${effectColor[item.marketEffect]||'#94a3b8'}">
              ${item.marketEffect}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div style="font-size:0.85rem;line-height:1.5;margin-bottom:10px;color:rgba(255,255,255,0.9)">
          ${item.content}
        </div>

        <!-- Analysis bar -->
        <div style="font-size:0.78rem;color:var(--muted);padding:8px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:8px">
          💡 ${item.analysis}
        </div>

        <!-- Footer: coin tag + votes -->
        <div style="display:flex;align-items:center;justify-content:space-between">
          ${item.coin !== 'General'
            ? `<span style="font-size:0.72rem;padding:2px 8px;background:rgba(240,185,11,0.15);border:1px solid rgba(240,185,11,0.3);border-radius:10px;color:#f0b90b">$${item.coin}</span>`
            : '<span></span>'
          }
          ${item.votes?.total > 0
            ? `<div style="display:flex;gap:10px;font-size:0.72rem;color:var(--muted)">
                 <span style="color:#4ade80">▲ ${item.votes.bullish}</span>
                 <span style="color:#ef4444">▼ ${item.votes.bearish}</span>
               </div>`
            : ''
          }
        </div>
      </div>
    `).join('') + `</div>`;
}

// ── Select post ───────────────────────────────────────────
function selectXPost(id) {
  // Highlight selected
  document.querySelectorAll('[id^="xp-"]').forEach(el => {
    el.style.borderColor = 'rgba(255,255,255,0.08)';
    el.style.background  = 'rgba(255,255,255,0.02)';
  });
  const el = document.getElementById('xp-' + id);
  if (el) { el.style.borderColor = 'rgba(240,185,11,0.4)'; el.style.background = 'rgba(240,185,11,0.04)'; }

  _selectedX = _xfeedItems.find(p => p.id === id);
  if (!_selectedX) return;

  const preview = document.getElementById('xfeed-preview');
  if (!preview) return;

  const p = _selectedX;
  const effectColor = { BULLISH:'#4ade80', BEARISH:'#ef4444', NEUTRAL:'#94a3b8' };

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      <!-- Author -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
          ${p.emoji}
        </div>
        <div>
          <div style="font-weight:700">${p.author}</div>
          <div style="font-size:0.75rem;color:var(--muted)">@${p.handle} · ${p.time}</div>
        </div>
      </div>

      <!-- Post content -->
      <div style="font-size:0.88rem;line-height:1.6;padding:12px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:12px;border-left:3px solid rgba(240,185,11,0.4)">
        "${p.content}"
      </div>

      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Market Effect</small><br>
          <strong style="color:${effectColor[p.marketEffect]||'#94a3b8'}">${p.marketEffect}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Impact Level</small><br>
          <strong>${p.impact}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Coin</small><br>
          <strong style="color:#f0b90b">${p.coin}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Community Votes</small><br>
          <strong><span style="color:#4ade80">▲${p.votes?.bullish||0}</span> / <span style="color:#ef4444">▼${p.votes?.bearish||0}</span></strong>
        </div>
      </div>

      <!-- Analysis -->
      <div style="font-size:0.82rem;color:rgba(255,255,255,0.7);line-height:1.6;padding:10px;background:rgba(255,255,255,0.03);border-radius:6px">
        ${p.analysis}
      </div>

      ${p.url && p.url !== '#'
        ? `<a href="${p.url}" target="_blank" style="display:inline-block;margin-top:10px;font-size:0.78rem;color:var(--accent);text-decoration:none">→ Read Full Article</a>`
        : ''
      }
    </div>
  `;
}

// ── Generate post via Groq ────────────────────────────────
async function generateXPost() {
  if (!_selectedX) { showToast('info','🐦','Select a post first'); return; }

  const btn = document.getElementById('xGenBtn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Analyzing...'; }

  const p = _selectedX;
  try {
    const prompt = `Write a Binance Square post reacting to this crypto news/social post:

Source: @${p.handle} (${p.author})
Post: "${p.content}"
Market Sentiment: ${p.marketEffect}
Community: ${p.votes?.bullish||0} bullish vs ${p.votes?.bearish||0} bearish votes
Analysis: ${p.analysis}
Related coin: ${p.coin}

Rules:
- Max 400 characters
- Explain what this means for the market
- Use emojis
- Professional but engaging tone
- End with 2-3 hashtags like #${p.coin !== 'General' ? p.coin : 'Crypto'} #BinanceSquare

Write ONLY the post.`;

    const post = await callClaude(
      'You are a crypto analyst on Binance Square writing reaction posts to trending crypto news.',
      prompt,
      false
    );
    loadComposer(post);
    showToast('success','🐦','X post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (btn) { btn.disabled=false; btn.innerHTML='✨ Generate Post'; }
}
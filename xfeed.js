// ============================================================
// xfeed.js — X (Twitter) Feed Tab
// Latest posts from CZ, Vitalik, and top crypto voices
// Market impact analysis per tweet
// ============================================================

let _xPosts       = [];
let _selectedPost = null;

const TRACKED_ACCOUNTS = [
  { handle: 'cz_binance',    name: 'CZ',           emoji: '👑', color: '#f0b90b' },
  { handle: 'VitalikButerin',name: 'Vitalik',       emoji: '🦄', color: '#627eea' },
  { handle: 'elonmusk',      name: 'Elon Musk',     emoji: '🚀', color: '#1d9bf0' },
  { handle: 'SBF_FTX',       name: 'Crypto News',   emoji: '📰', color: '#00d084' },
  { handle: 'michael_saylor',name: 'Saylor',        emoji: '🏦', color: '#ff8c00' },
  { handle: 'CryptoHayes',   name: 'Hayes',         emoji: '📊', color: '#9945ff' },
];

async function loadXFeedTab() {
  const container = document.getElementById('xfeed-container');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Fetching crypto X posts...</div>';

  try {
    const raw = await callClaude(
      `You are a crypto social media analyst. Search for the latest impactful posts/tweets from major crypto figures.
Return ONLY a raw JSON array. No markdown, no backticks.
Each item: { "id":number, "author":string, "handle":string, "emoji":string, "content":string(actual tweet content, max 200 chars), "time":string, "impact":string(HIGH/MEDIUM/LOW), "marketEffect":string(BULLISH/BEARISH/NEUTRAL), "analysis":string(1-2 sentences on market impact), "coin":string(most relevant coin or "General") }
Return 10 items from: CZ (cz_binance), Vitalik Buterin, Elon Musk, Michael Saylor, or other top crypto influencers.`,
      'Find the latest impactful tweets/posts from CZ, Vitalik Buterin, Elon Musk, Michael Saylor and other major crypto influencers from the past 24 hours.',
      true
    );

    let items;
    try {
      const clean = raw.replace(/```json|```/g,'').trim();
      items = JSON.parse(clean);
    } catch(e) {
      const match = raw.match(/\[[\s\S]*\]/);
      items = match ? JSON.parse(match[0]) : [];
    }

    if (!items?.length) throw new Error('No posts found');
    _xPosts = items;
    renderXFeed(items);

  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🐦</div>
      <p>Could not load X feed.<br><small>${e.message}</small></p>
      <button class="btn btn-ghost" style="margin-top:16px" onclick="window._xfeedLoaded=false;loadXFeedTab()">Retry</button></div>`;
  }
}

function renderXFeed(items) {
  const container = document.getElementById('xfeed-container');
  if (!container) return;

  const effectColor = { BULLISH:'var(--green)', BEARISH:'var(--red)', NEUTRAL:'var(--muted)' };
  const impactBg    = { HIGH:'impact-high', MEDIUM:'impact-medium', LOW:'impact-low' };

  const html = items.map(item => `
    <div class="x-card" id="xp-${item.id}" onclick="selectXPost(${item.id})">
      <div class="x-header">
        <div class="x-avatar">${item.emoji || '🐦'}</div>
        <div>
          <div class="x-name">${item.author}</div>
          <div class="x-handle">@${item.handle} · ${item.time}</div>
        </div>
        <div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="nc-impact ${impactBg[item.impact]}">${item.impact}</span>
          <span style="font-size:0.7rem;font-weight:700;color:${effectColor[item.marketEffect]}">${item.marketEffect}</span>
        </div>
      </div>
      <div class="x-content">${item.content}</div>
      <div class="x-impact-bar">
        💡 <span style="color:${effectColor[item.marketEffect]}">${item.analysis}</span>
      </div>
      ${item.coin !== 'General' ? `<div style="margin-top:8px"><span class="chain-badge chain-bsc">$${item.coin}</span></div>` : ''}
    </div>`).join('');

  container.innerHTML = `<div class="xfeed-list fade-up">${html}</div>`;
}

function selectXPost(id) {
  document.querySelectorAll('.x-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('xp-' + id)?.classList.add('selected');
  _selectedPost = _xPosts.find(p => p.id === id);

  if (!_selectedPost) return;
  const preview = document.getElementById('xfeed-preview');
  if (preview) {
    const p = _selectedPost;
    const effectColor = { BULLISH:'green', BEARISH:'red', NEUTRAL:'' };
    preview.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div class="x-avatar" style="width:42px;height:42px;font-size:1.2rem">${p.emoji}</div>
        <div>
          <div style="font-weight:700">${p.author}</div>
          <div style="font-size:0.73rem;color:var(--muted)">@${p.handle}</div>
        </div>
      </div>
      <div style="font-size:0.85rem;line-height:1.6;padding:12px;background:var(--surface);border-radius:8px;margin-bottom:12px">"${p.content}"</div>
      <div class="detail-grid" style="margin-top:0">
        ${statBox('Market Effect', p.marketEffect, effectColor[p.marketEffect]||'')}
        ${statBox('Impact', p.impact, p.impact==='HIGH'?'red':p.impact==='MEDIUM'?'gold':'green')}
        ${statBox('Coin', p.coin, 'gold')}
        ${statBox('Time', p.time, '')}
      </div>
      <div style="margin-top:10px;font-size:0.82rem;color:var(--muted);line-height:1.6">${p.analysis}</div>`;
  }
}

async function generateXPost() {
  if (!_selectedPost) { showToast('info','🐦','Select a tweet first'); return; }

  const btn = document.getElementById('xGenBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Analyzing...'; }

  const p = _selectedPost;
  try {
    const post = await callClaude(
      `You are a crypto analyst on Binance Square. Write a reaction post to the given tweet from a crypto influencer.
Explain what it means for the market. Max 500 chars. Use emojis. Professional but engaging tone. End with hashtags.`,
      `Tweet by @${p.handle} (${p.author}):
"${p.content}"

Market Effect: ${p.marketEffect}
Analysis: ${p.analysis}
Related coin: ${p.coin}

Write a Binance Square post reacting to this tweet and its market impact.`,
      false
    );
    loadComposer(post);
    showToast('success','✨','Post generated!');
  } catch(e) {
    showToast('error','❌','Generation failed');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '✨ Generate Post'; }
}

// ── Custom account watcher ────────────────────────────────
async function loadAccountFeed(handle) {
  if (!handle?.trim()) return;
  const container = document.getElementById('xfeed-container');
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading @' + handle + ' posts...</div>';

  try {
    const raw = await callClaude(
      `Search for recent posts from @${handle} on X/Twitter related to crypto. Return JSON array only.
Each: { "id":number, "author":string, "handle":"${handle}", "emoji":"🐦", "content":string, "time":string, "impact":string, "marketEffect":string, "analysis":string, "coin":string }
Return 6 items.`,
      `Find recent posts from @${handle} on X/Twitter about cryptocurrency.`,
      true
    );
    let items;
    try { items = JSON.parse(raw.replace(/```json|```/g,'').trim()); }
    catch(e) { const m = raw.match(/\[[\s\S]*\]/); items = m ? JSON.parse(m[0]) : []; }
    _xPosts = items;
    renderXFeed(items);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚠</div><p>Error loading @${handle}</p></div>`;
  }
}

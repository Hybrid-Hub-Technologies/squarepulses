// ============================================================
// news.js — Crypto News Tab
// Sources: CoinGecko (free) + CryptoPanic (free key) + RSS feeds
// Post generation: Groq AI
// ============================================================

let _newsItems    = [];
let _selectedNews = null;

// RSS → CORS proxy (free public proxy)
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';
const RSS_FEEDS = [
  { name: 'CoinDesk',      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt',       url: 'https://decrypt.co/feed' },
];

// ── Load Tab ──────────────────────────────────────────────
async function loadNewsTab() {
  const container = document.getElementById('news-feed');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Fetching latest crypto news from multiple sources...</div>';

  try {
    const [geckoRes, panicRes, rssRes] = await Promise.allSettled([
      fetchCoinGeckoNews(),
      fetchCryptoPanicNews(),
      fetchRSSNews(),
    ]);

    let all = [];
    if (geckoRes.status === 'fulfilled') all = all.concat(geckoRes.value);
    if (panicRes.status === 'fulfilled') all = all.concat(panicRes.value);
    if (rssRes.status   === 'fulfilled') all = all.concat(rssRes.value);

    if (!all.length) throw new Error('No news from any source — check internet connection');

    const deduped = deduplicateNews(all);
    _newsItems = deduped.slice(0, 24).map((item, i) => ({ ...item, id: i + 1 }));
    renderNewsGrid(_newsItems);

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📰</div>
        <p>Could not load news.<br><small style="color:var(--red)">${e.message}</small></p>
        <button class="btn btn-ghost" style="margin-top:16px" onclick="window._newsLoaded=false;loadNewsTab()">🔄 Retry</button>
      </div>`;
  }
}

// ── Source 1: CoinGecko News (no key needed) ─────────────
async function fetchCoinGeckoNews() {
  const res = await fetch('https://api.coingecko.com/api/v3/news?per_page=20');
  if (!res.ok) throw new Error('CoinGecko news failed');
  const data = await res.json();
  const items = data.data || data || [];
  return items.map(item => ({
    source:   'CoinGecko',
    title:    item.title || item.news_title || '',
    summary:  stripHtml(item.description || item.text || '').substring(0, 200),
    url:      item.url || item.news_url || '',
    time:     item.created_at || item.published_at || '',
    category: guessCategory(item.title + ' ' + (item.description || '')),
    impact:   guessImpact(item.title + ' ' + (item.description || '')),
    bullish:  guessBullish(item.title + ' ' + (item.description || '')),
  })).filter(n => n.title);
}

// ── Source 2: CryptoPanic (optional free key) ─────────────
async function fetchCryptoPanicNews() {
  const key = localStorage.getItem('sq_cp_key') || '';
  // Public endpoint — works without key but limited
  const url = `https://cryptopanic.com/api/free/v1/posts/?public=true&kind=news${key ? '&auth_token='+key : ''}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error('CryptoPanic failed');
  const data = await res.json();
  return (data.results || []).map(item => ({
    source:   'CryptoPanic',
    title:    item.title || '',
    summary:  item.title || '',
    url:      item.url || '',
    time:     item.published_at || item.created_at || '',
    category: item.currencies?.length ? item.currencies[0].code : guessCategory(item.title),
    impact:   (item.votes?.important || 0) > 5 ? 'HIGH' : (item.votes?.liked || 0) > 3 ? 'MEDIUM' : 'LOW',
    bullish:  (item.votes?.liked || 0) >= (item.votes?.disliked || 0),
  })).filter(n => n.title);
}

// ── Source 3: RSS Feeds via rss2json.com (free) ───────────
async function fetchRSSNews() {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(feed =>
      fetch(`${RSS_PROXY}${encodeURIComponent(feed.url)}&count=8`)
        .then(r => r.json())
        .then(data => (data.items || []).map(item => ({
          source:   feed.name,
          title:    item.title || '',
          summary:  stripHtml(item.description || item.content || '').substring(0, 200),
          url:      item.link || '',
          time:     item.pubDate || '',
          category: guessCategory(item.title + ' ' + (item.description || '')),
          impact:   guessImpact(item.title),
          bullish:  guessBullish(item.title + ' ' + (item.description || '')),
        })).filter(n => n.title))
    )
  );
  let all = [];
  results.forEach(r => { if (r.status === 'fulfilled') all = all.concat(r.value); });
  return all;
}

// ── Deduplicate by title ──────────────────────────────────
function deduplicateNews(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.title.toLowerCase().replace(/\s+/g,'').substring(0,50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Helpers ───────────────────────────────────────────────
function stripHtml(html) {
  return (html||'').replace(/<[^>]*>/g,'').replace(/&[a-z]+;/gi,' ').trim();
}
function guessCategory(text) {
  const t = (text||'').toLowerCase();
  if (/bitcoin|btc/.test(t))                    return 'Bitcoin';
  if (/ethereum|eth/.test(t))                   return 'Ethereum';
  if (/defi|uniswap|aave|compound/.test(t))     return 'DeFi';
  if (/nft|opensea|metaverse/.test(t))          return 'NFT';
  if (/sec|regulation|law|ban|legal/.test(t))   return 'Regulation';
  if (/fed|inflation|cpi|macro|rate/.test(t))   return 'Macro';
  if (/binance|coinbase|exchange|hack/.test(t)) return 'Exchange';
  if (/solana|sol|bnb|xrp|cardano/.test(t))     return 'Altcoins';
  return 'Crypto';
}
function guessImpact(text) {
  const t = (text||'').toLowerCase();
  if (['etf','sec','ban','hack','crash','surge','ath','billion','federal','regulation','war','collapse'].some(w=>t.includes(w))) return 'HIGH';
  if (['launch','upgrade','partnership','adoption','milestone','fund'].some(w=>t.includes(w))) return 'MEDIUM';
  return 'LOW';
}
function guessBullish(text) {
  const t = (text||'').toLowerCase();
  return !['crash','ban','hack','scam','fraud','dump','fall','drop','bear','loss','fine','sued'].some(w=>t.includes(w));
}
function newsTimeLabel(timeStr) {
  if (!timeStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(timeStr)) / 60000);
  if (isNaN(diff)||diff<0) return 'Just now';
  if (diff < 60)   return diff+'m ago';
  if (diff < 1440) return Math.floor(diff/60)+'h ago';
  return Math.floor(diff/1440)+'d ago';
}

// ── Render Grid ───────────────────────────────────────────
function renderNewsGrid(items) {
  const container = document.getElementById('news-feed');
  if (!container) return;

  const sources  = [...new Set(items.map(i => i.source))];
  const statsBar = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <span style="font-size:0.72rem;color:var(--muted)">${items.length} stories:</span>
      ${sources.map(s => `<span class="chain-badge chain-bsc">${s}</span>`).join('')}
    </div>`;

  const cards = items.map(item => `
    <div class="news-card" id="nc-${item.id}" onclick="selectNews(${item.id})">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <span class="nc-tag">${item.category}</span>
        <span style="font-size:0.62rem;color:var(--muted);font-family:'Space Mono',monospace">${item.source}</span>
      </div>
      <div class="nc-title">${item.title}</div>
      ${item.summary && item.summary !== item.title
        ? `<div class="nc-summary">${item.summary.substring(0,120)}${item.summary.length>120?'...':''}</div>`
        : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
        <span class="nc-impact impact-${(item.impact||'low').toLowerCase()}">${item.impact||'LOW'}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <span>${item.bullish?'🟢':'🔴'}</span>
          <span class="nc-time">${newsTimeLabel(item.time)}</span>
        </div>
      </div>
    </div>`).join('');

  container.innerHTML = statsBar + `<div class="news-grid fade-up">${cards}</div>`;
}

// ── Select News ───────────────────────────────────────────
function selectNews(id) {
  document.querySelectorAll('.news-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('nc-'+id)?.classList.add('selected');
  _selectedNews = _newsItems.find(n => n.id === id);
  if (!_selectedNews) return;

  const preview = document.getElementById('news-preview');
  if (!preview) return;
  const n = _selectedNews;
  preview.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
      <span class="nc-impact impact-${(n.impact||'low').toLowerCase()}">${n.impact}</span>
      <span style="font-size:0.7rem;color:var(--muted)">${n.category}</span>
      <span style="font-size:0.7rem;color:var(--muted);margin-left:auto">${n.source} · ${newsTimeLabel(n.time)}</span>
    </div>
    <div style="font-weight:700;font-size:0.92rem;line-height:1.4;margin-bottom:8px">${n.title}</div>
    ${n.summary && n.summary !== n.title
      ? `<div style="font-size:0.8rem;color:var(--muted);line-height:1.6;margin-bottom:10px">${n.summary}</div>`
      : ''}
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:0.8rem">${n.bullish?'🟢 Bullish':'🔴 Bearish'}</span>
      ${n.url?`<a href="${n.url}" target="_blank" style="font-size:0.75rem;color:var(--accent);text-decoration:none;margin-left:auto">Read Full →</a>`:''}
    </div>`;
}

// ── Generate Post via Groq ────────────────────────────────
async function generateNewsPost() {
  if (!_selectedNews) { showToast('info','📰','Select a news item first'); return; }

  const btn = document.getElementById('newsGenBtn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Writing...'; }

  try {
    const n = _selectedNews;
    const post = await callClaude(
      `You are a crypto social media expert writing for Binance Square. Write engaging, concise posts. Max 500 characters total. Use 2-4 emojis. End with 3-4 relevant hashtags. No filler phrases.`,
      `Write a Binance Square post about this news:

Title: "${n.title}"
${n.summary && n.summary!==n.title ? `Details: ${n.summary}` : ''}
Impact: ${n.impact} | Sentiment: ${n.bullish?'Bullish':'Bearish'} | Source: ${n.source}

Requirements: Under 500 chars. Direct and punchy. End with hashtags like #Crypto #BinanceSquare #${n.category}.`,
      false
    );
    loadComposer(post);
    showToast('success','✨','Post generated!');
  } catch(e) {
    showToast('error','❌', SP.groqKey ? 'Generation failed: '+e.message : 'Add Groq key in ⚙ API Keys to generate posts (free at groq.com)');
  }

  if (btn) { btn.disabled=false; btn.innerHTML='✨ Generate Post'; }
}

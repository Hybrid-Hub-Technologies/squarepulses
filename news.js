// ============================================================
// news.js — Crypto News Tab (FREE: CoinGecko + NewsAPI)
// ============================================================

let _newsItems = [];
let _selectedNews = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadNewsTab() {
  const container = document.getElementById('news-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Fetching latest crypto news...</div>';

  try {
    const [geckoNews, newsapiNews] = await Promise.allSettled([
      fetchCoinGeckoNews(),
      fetchNewsAPI(),
    ]);

    let allNews = [];
    if (geckoNews.status === 'fulfilled') allNews = allNews.concat(geckoNews.value);
    if (newsapiNews.status === 'fulfilled') allNews = allNews.concat(newsapiNews.value);

    if (!allNews.length) throw new Error('No news available');

    const seen = new Set();
    _newsItems = allNews.filter(n => {
      if (seen.has(n.title)) return false;
      seen.add(n.title);
      return true;
    }).slice(0, 20);

    renderNewsFeed(_newsItems);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📰</div>
      <p>Could not load news.<br><small>${e.message}</small></p></div>`;
  }
}

// ── Source 1: CoinGecko News (no key needed) ─────────────
async function fetchCoinGeckoNews() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/news?per_page=20&order=popularity_desc');
    const data = await res.json();
    return (data.data || []).map(n => ({
      id: n.id,
      title: n.title,
      description: n.description || n.title,
      source: n.sources?.[0]?.name || 'CoinGecko',
      url: n.url,
      image: n.image?.small,
      published_at: new Date(n.updated_at).toLocaleString(),
      tags: n.tags || [],
    }));
  } catch(e) { return []; }
}

async function fetchNewsAPI() {
  try {
    const query = 'cryptocurrency OR bitcoin OR ethereum';
    const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20`);
    const data = await res.json();
    return (data.articles || []).map(a => ({
      id: a.url,
      title: a.title,
      description: a.description || a.content,
      source: a.source?.name || 'NewsAPI',
      url: a.url,
      image: a.urlToImage,
      published_at: new Date(a.publishedAt).toLocaleString(),
      tags: ['crypto', 'market'],
    }));
  } catch(e) { return []; }
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
  return 'General';
}

function renderNewsFeed(items) {
  const container = document.getElementById('news-feed');
  if (!container) return;

  const html = items.map((n, i) => `
    <div class="news-card" onclick="selectNews('${n.id}')">
      ${n.image ? `<div class="news-img" style="background-image:url('${n.image}')"></div>` : '<div class="news-img no-img">📰</div>'}
      <div class="news-info">
        <h3>${n.title}</h3>
        <p class="source">${n.source} • ${n.published_at}</p>
        <p class="desc">${(n.description || '').substring(0, 100)}...</p>
      </div>
    </div>
  `).join('');

  container.innerHTML = html || '<div class="empty-state"><p>No news found</p></div>';
}

function selectNews(id) {
  _selectedNews = _newsItems.find(n => n.id === id);
  if (!_selectedNews) return;

  const preview = document.getElementById('news-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom: 16px;">
      ${_selectedNews.image ? `<img src="${_selectedNews.image}" style="width:100%;border-radius:8px;margin-bottom:12px;max-height:200px;object-fit:cover;">` : ''}
      <h3>${_selectedNews.title}</h3>
      <p style="color:var(--muted);font-size:0.85rem;margin:8px 0">${_selectedNews.source} • ${_selectedNews.published_at}</p>
      <p>${_selectedNews.description}</p>
      <a href="${_selectedNews.url}" target="_blank" style="color:var(--accent);text-decoration:none;font-weight:bold">→ Read Full Article</a>
    </div>
  `;
}

async function generateNewsPost() {
  if (!_selectedNews) {
    showToast('info', 'ℹ', 'Select a news article first');
    return;
  }

  const genBtn = document.getElementById('newsGenBtn');
  if (genBtn) {
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';
    genBtn.style.pointerEvents = 'none';
  }

  try {
    const prompt = `Write a short, engaging Binance Square post (100-150 chars) about this crypto news:\n\n"${_selectedNews.title}"\n\n${_selectedNews.description}\n\nMake it trending and add relevant emojis. Include hashtags.`;
    
    const post = await callClaude(
      'You are a crypto news commentator. Write short, engaging posts.',
      prompt,
      false
    );

    loadComposer(post);
    showToast('success', '📊', 'News post generated!');
  } catch(e) {
    showToast('error', '❌', e.message);
  }

  if (genBtn) {
    genBtn.innerHTML = '✨ Generate Post';
    genBtn.style.pointerEvents = '';
  }
}
 
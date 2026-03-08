// ============================================================
// news.js — Crypto News Tab
// ONLY uses rss2json.com — free, no key, zero CORS issues
// Feeds: CoinDesk, CoinTelegraph, Decrypt, Bitcoin Magazine
// ============================================================

let _newsItems    = [];
let _selectedNews = null;

const RSS_FEEDS = [
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',   name: 'CoinDesk'         },
  { url: 'https://cointelegraph.com/rss',                     name: 'CoinTelegraph'    },
  { url: 'https://decrypt.co/feed',                           name: 'Decrypt'          },
  { url: 'https://bitcoinmagazine.com/.rss/full/',            name: 'Bitcoin Magazine' },
];

// ── Load Tab ──────────────────────────────────────────────
async function loadNewsTab() {
  const container = document.getElementById('news-feed');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Fetching latest crypto news...</div>';

  try {
    // Fetch all feeds in parallel
    const results = await Promise.allSettled(
      RSS_FEEDS.map(f => fetchRSS(f.url, f.name))
    );

    let allNews = [];
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value.length) {
        allNews = allNews.concat(r.value);
      }
    });

    if (!allNews.length) throw new Error('All RSS feeds failed. Check your internet connection.');

    // Sort by date (newest first) then deduplicate
    allNews.sort((a, b) => b._ts - a._ts);

    const seen = new Set();
    _newsItems = allNews.filter(n => {
      const key = n.title.toLowerCase().replace(/\s+/g, '').substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);

    renderNewsFeed(_newsItems);

  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📰</div>
        <p>Could not load news.<br><small>${e.message}</small></p>
      </div>`;
  }
}

// ── Fetch single RSS feed via rss2json ────────────────────
async function fetchRSS(feedUrl, sourceName) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=12`;
  const res  = await fetch(apiUrl);
  if (!res.ok) throw new Error(`rss2json ${res.status} for ${sourceName}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`Feed error: ${sourceName}`);

  return (data.items || []).map((item, i) => {
    const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0;
    return {
      id:           `${sourceName}-${i}-${ts}`,
      title:        (item.title || 'No title').trim(),
      description:  stripHtml(item.description || item.content || '').substring(0, 220),
      source:       sourceName,
      url:          item.link || '#',
      image:        item.thumbnail
                      || item.enclosure?.link
                      || extractImgFromHtml(item.description)
                      || null,
      published_at: ts ? new Date(ts).toLocaleString() : 'Recent',
      tags:         (item.categories || []).slice(0, 3),
      _ts:          ts,
    };
  });
}

// ── Render feed ───────────────────────────────────────────
function renderNewsFeed(items) {
  const container = document.getElementById('news-feed');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><p>No news found</p></div>';
    return;
  }

  container.innerHTML = items.map(n => `
    <div class="news-card"
      onclick="selectNews('${n.id.replace(/'/g, "\\'")}')"
      style="cursor:pointer;display:flex;gap:12px;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:10px;background:rgba(255,255,255,0.02);transition:background 0.2s"
      onmouseover="this.style.background='rgba(255,255,255,0.05)'"
      onmouseout="this.style.background='rgba(255,255,255,0.02)'">

      ${n.image
        ? `<img src="${n.image}"
              style="width:72px;height:72px;object-fit:cover;border-radius:6px;flex-shrink:0"
              onerror="this.style.display='none'">`
        : `<div style="width:72px;height:72px;background:rgba(255,255,255,0.05);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0">📰</div>`
      }

      <div style="flex:1;min-width:0">
        <h3 style="margin:0 0 4px 0;font-size:0.88rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
          ${n.title}
        </h3>
        <p style="margin:0 0 5px 0;color:var(--muted);font-size:0.75rem">
          ${n.source} • ${n.published_at}
        </p>
        ${n.tags.length
          ? `<div style="display:flex;gap:4px;flex-wrap:wrap">
               ${n.tags.map(t =>
                 `<span style="font-size:0.65rem;padding:2px 6px;background:rgba(99,102,241,0.2);border-radius:10px;color:#a5b4fc">${t}</span>`
               ).join('')}
             </div>`
          : ''
        }
      </div>
    </div>
  `).join('');
}

// ── Select & preview ──────────────────────────────────────
function selectNews(id) {
  _selectedNews = _newsItems.find(n => n.id === id);
  if (!_selectedNews) return;

  const preview = document.getElementById('news-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      ${_selectedNews.image
        ? `<img src="${_selectedNews.image}"
              style="width:100%;border-radius:8px;margin-bottom:12px;max-height:180px;object-fit:cover"
              onerror="this.style.display='none'">`
        : ''
      }
      <h3 style="margin:0 0 8px 0;font-size:0.95rem;line-height:1.4">${_selectedNews.title}</h3>
      <p style="color:var(--muted);font-size:0.8rem;margin:0 0 10px 0">
        ${_selectedNews.source} • ${_selectedNews.published_at}
      </p>
      ${_selectedNews.description
        ? `<p style="font-size:0.85rem;color:rgba(255,255,255,0.7);margin:0 0 12px 0">
             ${_selectedNews.description}
           </p>`
        : ''
      }
      <a href="${_selectedNews.url}" target="_blank"
         style="color:var(--accent);text-decoration:none;font-size:0.85rem;font-weight:bold">
        → Read Full Article
      </a>
    </div>
  `;
}

// ── Generate post via Groq (core.js callClaude) ───────────
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
    const prompt = `Write a Binance Square post about this crypto news:

Title: "${_selectedNews.title}"
${_selectedNews.description ? `Summary: ${_selectedNews.description}` : ''}

Rules:
- 150-250 characters max
- Engaging, punchy tone
- Relevant emojis
- 2-3 hashtags like #Bitcoin #Crypto
- No links

Write ONLY the post, nothing else.`;

    const post = await callClaude(
      'You are a crypto content creator writing viral posts for Binance Square.',
      prompt,
      false
    );

    loadComposer(post);
    showToast('success', '📰', 'News post generated!');
  } catch (e) {
    showToast('error', '❌', e.message);
  }

  if (genBtn) {
    genBtn.innerHTML = '✨ Generate Post';
    genBtn.style.pointerEvents = '';
  }
}

// ── Helpers ───────────────────────────────────────────────
function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}

function extractImgFromHtml(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
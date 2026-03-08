// ============================================================
// news.js — Crypto News Tab
// Data comes from /api/proxy?type=news (no CORS issues)
// ============================================================

let _newsItems    = [];
let _selectedNews = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadNewsTab() {
  const container = document.getElementById('news-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Fetching latest crypto news...</div>';

  try {
    const res  = await fetch(`/api/proxy?type=news`);
    const data = await res.json();

    if (!data.success || !data.data?.length) throw new Error('No news available');

    _newsItems = data.data;
    renderNewsFeed(_newsItems);

  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📰</div>
        <p>Could not load news.<br><small>${e.message}</small></p>
      </div>`;
  }
}

// ── Render feed ───────────────────────────────────────────
function renderNewsFeed(items) {
  const container = document.getElementById('news-feed');
  if (!container) return;

  container.innerHTML = items.map(n => `
    <div class="news-card"
      onclick="selectNews('${n.id.replace(/'/g,"\\'")}')"
      style="cursor:pointer;display:flex;gap:12px;padding:12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:10px;background:rgba(255,255,255,0.02);transition:background 0.2s"
      onmouseover="this.style.background='rgba(255,255,255,0.05)'"
      onmouseout="this.style.background='rgba(255,255,255,0.02)'">
      ${n.image
        ? `<img src="${n.image}" style="width:72px;height:72px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">`
        : `<div style="width:72px;height:72px;background:rgba(255,255,255,0.05);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0">📰</div>`
      }
      <div style="flex:1;min-width:0">
        <h3 style="margin:0 0 4px 0;font-size:0.88rem;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${n.title}</h3>
        <p style="margin:0 0 5px 0;color:var(--muted);font-size:0.75rem">${n.source} • ${n.published_at}</p>
        ${n.tags?.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${n.tags.map(t=>`<span style="font-size:0.65rem;padding:2px 6px;background:rgba(99,102,241,0.2);border-radius:10px;color:#a5b4fc">${t}</span>`).join('')}</div>` : ''}
      </div>
    </div>
  `).join('') || '<div class="empty-state"><p>No news found</p></div>';
}

// ── Select & preview ──────────────────────────────────────
function selectNews(id) {
  _selectedNews = _newsItems.find(n => n.id === id);
  if (!_selectedNews) return;

  const preview = document.getElementById('news-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      ${_selectedNews.image ? `<img src="${_selectedNews.image}" style="width:100%;border-radius:8px;margin-bottom:12px;max-height:180px;object-fit:cover" onerror="this.style.display='none'">` : ''}
      <h3 style="margin:0 0 8px 0;font-size:0.95rem;line-height:1.4">${_selectedNews.title}</h3>
      <p style="color:var(--muted);font-size:0.8rem;margin:0 0 10px 0">${_selectedNews.source} • ${_selectedNews.published_at}</p>
      ${_selectedNews.description ? `<p style="font-size:0.85rem;color:rgba(255,255,255,0.7);margin:0 0 12px 0">${_selectedNews.description}</p>` : ''}
      <a href="${_selectedNews.url}" target="_blank" style="color:var(--accent);text-decoration:none;font-size:0.85rem;font-weight:bold">→ Read Full Article</a>
    </div>
  `;
}

// ── Generate post via Groq ────────────────────────────────
async function generateNewsPost() {
  if (!_selectedNews) { showToast('info','ℹ','Select a news article first'); return; }

  const genBtn = document.getElementById('newsGenBtn');
  if (genBtn) { genBtn.innerHTML = '<span class="spinner"></span> Generating...'; genBtn.style.pointerEvents = 'none'; }

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

    const post = await callClaude('You are a crypto content creator writing viral posts for Binance Square.', prompt, false);
    loadComposer(post);
    showToast('success','📰','News post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (genBtn) { genBtn.innerHTML = '✨ Generate Post'; genBtn.style.pointerEvents = ''; }
}
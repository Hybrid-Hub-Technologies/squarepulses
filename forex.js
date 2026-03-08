// ============================================================
// forex.js — Forex/Macro Events
// Data comes from /api/proxy?type=forex (no CORS issues)
// Post generation via Groq (core.js callClaude)
// ============================================================

let _forexEvents  = [];
let _selectedEvent = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadForexTab() {
  const container = document.getElementById('forex-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading economic calendar...</div>';

  try {
    const res  = await fetch('/api/proxy?type=forex');
    const data = await res.json();

    if (!data.success || !data.data?.length) throw new Error('No events available');

    _forexEvents = data.data;
    renderForexList(_forexEvents);

  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌍</div>
        <p>Could not load events.<br><small>${e.message}</small></p>
      </div>`;
  }
}

// ── Render list ───────────────────────────────────────────
function renderForexList(items) {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="event-card" onclick="selectEvent(${item.id})"
      style="cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:12px;background:rgba(255,255,255,0.02);transition:background 0.2s"
      onmouseover="this.style.background='rgba(255,255,255,0.05)'"
      onmouseout="this.style.background='rgba(255,255,255,0.02)'">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div>
          <h3 style="margin:0;font-size:0.9rem">${item.flag} ${item.event}</h3>
          <p style="margin:4px 0;color:var(--muted);font-size:0.8rem">${item.country} • ${item.time}</p>
        </div>
        <span style="padding:4px 8px;border-radius:4px;font-size:0.7rem;font-weight:bold;
          background:${item.impact==='HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'};
          border:1px solid ${item.impact==='HIGH' ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.5)'}">
          ${item.impact}
        </span>
      </div>
      <p style="margin:0;font-size:0.8rem;color:var(--muted)">
        Forecast: ${item.forecast} | Previous: ${item.previous}
        ${item.actual ? `| <strong style="color:#4ade80">Actual: ${item.actual}</strong>` : ''}
      </p>
      <p style="margin:6px 0 0 0;font-size:0.8rem;color:var(--muted)">${item.cryptoImpact}</p>
    </div>
  `).join('') || '<div class="empty-state"><p>No events found</p></div>';
}

// ── Select event ──────────────────────────────────────────
function selectEvent(id) {
  _selectedEvent = _forexEvents.find(e => e.id === id);
  if (!_selectedEvent) return;

  const preview = document.getElementById('forex-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      <h3>${_selectedEvent.flag} ${_selectedEvent.event}</h3>
      <p style="color:var(--muted);font-size:0.85rem;margin:8px 0">${_selectedEvent.country} • ${_selectedEvent.time}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Impact</small><br>
          <strong style="color:${_selectedEvent.impact==='HIGH' ? '#ef4444' : '#f59e0b'}">${_selectedEvent.impact}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Forecast vs Previous</small><br>
          <strong>${_selectedEvent.forecast} vs ${_selectedEvent.previous}</strong>
        </div>
        ${_selectedEvent.actual ? `
        <div style="padding:8px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.3);border-radius:6px;grid-column:span 2">
          <small style="color:var(--muted)">Actual Result</small><br>
          <strong style="color:#4ade80">${_selectedEvent.actual}</strong>
        </div>` : ''}
      </div>
      <p><strong>Crypto Impact:</strong> ${_selectedEvent.cryptoImpact}</p>
      <p style="color:var(--muted);font-size:0.9rem">
        ${_selectedEvent.bullishForCrypto === true  ? '📈 Bullish for crypto'  :
          _selectedEvent.bullishForCrypto === false ? '📉 Bearish for crypto'  : '➡️ Neutral for crypto'}
      </p>
    </div>
  `;
}

// ── Generate post via Groq ────────────────────────────────
async function generateForexPost() {
  if (!_selectedEvent) { showToast('info','ℹ','Select an event first'); return; }

  const genBtn = document.getElementById('forexGenBtn');
  if (genBtn) { genBtn.innerHTML = '<span class="spinner"></span> Generating...'; genBtn.style.pointerEvents = 'none'; }

  try {
    const sentiment = _selectedEvent.bullishForCrypto === true  ? 'bullish' :
                      _selectedEvent.bullishForCrypto === false ? 'bearish' : 'neutral';

    const prompt = `Write a Binance Square post about this macro event's impact on crypto:

Event: ${_selectedEvent.event}
Country: ${_selectedEvent.country}
Impact Level: ${_selectedEvent.impact}
Forecast: ${_selectedEvent.forecast} | Previous: ${_selectedEvent.previous}${_selectedEvent.actual ? ` | Actual: ${_selectedEvent.actual}` : ''}
Crypto Sentiment: ${sentiment}
Analysis: ${_selectedEvent.cryptoImpact}

Rules:
- 150-250 characters max
- Use emojis
- 2-3 hashtags like #Bitcoin #Macro #Crypto
- Be direct and insightful

Write ONLY the post, nothing else.`;

    const post = await callClaude('You are a professional crypto market analyst specializing in macro economics.', prompt, false);
    loadComposer(post);
    showToast('success','📊','Forex post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (genBtn) { genBtn.innerHTML = '✨ Generate Post'; genBtn.style.pointerEvents = ''; }
}
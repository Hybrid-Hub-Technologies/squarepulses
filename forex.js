// ============================================================
// forex.js — Forex / Macro Events Tab
// Economic calendar + crypto market impact analysis
// ============================================================

let _forexEvents    = [];
let _selectedEvent  = null;

async function loadForexTab() {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading economic calendar...</div>';

  try {
    const raw = await callClaude(
      `You are a macro economics analyst who covers forex events and their crypto market impact.
Search for upcoming and recent major economic events (CPI, Fed rates, NFP, GDP, PMI, FOMC etc).
Return ONLY a raw JSON array. No markdown, no backticks.
Each item: { "id":number, "event":string, "country":string, "flag":string(emoji), "time":string, "impact":string(HIGH/MEDIUM/LOW), "forecast":string, "previous":string, "cryptoImpact":string(one sentence on how this affects crypto), "bullishForCrypto":boolean }
Return 10 items sorted by impact desc.`,
      'Find upcoming and recent major forex/macro economic events for this week including CPI, Fed, NFP, FOMC, GDP data releases.',
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

    if (!items?.length) throw new Error('No events parsed');
    _forexEvents = items;
    renderForexList(items);

  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🌍</div>
      <p>Could not load events.<br><small>${e.message}</small></p>
      <button class="btn btn-ghost" style="margin-top:16px" onclick="window._forexLoaded=false;loadForexTab()">Retry</button></div>`;
  }
}

function renderForexList(items) {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  const html = items.map(item => `
    <div class="event-item" id="ev-${item.id}" onclick="selectEvent(${item.id})">
      <div class="event-time">
        <div style="font-size:1.2rem">${item.flag}</div>
        <div>${item.time}</div>
      </div>
      <div class="event-info">
        <div class="e-name">${item.event}</div>
        <div class="e-country">${item.country} · Prev: ${item.previous} · Forecast: ${item.forecast}</div>
        <div style="font-size:0.72rem;margin-top:4px;color:${item.bullishForCrypto ? 'var(--green)' : 'var(--red)'}">
          ${item.bullishForCrypto ? '🟢' : '🔴'} ${item.cryptoImpact}
        </div>
      </div>
      <div class="event-impact">
        <span class="nc-impact impact-${item.impact.toLowerCase()}">${item.impact}</span>
      </div>
    </div>`).join('');

  container.innerHTML = `<div class="event-list fade-up">${html}</div>`;
}

function selectEvent(id) {
  document.querySelectorAll('.event-item').forEach(e => e.classList.remove('selected'));
  document.getElementById('ev-' + id)?.classList.add('selected');
  _selectedEvent = _forexEvents.find(e => e.id === id);

  if (!_selectedEvent) return;
  const preview = document.getElementById('forex-preview');
  if (preview) {
    preview.innerHTML = `
      <div style="font-weight:700;font-size:0.95rem;margin-bottom:8px">${_selectedEvent.flag} ${_selectedEvent.event}</div>
      <div style="font-size:0.8rem;color:var(--muted);margin-bottom:8px">${_selectedEvent.country} · ${_selectedEvent.time}</div>
      <div class="detail-grid" style="margin-top:0">
        ${statBox('Forecast',  _selectedEvent.forecast,  '')}
        ${statBox('Previous',  _selectedEvent.previous,  '')}
        ${statBox('Impact',    _selectedEvent.impact,    _selectedEvent.impact==='HIGH'?'red':_selectedEvent.impact==='MEDIUM'?'gold':'green')}
        ${statBox('Crypto',    _selectedEvent.bullishForCrypto?'Bullish':'Bearish', _selectedEvent.bullishForCrypto?'green':'red')}
      </div>
      <div style="font-size:0.8rem;color:var(--muted);margin-top:12px;line-height:1.6">${_selectedEvent.cryptoImpact}</div>`;
  }
}

async function generateForexPost() {
  if (!_selectedEvent) { showToast('info','🌍','Select an event first'); return; }

  const btn = document.getElementById('forexGenBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Analyzing...'; }

  try {
    const post = await callClaude(
      `You are a macro analyst writing for crypto traders on Binance Square.
Create an engaging post about the given economic event and its crypto market impact.
Max 500 chars. Use emojis. Include what to watch for. End with hashtags like #Macro #Bitcoin #Crypto.`,
      `Event: ${_selectedEvent.flag} ${_selectedEvent.event} (${_selectedEvent.country})
Time: ${_selectedEvent.time}
Forecast: ${_selectedEvent.forecast} | Previous: ${_selectedEvent.previous}
Crypto Impact: ${_selectedEvent.cryptoImpact}
Sentiment: ${_selectedEvent.bullishForCrypto ? 'Bullish' : 'Bearish'} for crypto

Write a Binance Square post about this event.`,
      false
    );
    loadComposer(post);
    showToast('success','✨','Post generated!');
  } catch(e) {
    showToast('error','❌','Generation failed');
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '✨ Generate Post'; }
}

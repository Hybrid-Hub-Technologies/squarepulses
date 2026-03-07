// ============================================================
// forex.js — Forex/Macro Events (FREE: Economic Calendar)
// ============================================================

let _forexEvents = [];
let _selectedEvent = null;

async function loadForexTab() {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading economic calendar...</div>';

  try {
    const events = await fetchEconomicCalendar();
    
    if (!events.length) throw new Error('No events available');
    
    _forexEvents = events;
    renderForexList(events);
  } catch(e) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🌍</div>
      <p>Could not load events.<br><small>${e.message}</small></p></div>`;
  }
}

function renderForexList(items) {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  const html = items.map(item => `
    <div class="event-card" onclick="selectEvent(${item.id})" style="cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:12px;background:rgba(255,255,255,0.02)">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
        <div>
          <h3 style="margin:0;font-size:0.9rem">${item.flag} ${item.event}</h3>
          <p style="margin:4px 0;color:var(--muted);font-size:0.8rem">${item.country} • ${item.time}</p>
        </div>
        <span style="padding:4px 8px;background:${item.impact === 'HIGH' ? 'rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5)'};border-radius:4px;font-size:0.7rem;font-weight:bold">${item.impact}</span>
      </div>
      <p style="margin:0;font-size:0.8rem;color:var(--muted)">Forecast: ${item.forecast} | Previous: ${item.previous}</p>
      <p style="margin:6px 0 0 0;font-size:0.8rem;color:var(--muted)">${item.cryptoImpact}</p>
    </div>
  `).join('');

  container.innerHTML = html || '<div class="empty-state"><p>No events found</p></div>';
}

function selectEvent(id) {
  _selectedEvent = _forexEvents.find(e => e.id === id);
  if (!_selectedEvent) return;

  const preview = document.getElementById('forex-preview');
  if (!preview) return;

  preview.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3>${_selectedEvent.flag} ${_selectedEvent.event}</h3>
      <p style="color:var(--muted);font-size:0.85rem;margin:8px 0">${_selectedEvent.country} • ${_selectedEvent.time}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Impact</small><br>
          <strong style="color:${_selectedEvent.impact === 'HIGH' ? '#ef4444' : '#f59e0b'}">${_selectedEvent.impact}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Forecast vs Previous</small><br>
          <strong>${_selectedEvent.forecast} vs ${_selectedEvent.previous}</strong>
        </div>
      </div>
      <p><strong>Crypto Impact:</strong> ${_selectedEvent.cryptoImpact}</p>
      <p style="color:var(--muted);font-size:0.9rem">${_selectedEvent.bullishForCrypto ? '📈 Bullish for crypto' : _selectedEvent.bullishForCrypto === false ? '📉 Bearish for crypto' : '➡️ Neutral'}</p>
    </div>
  `;
}

async function generateForexPost() {
  if (!_selectedEvent) {
    showToast('info', 'ℹ', 'Select an event first');
    return;
  }

  const genBtn = document.querySelector('[onclick*="generateForexPost"]');
  if (genBtn) {
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';
    genBtn.style.pointerEvents = 'none';
  }

  try {
    const sentiment = _selectedEvent.bullishForCrypto ? 'bullish' : 'bearish';
    const prompt = `Write a Binance Square post about this macro event impact on crypto:\n\nEvent: ${_selectedEvent.event}\nCountry: ${_selectedEvent.country}\nImpact: ${_selectedEvent.impact}\nCrypto Impact: ${_selectedEvent.cryptoImpact}\nSentiment: ${sentiment}\n\nMake it 100-150 chars, engaging, with emojis and hashtags.`;

    const post = await callClaude(
      'You are a crypto market analyst commenting on macroeconomic events.',
      prompt,
      false
    );

    loadComposer(post);
    showToast('success', '📊', 'Forex post generated!');
  } catch(e) {
    showToast('error', '❌', e.message);
  }

  if (genBtn) {
    genBtn.innerHTML = '✨ Generate Post';
    genBtn.style.pointerEvents = '';
  }
}

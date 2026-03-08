// ============================================================
// forex.js — Forex/Macro Events
// Free API: Forex Factory calendar (no key needed)
// Groq: post generation (via core.js callClaude)
// ============================================================

let _forexEvents = [];
let _selectedEvent = null;

// ── Crypto impact mapping for common events ───────────────
const CRYPTO_IMPACT_MAP = {
  'CPI':       { text: 'High CPI = Fed stays hawkish → bearish for crypto', bullish: false },
  'NFP':       { text: 'Strong jobs = Fed tightening risk → bearish for crypto', bullish: false },
  'FOMC':      { text: 'Rate hike fears spike volatility → watch BTC reaction', bullish: null },
  'GDP':       { text: 'Weak GDP = risk-off mood → short-term bearish for crypto', bullish: false },
  'PPI':       { text: 'High PPI signals inflation → Fed pressure → bearish', bullish: false },
  'PCE':       { text: 'Core PCE drives Fed policy → high = bearish for crypto', bullish: false },
  'RETAIL':    { text: 'Strong retail = healthy economy → mixed for crypto', bullish: null },
  'UNEMPLOYMENT':{ text: 'Rising unemployment = dovish Fed pivot → bullish crypto', bullish: true },
  'JOBLESS':   { text: 'High jobless claims = Fed may ease → bullish for crypto', bullish: true },
  'INTEREST':  { text: 'Rate decision is key catalyst — watch for surprise cuts', bullish: null },
  'ISM':       { text: 'ISM below 50 = contraction → risk-off → bearish crypto', bullish: false },
  'PMI':       { text: 'PMI contraction signals slowdown → bearish sentiment', bullish: false },
  'HOUSING':   { text: 'Housing data reflects consumer health → neutral crypto', bullish: null },
  'DEFAULT':   { text: 'Macro event may impact risk assets including crypto', bullish: null },
};

function getCryptoImpact(eventTitle) {
  const upper = eventTitle.toUpperCase();
  for (const [key, val] of Object.entries(CRYPTO_IMPACT_MAP)) {
    if (upper.includes(key)) return val;
  }
  return CRYPTO_IMPACT_MAP['DEFAULT'];
}

// ── Country → flag emoji ──────────────────────────────────
const COUNTRY_FLAGS = {
  'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
  'AUD': '🇦🇺', 'CAD': '🇨🇦', 'CHF': '🇨🇭', 'NZD': '🇳🇿',
  'CNY': '🇨🇳', 'CNH': '🇨🇳',
};
const CURRENCY_COUNTRY = {
  'USD':'United States','EUR':'Eurozone','GBP':'United Kingdom',
  'JPY':'Japan','AUD':'Australia','CAD':'Canada',
  'CHF':'Switzerland','NZD':'New Zealand','CNY':'China','CNH':'China',
};

// ── Main fetch function ───────────────────────────────────
async function fetchEconomicCalendar() {
  // Forex Factory free JSON — this week's events, no API key needed
  const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

  let rawEvents = [];

  try {
    const res = await fetch(FF_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rawEvents = await res.json();
  } catch (e) {
    // CORS ya network error pe Groq se simulated events lo
    console.warn('Forex Factory fetch failed, using Groq fallback:', e.message);
    return await fetchForexViaGroq();
  }

  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return await fetchForexViaGroq();
  }

  // Filter: sirf HIGH aur MEDIUM impact events
  const filtered = rawEvents.filter(e =>
    e.impact === 'High' || e.impact === 'Medium'
  );

  if (filtered.length === 0) return await fetchForexViaGroq();

  // Map to our format
  const events = filtered.slice(0, 10).map((e, i) => {
    const currency = e.currency || 'USD';
    const flag = COUNTRY_FLAGS[currency] || '🌍';
    const country = CURRENCY_COUNTRY[currency] || currency;
    const impact = e.impact === 'High' ? 'HIGH' : 'MEDIUM';
    const cryptoData = getCryptoImpact(e.title || '');

    // Format time
    let timeStr = '—';
    if (e.date) {
      try {
        const d = new Date(e.date);
        timeStr = d.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        });
      } catch (_) {}
    }

    return {
      id: i + 1,
      event: e.title || 'Unknown Event',
      country,
      flag,
      time: timeStr,
      impact,
      forecast: e.forecast || 'N/A',
      previous: e.previous || 'N/A',
      actual: e.actual || null,
      cryptoImpact: cryptoData.text,
      bullishForCrypto: cryptoData.bullish,
    };
  });

  return events;
}

// ── Groq fallback: agar FF API na chale ──────────────────
async function fetchForexViaGroq() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const prompt = `Today is ${today}. List the 6 most important high-impact forex/macro economic events happening this week (real recurring events like CPI, NFP, FOMC, GDP etc).

Return ONLY a valid JSON array. Each object must have exactly these fields:
- id: number
- event: string
- country: string  
- flag: string (emoji)
- time: string (e.g. "08:30 EST")
- impact: "HIGH" or "MEDIUM"
- forecast: string
- previous: string
- cryptoImpact: string (one sentence on crypto effect)
- bullishForCrypto: boolean or null

No markdown, no backticks, no explanation. Just the JSON array.`;

  const raw = await callClaude(
    'You are a financial data assistant. Return only JSON, no extra text.',
    prompt,
    false
  );

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const events = JSON.parse(cleaned);
    if (!Array.isArray(events) || !events.length) throw new Error('Empty');
    return events;
  } catch (e) {
    throw new Error('Could not parse events: ' + e.message);
  }
}

// ── Render list ───────────────────────────────────────────
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
        <span style="padding:4px 8px;background:${
          item.impact === 'HIGH'
            ? 'rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5)'
            : 'rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5)'
        };border-radius:4px;font-size:0.7rem;font-weight:bold">${item.impact}</span>
      </div>
      <p style="margin:0;font-size:0.8rem;color:var(--muted)">
        Forecast: ${item.forecast} | Previous: ${item.previous}
        ${item.actual ? `| <strong style="color:#4ade80">Actual: ${item.actual}</strong>` : ''}
      </p>
      <p style="margin:6px 0 0 0;font-size:0.8rem;color:var(--muted)">${item.cryptoImpact}</p>
    </div>
  `).join('');

  container.innerHTML = html || '<div class="empty-state"><p>No events found</p></div>';
}

// ── Load tab ──────────────────────────────────────────────
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
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌍</div>
        <p>Could not load events.<br><small>${e.message}</small></p>
      </div>`;
  }
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
          <strong style="color:${_selectedEvent.impact === 'HIGH' ? '#ef4444' : '#f59e0b'}">${_selectedEvent.impact}</strong>
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
  if (!_selectedEvent) {
    showToast('info', 'ℹ', 'Select an event first');
    return;
  }

  const genBtn = document.getElementById('forexGenBtn');
  if (genBtn) {
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';
    genBtn.style.pointerEvents = 'none';
  }

  try {
    const sentiment = _selectedEvent.bullishForCrypto === true ? 'bullish' :
                      _selectedEvent.bullishForCrypto === false ? 'bearish' : 'neutral';

    const prompt = `Write a Binance Square post about this macro event's impact on crypto:

Event: ${_selectedEvent.event}
Country: ${_selectedEvent.country}
Impact Level: ${_selectedEvent.impact}
Forecast: ${_selectedEvent.forecast} | Previous: ${_selectedEvent.previous}${_selectedEvent.actual ? ` | Actual: ${_selectedEvent.actual}` : ''}
Crypto Sentiment: ${sentiment}
Analysis: ${_selectedEvent.cryptoImpact}

Write an engaging post (150-250 chars), use emojis and 2-3 relevant hashtags like #Bitcoin #Crypto #Macro. Be direct and insightful.`;

    const post = await callClaude(
      'You are a professional crypto market analyst specializing in macro economics impact on digital assets.',
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
// ============================================================
// forex.js — Forex/Macro Events
// Features: countdown timers, today/upcoming grouping, live updates
// ============================================================

let _forexEvents   = [];
let _selectedEvent = null;
let _countdownTimer = null;

// ── Load Tab ──────────────────────────────────────────────
async function loadForexTab() {
  const container = document.getElementById('forex-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Loading economic calendar...</div>';

  try {
    const res  = await fetch('/api/proxy?type=forex');
    const data = await res.json();

    if (!data.success || !data.data?.length) throw new Error(data.message || 'No events available');

    _forexEvents = data.data;
    renderForexList(_forexEvents);

    // Start countdown ticker — updates every second
    if (_countdownTimer) clearInterval(_countdownTimer);
    _countdownTimer = setInterval(() => updateAllCountdowns(), 1000);

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🌍</div>
        <p>Could not load events.<br><small>${e.message}</small></p>
        <button class="btn btn-ghost" style="margin-top:12px" onclick="window._forexLoaded=false;loadForexTab()">🔄 Retry</button>
      </div>`;
  }
}

// ── Render list with TODAY / UPCOMING sections ────────────
function renderForexList(items) {
  const container = document.getElementById('forex-feed');
  if (!container) return;

  const now       = Date.now();
  const todayStr  = new Date().toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' });

  // Separate today vs upcoming
  const todayEvents    = items.filter(e => e.date === todayStr);
  const upcomingEvents = items.filter(e => e.date !== todayStr);

  let html = '';

  // ── TODAY section ──
  if (todayEvents.length) {
    html += `<div style="font-size:0.72rem;font-weight:700;color:#f0b90b;letter-spacing:0.08em;margin-bottom:8px;padding:6px 10px;background:rgba(240,185,11,0.08);border-radius:6px;border-left:3px solid #f0b90b">
      📅 TODAY — ${todayStr}
    </div>`;
    todayEvents.forEach(item => { html += buildEventCard(item, true); });
  }

  // ── UPCOMING section ──
  if (upcomingEvents.length) {
    // Group by date
    const byDate = {};
    upcomingEvents.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });

    Object.entries(byDate).forEach(([date, events]) => {
      html += `<div style="font-size:0.72rem;font-weight:700;color:var(--muted);letter-spacing:0.08em;margin:16px 0 8px 0;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        📆 ${date}
      </div>`;
      events.forEach(item => { html += buildEventCard(item, false); });
    });
  }

  if (!html) html = '<div class="empty-state"><p>No upcoming events found</p></div>';

  container.innerHTML = html;
}

// ── Build single event card HTML ──────────────────────────
function buildEventCard(item, isToday) {
  const impactColor  = item.impact === 'HIGH' ? '#ef4444' : '#f59e0b';
  const impactBg     = item.impact === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)';
  const impactBorder = item.impact === 'HIGH' ? 'rgba(239,68,68,0.4)'  : 'rgba(245,158,11,0.4)';

  const countdownId = `cd-${item.id}`;
  const msLeft      = new Date(item.isoDate).getTime() - Date.now();
  const isLive      = msLeft <= 0 && !item.isPast;
  const isPast      = item.isPast || (msLeft < -7200000); // past if >2h ago or has actual

  return `
    <div onclick="selectEvent(${item.id})"
      style="cursor:pointer;padding:12px;border:1px solid rgba(255,255,255,${isToday?'0.12':'0.07'});border-radius:8px;margin-bottom:10px;
             background:${isToday?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.01)'};
             ${isPast?'opacity:0.55':''}
             transition:all 0.2s;position:relative"
      onmouseover="this.style.background='rgba(255,255,255,0.06)'"
      onmouseout="this.style.background='${isToday?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.01)'}'">

      <!-- Impact badge -->
      <div style="position:absolute;top:10px;right:10px">
        <span style="padding:3px 8px;border-radius:4px;font-size:0.65rem;font-weight:bold;
          background:${impactBg};border:1px solid ${impactBorder};color:${impactColor}">
          ${item.impact}
        </span>
      </div>

      <!-- Event name + country -->
      <div style="padding-right:60px;margin-bottom:6px">
        <h3 style="margin:0;font-size:0.88rem;font-weight:700;line-height:1.3">${item.flag} ${item.event}</h3>
        <p style="margin:3px 0 0 0;color:var(--muted);font-size:0.75rem">${item.country}</p>
      </div>

      <!-- Time + countdown -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:0.75rem;color:rgba(255,255,255,0.5)">🕐 ${item.time}</div>
        <div id="${countdownId}" style="font-size:0.72rem;font-weight:700;font-family:monospace">
          ${isPast
            ? (item.actual ? `<span style="color:#4ade80">✓ Released</span>` : `<span style="color:var(--muted)">Passed</span>`)
            : isLive
              ? `<span style="color:#f0b90b;animation:pulse 1s infinite">🔴 LIVE NOW</span>`
              : formatCountdown(msLeft)
          }
        </div>
      </div>

      <!-- Forecast / Previous / Actual -->
      <div style="display:flex;gap:8px;font-size:0.75rem;flex-wrap:wrap">
        <span style="color:var(--muted)">Forecast: <strong style="color:rgba(255,255,255,0.7)">${item.forecast}</strong></span>
        <span style="color:var(--muted)">Prev: <strong style="color:rgba(255,255,255,0.7)">${item.previous}</strong></span>
        ${item.actual ? `<span style="color:var(--muted)">Actual: <strong style="color:#4ade80">${item.actual}</strong></span>` : ''}
      </div>

      <!-- Crypto impact -->
      <p style="margin:6px 0 0 0;font-size:0.75rem;color:var(--muted);line-height:1.4">${item.cryptoImpact}</p>
    </div>`;
}

// ── Update all countdown timers every second ──────────────
function updateAllCountdowns() {
  _forexEvents.forEach(item => {
    const el = document.getElementById(`cd-${item.id}`);
    if (!el) return;

    const msLeft  = new Date(item.isoDate).getTime() - Date.now();
    const isPast  = item.isPast || msLeft < -7200000;

    if (isPast) {
      el.innerHTML = item.actual
        ? `<span style="color:#4ade80">✓ Released</span>`
        : `<span style="color:var(--muted)">Passed</span>`;
    } else if (msLeft <= 0) {
      el.innerHTML = `<span style="color:#f0b90b">🔴 LIVE NOW</span>`;
    } else {
      el.innerHTML = formatCountdown(msLeft);
    }
  });
}

// ── Format ms → HH:MM:SS or Xd Xh ───────────────────────
function formatCountdown(ms) {
  if (ms <= 0) return `<span style="color:#f0b90b">🔴 LIVE</span>`;
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;

  if (days > 0) {
    const color = days > 2 ? '#94a3b8' : '#f0b90b';
    return `<span style="color:${color}">⏳ ${days}d ${hours}h</span>`;
  }
  if (hours > 0) {
    const color = hours > 3 ? '#f0b90b' : '#f59e0b';
    return `<span style="color:${color}">⏳ ${hours}h ${mins}m</span>`;
  }
  // Under 1 hour — show full HH:MM:SS in red
  const color = mins < 10 ? '#ef4444' : '#f59e0b';
  return `<span style="color:${color}">⏰ ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</span>`;
}

// ── Select event → detail panel ───────────────────────────
function selectEvent(id) {
  _selectedEvent = _forexEvents.find(e => e.id === id);
  if (!_selectedEvent) return;

  const preview = document.getElementById('forex-preview');
  if (!preview) return;

  const e = _selectedEvent;
  const msLeft = new Date(e.isoDate).getTime() - Date.now();

  preview.innerHTML = `
    <div style="margin-bottom:16px">
      <h3 style="margin:0 0 4px 0">${e.flag} ${e.event}</h3>
      <p style="color:var(--muted);font-size:0.8rem;margin:0 0 12px 0">${e.country}</p>

      <!-- Date + time block -->
      <div style="padding:10px;background:rgba(240,185,11,0.06);border:1px solid rgba(240,185,11,0.2);border-radius:8px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:0.72rem;color:var(--muted)">Date & Time (EST)</div>
            <div style="font-weight:bold;font-size:0.88rem">${e.date} • ${e.time}</div>
          </div>
          <div style="font-size:0.88rem;font-weight:bold;font-family:monospace" id="detail-cd-${e.id}">
            ${formatCountdown(msLeft)}
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Impact</small><br>
          <strong style="color:${e.impact==='HIGH'?'#ef4444':'#f59e0b'}">${e.impact}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Forecast</small><br>
          <strong>${e.forecast}</strong>
        </div>
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px">
          <small style="color:var(--muted)">Previous</small><br>
          <strong>${e.previous}</strong>
        </div>
        ${e.actual
          ? `<div style="padding:8px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.3);border-radius:6px">
               <small style="color:var(--muted)">Actual</small><br>
               <strong style="color:#4ade80">${e.actual}</strong>
             </div>`
          : `<div style="padding:8px;background:rgba(255,255,255,0.03);border-radius:6px">
               <small style="color:var(--muted)">Actual</small><br>
               <strong style="color:var(--muted)">Pending...</strong>
             </div>`
        }
      </div>

      <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:10px">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px">Crypto Impact Analysis</div>
        <p style="margin:0;font-size:0.82rem;line-height:1.5">${e.cryptoImpact}</p>
      </div>

      <p style="margin:0;font-size:0.85rem">
        ${e.bullishForCrypto === true  ? '📈 <strong style="color:#4ade80">Bullish for crypto</strong>'  :
          e.bullishForCrypto === false ? '📉 <strong style="color:#ef4444">Bearish for crypto</strong>'  :
                                         '➡️ <strong style="color:#94a3b8">Neutral for crypto</strong>'}
      </p>
    </div>
  `;
}

// ── Generate post via Groq ────────────────────────────────
async function generateForexPost() {
  if (!_selectedEvent) { showToast('info','ℹ','Select an event first'); return; }

  const genBtn = document.getElementById('forexGenBtn');
  if (genBtn) { genBtn.innerHTML='<span class="spinner"></span> Generating...'; genBtn.style.pointerEvents='none'; }

  try {
    const e = _selectedEvent;
    const sentiment = e.bullishForCrypto===true ? 'bullish' : e.bullishForCrypto===false ? 'bearish' : 'neutral';
    const msLeft    = new Date(e.isoDate).getTime() - Date.now();
    const timing    = e.isPast ? 'just released' : msLeft < 3600000 ? 'happening in under 1 hour' : `upcoming on ${e.date}`;

    const prompt = `Write a Binance Square post about this macro event's impact on crypto:

Event: ${e.event} (${timing})
Country: ${e.country}
Date: ${e.date} at ${e.time}
Impact: ${e.impact}
Forecast: ${e.forecast} | Previous: ${e.previous}${e.actual ? ` | Actual: ${e.actual}` : ''}
Crypto Sentiment: ${sentiment}
Analysis: ${e.cryptoImpact}

Rules: 150-250 chars, emojis, 2-3 hashtags (#Bitcoin #Macro #Crypto), direct and insightful.
Write ONLY the post.`;

    const post = await callClaude('You are a professional crypto market analyst specializing in macro economics.', prompt, false);
    loadComposer(post);
    showToast('success','📊','Forex post generated!');
  } catch(e) {
    showToast('error','❌', e.message);
  }

  if (genBtn) { genBtn.innerHTML='✨ Generate Post'; genBtn.style.pointerEvents=''; }
}
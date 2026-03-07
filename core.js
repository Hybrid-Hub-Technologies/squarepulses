// ============================================================
// core.js — Shared utilities for SquarePulse
// ============================================================

// ── Global state ─────────────────────────────────────────
window.SP = {
  apiKey:   localStorage.getItem('sq_api_key')   || '',
  groqKey:  localStorage.getItem('sq_groq_key')  || '',
  waKey:    localStorage.getItem('sq_wa_key')     || '',
  ethKey:   localStorage.getItem('sq_eth_key')    || '',
  cpKey:    localStorage.getItem('sq_cp_key')     || '',
  watchlist: JSON.parse(localStorage.getItem('sq_watchlist') || '[]'),
  activeMainTab: 'signals',
};

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateApiKeyBtn();
});

// ── Main Tab Switching ────────────────────────────────────
function switchMainTab(name, btn) {
  document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.main-tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = document.getElementById('mt-' + name);
  if (pane) pane.classList.add('active');
  SP.activeMainTab = name;

  // Lazy load tab content on first open
  if (name === 'news'      && !window._newsLoaded)     { loadNewsTab();     window._newsLoaded = true; }
  if (name === 'forex'     && !window._forexLoaded)    { loadForexTab();    window._forexLoaded = true; }
  if (name === 'whales'    && !window._whalesLoaded)   { loadWhalesTab();   window._whalesLoaded = true; }
  if (name === 'xfeed'     && !window._xfeedLoaded)    { loadXFeedTab();    window._xfeedLoaded = true; }
  if (name === 'coinintel' && !window._intelLoaded)    { loadCoinIntelTab(); window._intelLoaded = true; }
}

// ── Inner Tab Switching ───────────────────────────────────
function switchTab(name, btn) {
  const parent = btn.closest('.card, .main-tab-pane');
  parent.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
  parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = parent.querySelector('#tab-' + name);
  if (pane) pane.classList.add('active');
}

// ── API Key ───────────────────────────────────────────────
function openApiModal() {
  document.getElementById('apiKeyInput').value   = SP.apiKey;
  document.getElementById('groqKeyInput').value  = SP.groqKey;
  document.getElementById('whaleKeyInput').value = SP.waKey;
  document.getElementById('ethKeyInput').value   = SP.ethKey;
  document.getElementById('cpKeyInput').value    = SP.cpKey;
  document.getElementById('apiModal').classList.add('open');
}
function closeApiModal() {
  document.getElementById('apiModal').classList.remove('open');
}
function saveApiKey() {
  const keys = {
    sq_api_key:  document.getElementById('apiKeyInput').value.trim(),
    sq_groq_key: document.getElementById('groqKeyInput').value.trim(),
    sq_wa_key:   document.getElementById('whaleKeyInput').value.trim(),
    sq_eth_key:  document.getElementById('ethKeyInput').value.trim(),
    sq_cp_key:   document.getElementById('cpKeyInput').value.trim(),
  };
  const map = { sq_api_key:'apiKey', sq_groq_key:'groqKey', sq_wa_key:'waKey', sq_eth_key:'ethKey', sq_cp_key:'cpKey' };
  Object.entries(keys).forEach(([lsKey, val]) => {
    if (val) { SP[map[lsKey]] = val; localStorage.setItem(lsKey, val); }
  });
  updateApiKeyBtn();
  closeApiModal();
  showToast('success','✅','Keys saved!');
}
function updateApiKeyBtn() {
  const btn = document.getElementById('apiKeyBtn');
  if (!btn) return;
  const hasSq   = !!SP.apiKey;
  const hasGroq = !!SP.groqKey;
  if (hasSq && hasGroq) {
    btn.textContent = '✓ Keys Set';
    btn.classList.add('configured');
  } else if (hasSq || hasGroq) {
    btn.textContent = '⚠ 1 Key Set';
    btn.classList.add('configured');
  } else {
    btn.textContent = '⚙ API Keys';
    btn.classList.remove('configured');
  }
}

// ── Post to Square (via proxy.php) ───────────────────────
async function postToSquare(content, btnEl) {
  if (!content?.trim()) { showToast('info','📝','Write something first'); return; }
  if (!SP.apiKey)        { showToast('error','🔑','Set your API Key first'); openApiModal(); return; }

  if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner"></span> Posting...'; }

  try {
    const res  = await fetch('proxy.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: SP.apiKey, content })
    });
    const data = await res.json();

    if (data.code === '000000') {
      const postId = data.data?.id;
      const url = postId ? `https://www.binance.com/square/post/${postId}` : null;
      showToast('success','🚀', url
        ? `Posted! <a href="${url}" target="_blank" style="color:var(--accent)">View →</a>`
        : 'Posted to Binance Square!');
      return { success: true, url };
    } else {
      const msg = POST_ERRORS[data.code] || `Error: ${data.code}`;
      showToast('error','❌', msg);
      return { success: false };
    }
  } catch(e) {
    showToast('error','⚠','Network error — check proxy.php');
    return { success: false };
  } finally {
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '🚀 Post to Square'; }
  }
}

const POST_ERRORS = {
  '10004':'Network error.',
  '10005':'Identity verification required.',
  '20002':'Sensitive words detected.',
  '20013':'Content too long.',
  '220003':'API Key not found.',
  '220004':'API Key expired.',
  '220009':'Daily post limit reached.',
  '220011':'Empty content.',
  '2000001':'Account blocked.',
};

// ── AI Analysis via Groq (Free — get key at groq.com) ────
// Groq free tier: fast inference, no billing needed for basic use
async function callClaude(systemPrompt, userPrompt, useSearch = true) {
  const key = SP.groqKey;
  if (!key) {
    showToast('error','🔑','Set your Groq API Key first (free at groq.com)');
    openApiModal();
    throw new Error('No Groq API key');
  }

  // If search needed, prepend a note so the model knows to use its training knowledge
  const finalUser = useSearch
    ? `[Use your latest training knowledge for current info]\n\n${userPrompt}`
    : userPrompt;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens:  1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: finalUser    },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Groq error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty response from Groq');
  return text.trim();
}

// ── Toast ─────────────────────────────────────────────────
let _toastTimer;
function showToast(type, icon, msg) {
  const t  = document.getElementById('toast');
  const ti = document.getElementById('toastIcon');
  const tm = document.getElementById('toastMsg');
  if (!t) return;
  ti.textContent = icon;
  tm.innerHTML   = msg;
  t.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

// ── Formatters ────────────────────────────────────────────
function formatPrice(p) {
  if (!p) return '0.00';
  const n = parseFloat(p);
  if (n >= 1000)   return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (n >= 1)      return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(4);
}
function formatNum(n) {
  if (!n) return '0';
  const num = parseFloat(n);
  if (num >= 1e9) return (num/1e9).toFixed(2)+'B';
  if (num >= 1e6) return (num/1e6).toFixed(2)+'M';
  if (num >= 1e3) return (num/1e3).toFixed(2)+'K';
  return Math.round(num).toLocaleString();
}
function getChainLabel(chainId) {
  const chains = {
    '56':     { name:'BSC',    cls:'chain-bsc'  },
    '8453':   { name:'Base',   cls:'chain-base' },
    'CT_501': { name:'Solana', cls:'chain-sol'  },
    'CEX':    { name:'CEX',    cls:'chain-bsc'  },
  };
  return chains[chainId] || { name: chainId, cls: 'chain-bsc' };
}
function statBox(label, val, cls) {
  return `<div class="stat-box"><label>${label}</label><div class="val ${cls}">${val||'—'}</div></div>`;
}
function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60)   return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400)return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

// ── Sound alert ───────────────────────────────────────────
function playAlertSound(isPump) {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = isPump ? [440,554,659] : [330,277,220];
    freqs.forEach((freq,i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i*0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.15 + 0.4);
      osc.start(ctx.currentTime + i*0.15);
      osc.stop(ctx.currentTime  + i*0.15 + 0.4);
    });
  } catch(e) {}
}

// ── Shared Composer (right panel) ─────────────────────────
function loadComposer(content) {
  const ta = document.getElementById('postContent');
  if (ta) { ta.value = content || ''; updateCharCount(); }
}
function updateCharCount() {
  const ta  = document.getElementById('postContent');
  const cnt = document.getElementById('charCount');
  if (ta && cnt) cnt.textContent = ta.value.length;
}
function clearComposer() {
  const ta = document.getElementById('postContent');
  if (ta) { ta.value = ''; updateCharCount(); }
}

// ── Modal close on overlay click ─────────────────────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

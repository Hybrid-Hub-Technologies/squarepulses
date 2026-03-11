// ============================================================
// core.js — Shared utilities for SquarePulse
// ============================================================

// ── Global state ─────────────────────────────────────────
window.SP = {
  email:    localStorage.getItem('sq_email')      || '',
  userId:   localStorage.getItem('sq_user_id')    || '',
  apiKey:   localStorage.getItem('sq_api_key')   || '',
  groqKey:  localStorage.getItem('sq_groq_key')  || '',
  waKey:    localStorage.getItem('sq_wa_key')     || '',
  ethKey:   localStorage.getItem('sq_eth_key')    || '',
  cpKey:    localStorage.getItem('sq_cp_key')     || '',
  watchlist: JSON.parse(localStorage.getItem('sq_watchlist') || '[]'),
  activeMainTab: 'signals',
};

// ── Load Groq Key from Backend (from .env) ─────────────────
async function loadGroqKeyFromEnv() {
  try {
    const res = await fetch('http://localhost:5000/api/keys');
    const data = await res.json();
    if (data.groqKey && !localStorage.getItem('sq_groq_key')) {
      SP.groqKey = data.groqKey;
      console.log('✅ Loaded Groq API key from backend');
    }
  } catch(e) {
    console.log('Could not load key from backend:', e.message);
  }
}
loadGroqKeyFromEnv();

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
    sq_email:    document.getElementById('emailInput')?.value.trim() || '',
  };
  const map = { sq_api_key:'apiKey', sq_groq_key:'groqKey', sq_wa_key:'waKey', sq_eth_key:'ethKey', sq_cp_key:'cpKey', sq_email:'email' };
  Object.entries(keys).forEach(([lsKey, val]) => {
    if (val) { SP[map[lsKey]] = val; localStorage.setItem(lsKey, val); }
  });
  
  // Send API key to backend for encryption and storage
  if (keys.sq_api_key) {
    const userId = SP.userId || generateUserId();
    SP.userId = userId;
    localStorage.setItem('sq_user_id', userId);
    
    fetch('http://localhost:5000/api/users/' + userId + '/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: keys.sq_api_key, email: keys.sq_email })
    }).catch(e => console.log('Could not save key to backend:', e.message));
  }
  
  updateApiKeyBtn();
  closeApiModal();
  showToast('success','✅','Keys saved!');
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
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
async function postToSquare(content, btnEl, imageInputId) {
  if (!content?.trim()) { showToast('info','📝','Write something first'); return; }
  if (!SP.apiKey)        { showToast('error','🔑','Set your API Key first'); openApiModal(); return; }

  if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner"></span> Posting...'; }

  try {
    // Collect image if provided
    let imageData = null;
    if (imageInputId) {
      const imageInput = document.getElementById(imageInputId);
      if (imageInput && imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }
    }

    // Build request body
    const requestBody = { apiKey: SP.apiKey, content };
    if (imageData) {
      requestBody.imageData = imageData;
    }

    const res  = await fetch('proxy.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();

    if (data.code === '000000') {
      const postId = data.data?.id;
      const url = postId ? `https://www.binance.com/square/post/${postId}` : null;
      
      // Delay success message by 3-5 seconds and add image indicator
      setTimeout(() => {
        showToast('success','🚀', url
          ? `✅ Posted ${imageData ? '🖼️' : ''}! <a href="${url}" target="_blank" style="color:var(--accent);text-decoration:underline;cursor:pointer;font-weight:bold;">📖 VIEW POST</a>`
          : '✅ Posted to Binance Square!');
      }, 3000);
      
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
// NOTE: Called through backend proxy to avoid CORS issues
async function callClaude(systemPrompt, userPrompt, useSearch = true) {
  if (!systemPrompt || !userPrompt) {
    throw new Error('Missing system or user prompt');
  }

  // If search needed, prepend a note so the model knows to use its training knowledge
  const finalUser = useSearch
    ? `[Use your latest training knowledge for current info]\n\n${userPrompt}`
    : userPrompt;

  try {
    const res = await fetch('http://localhost:5000/api/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt: finalUser
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `Groq error ${res.status}`);
    }

    const data = await res.json();
    const text = data?.text || '';
    if (!text) throw new Error('Empty response from Groq');
    return text.trim();

  } catch (error) {
    console.error('Groq call failed:', error.message);
    throw error;
  }
}

// ── Edit Post with AI ───────────────────────────────────────
async function editPostWithAI(textareaId, instructionsId, btnEl) {
  const textarea = document.getElementById(textareaId);
  const instructionsInput = document.getElementById(instructionsId);
  
  if (!textarea?.value?.trim()) {
    showToast('info','📝','Generate or write a post first');
    return;
  }
  
  const editInstructions = instructionsInput?.value?.trim();
  if (!editInstructions) {
    showToast('info','💭','Tell AI how to edit your post');
    return;
  }

  if (!SP.groqKey) {
    showToast('error','🔑','Set your Groq API Key first');
    openApiModal();
    return;
  }

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="spinner"></span> Editing...';
  }

  try {
    const currentPost = textarea.value;
    const systemPrompt = `You are an expert crypto trader and social media expert. Edit the provided post based on the user's instructions. Keep the information accurate and factual. Return ONLY the edited post text, without any explanations or markdown formatting.`;
    
    const userPrompt = `Here's the current post:\n\n${currentPost}\n\nEdit instructions: ${editInstructions}\n\nProvide the edited post:`;
    
    const editedPost = await callClaude(systemPrompt, userPrompt, false);
    
    textarea.value = editedPost;
    if (typeof syncComposer === 'function') syncComposer(textarea);
    instructionsInput.value = '';
    
    showToast('success','✨','Post edited with AI!');
  } catch (e) {
    console.error('Error editing post:', e);
    showToast('error','⚠', e.message || 'Failed to edit post');
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = '🤖 Edit with AI';
    }
  }
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
      gain.gain.setValueAtTime(0, ctx.currentTime + i*0.15 + 0.1);
      osc.start(ctx.currentTime + i*0.15);
      osc.stop(ctx.currentTime + i*0.15 + 0.1);
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

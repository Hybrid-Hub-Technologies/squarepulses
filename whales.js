// ============================================================
// whales.js — Whale Movements Tab
// Sources: Whale Alert API (free) + Etherscan + BSCscan
// Post generation: Groq AI
// ============================================================

let _whaleItems    = [];
let _selectedWhale = null;

// Free API keys (user can optionally add their own for higher limits)
// Whale Alert: whale-alert.io/api → free tier = 10 req/min, last 1hr txns
// Etherscan:   etherscan.io/apis  → free tier = 5 req/sec
const WHALE_ALERT_KEY = localStorage.getItem('sq_wa_key')  || '';
const ETHERSCAN_KEY   = localStorage.getItem('sq_eth_key') || 'YourApiKeyToken';
const BSCSCAN_KEY     = localStorage.getItem('sq_bsc_key') || 'YourApiKeyToken';

// Min USD value to show as whale ($500k+)
const WHALE_MIN_USD = 500000;

// ── Load Tab ──────────────────────────────────────────────
async function loadWhalesTab() {
  const container = document.getElementById('whales-feed');
  if (!container) return;
  container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> Scanning whale movements...</div>';

  try {
    const [waRes, ethRes, bscRes] = await Promise.allSettled([
      fetchWhaleAlertTxns(),
      fetchEtherscanWhales(),
      fetchBSCScanWhales(),
    ]);

    let all = [];
    if (waRes.status  === 'fulfilled') all = all.concat(waRes.value);
    if (ethRes.status === 'fulfilled') all = all.concat(ethRes.value);
    if (bscRes.status === 'fulfilled') all = all.concat(bscRes.value);

    // Deduplicate by txHash
    const seen = new Set();
    all = all.filter(w => {
      if (seen.has(w.txHash)) return false;
      seen.add(w.txHash);
      return true;
    });

    // Sort by USD value desc
    all.sort((a, b) => parseFloat(b.usdValueRaw||0) - parseFloat(a.usdValueRaw||0));

    if (!all.length) {
      // Fallback: show recent known whale wallets activity via CoinGecko
      all = await fetchCoinGeckoWhaleProxy();
    }

    if (!all.length) throw new Error('No whale data available right now');

    _whaleItems = all.slice(0, 20).map((w, i) => ({ ...w, id: i+1 }));
    renderWhalesFeed(_whaleItems);

  } catch(e) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🐋</div>
        <p>Could not load whale data.<br><small style="color:var(--muted)">${e.message}</small></p>
        <div style="margin-top:12px;font-size:0.78rem;color:var(--muted);line-height:1.6">
          Add free API keys in ⚙ for better data:<br>
          • <a href="https://whale-alert.io/api" target="_blank" style="color:var(--accent)">Whale Alert (whale-alert.io)</a><br>
          • <a href="https://etherscan.io/apis" target="_blank" style="color:var(--accent)">Etherscan API</a>
        </div>
        <button class="btn btn-ghost" style="margin-top:16px" onclick="window._whalesLoaded=false;loadWhalesTab()">🔄 Retry</button>
      </div>`;
  }
}

// ── Source 1: Whale Alert API ─────────────────────────────
async function fetchWhaleAlertTxns() {
  if (!WHALE_ALERT_KEY) throw new Error('No Whale Alert key');
  const since = Math.floor(Date.now()/1000) - 3600; // last 1 hour
  const url   = `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_KEY}&min_value=${WHALE_MIN_USD}&start=${since}&limit=20`;
  const res   = await fetch(url);
  if (!res.ok) throw new Error('Whale Alert failed');
  const data  = await res.json();

  return (data.transactions || []).map(tx => ({
    source:      'WhaleAlert',
    type:        detectType(tx.from?.owner_type, tx.to?.owner_type),
    coin:        (tx.symbol || 'UNKNOWN').toUpperCase(),
    amount:      formatNum(tx.amount),
    usdValue:    '$' + formatNum(tx.amount_usd),
    usdValueRaw: tx.amount_usd,
    from:        tx.from?.owner || tx.from?.address?.substring(0,10)+'...' || 'Unknown',
    to:          tx.to?.owner   || tx.to?.address?.substring(0,10)+'...'   || 'Unknown',
    impact:      detectImpact(tx.from?.owner_type, tx.to?.owner_type),
    analysis:    buildAnalysis(tx),
    time:        new Date(tx.timestamp * 1000).toISOString(),
    txHash:      tx.hash?.substring(0,12) || ('wa-'+tx.id),
    explorerUrl: tx.blockchain ? `https://www.blockchain.com/explorer/transactions/${tx.blockchain}/${tx.hash}` : '',
  }));
}

// ── Source 2: Etherscan Large ETH Transfers ───────────────
async function fetchEtherscanWhales() {
  // Get top ETH transfers in last block range (free key works)
  const key = ETHERSCAN_KEY !== 'YourApiKeyToken' ? ETHERSCAN_KEY : '';
  if (!key) throw new Error('No Etherscan key');
  const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x&page=1&offset=20&sort=desc&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Etherscan failed');
  const data = await res.json();

  return (data.result || [])
    .filter(tx => parseFloat(tx.value) / 1e18 * 3000 > WHALE_MIN_USD) // rough ETH price
    .map(tx => {
      const ethAmt = (parseFloat(tx.value) / 1e18).toFixed(2);
      const usdEst = parseFloat(ethAmt) * 3000;
      return {
        source:      'Etherscan',
        type:        'TRANSFER',
        coin:        'ETH',
        amount:      formatNum(ethAmt),
        usdValue:    '~$' + formatNum(usdEst),
        usdValueRaw: usdEst,
        from:        tx.from.substring(0,10)+'...',
        to:          tx.to.substring(0,10)+'...',
        impact:      'NEUTRAL',
        analysis:    `Large ETH transfer of ${formatNum(ethAmt)} ETH detected on-chain.`,
        time:        new Date(parseInt(tx.timeStamp)*1000).toISOString(),
        txHash:      tx.hash.substring(0,12),
        explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
      };
    });
}

// ── Source 3: BSCScan Large BNB Transfers ─────────────────
async function fetchBSCScanWhales() {
  const key = BSCSCAN_KEY !== 'YourApiKeyToken' ? BSCSCAN_KEY : '';
  if (!key) throw new Error('No BSCScan key');
  const url = `https://api.bscscan.com/api?module=account&action=tokentx&page=1&offset=20&sort=desc&apikey=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('BSCScan failed');
  const data = await res.json();

  return (data.result || [])
    .filter(tx => parseFloat(tx.value) / 1e18 * 600 > WHALE_MIN_USD)
    .map(tx => {
      const bnbAmt = (parseFloat(tx.value) / 1e18).toFixed(2);
      const usdEst = parseFloat(bnbAmt) * 600;
      return {
        source:      'BSCScan',
        type:        'TRANSFER',
        coin:        'BNB',
        amount:      formatNum(bnbAmt),
        usdValue:    '~$' + formatNum(usdEst),
        usdValueRaw: usdEst,
        from:        tx.from.substring(0,10)+'...',
        to:          tx.to.substring(0,10)+'...',
        impact:      'NEUTRAL',
        analysis:    `Large BNB transfer of ${formatNum(bnbAmt)} BNB on BSC chain.`,
        time:        new Date(parseInt(tx.timeStamp)*1000).toISOString(),
        txHash:      tx.hash.substring(0,12),
        explorerUrl: `https://bscscan.com/tx/${tx.hash}`,
      };
    });
}

// ── Fallback: CoinGecko top movers as whale proxy ─────────
async function fetchCoinGeckoWhaleProxy() {
  const res  = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false');
  if (!res.ok) return [];
  const coins = await res.json();

  return coins.map((c, i) => ({
    source:      'CoinGecko',
    type:        c.price_change_percentage_24h > 0 ? 'EXCHANGE_OUT' : 'EXCHANGE_IN',
    coin:        c.symbol.toUpperCase(),
    amount:      formatNum(c.total_volume / (c.current_price||1)),
    usdValue:    '$' + formatNum(c.total_volume),
    usdValueRaw: c.total_volume,
    from:        c.price_change_percentage_24h > 0 ? 'Unknown Wallets' : 'Exchange',
    to:          c.price_change_percentage_24h > 0 ? 'Exchange'        : 'Unknown Wallets',
    impact:      c.price_change_percentage_24h > 3 ? 'BULLISH' : c.price_change_percentage_24h < -3 ? 'BEARISH' : 'NEUTRAL',
    analysis:    `${c.name} has ${formatNum(c.total_volume)} USD in 24h volume with ${c.price_change_percentage_24h?.toFixed(2)}% price change.`,
    time:        new Date().toISOString(),
    txHash:      'cg-vol-'+c.id,
    explorerUrl: '',
    id:          i+1,
  }));
}

// ── Type/Impact helpers ───────────────────────────────────
function detectType(fromType, toType) {
  if (toType   === 'exchange') return 'EXCHANGE_IN';
  if (fromType === 'exchange') return 'EXCHANGE_OUT';
  if (fromType === 'mint')     return 'MINT';
  if (toType   === 'burn')     return 'BURN';
  return 'TRANSFER';
}
function detectImpact(fromType, toType) {
  if (toType   === 'exchange') return 'BEARISH';  // sending to exchange = likely sell
  if (fromType === 'exchange') return 'BULLISH';  // withdrawing from exchange = holding
  return 'NEUTRAL';
}
function buildAnalysis(tx) {
  const amt  = formatNum(tx.amount);
  const coin = (tx.symbol||'').toUpperCase();
  const usd  = '$' + formatNum(tx.amount_usd);
  const from = tx.from?.owner || 'unknown wallet';
  const to   = tx.to?.owner   || 'unknown wallet';
  if (tx.to?.owner_type   === 'exchange') return `${amt} ${coin} (${usd}) moved TO exchange — potential sell pressure.`;
  if (tx.from?.owner_type === 'exchange') return `${amt} ${coin} (${usd}) withdrawn FROM exchange — likely accumulation.`;
  return `${amt} ${coin} (${usd}) transferred from ${from} to ${to}.`;
}

// ── Render ────────────────────────────────────────────────
function renderWhalesFeed(items) {
  const container = document.getElementById('whales-feed');
  if (!container) return;

  const typeIcon   = { TRANSFER:'💸', EXCHANGE_IN:'📥', EXCHANGE_OUT:'📤', MINT:'🪙', BURN:'🔥' };
  const impactClr  = { BEARISH:'var(--red)', BULLISH:'var(--green)', NEUTRAL:'var(--muted)' };
  const sources    = [...new Set(items.map(i=>i.source))];

  const statsBar = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <span style="font-size:0.72rem;color:var(--muted)">${items.length} whale txns:</span>
      ${sources.map(s=>`<span class="chain-badge chain-bsc">${s}</span>`).join('')}
    </div>`;

  const html = items.map(item => `
    <div class="whale-item" id="wh-${item.id}" onclick="selectWhale(${item.id})">
      <div class="whale-icon">${typeIcon[item.type]||'🐋'}</div>
      <div class="whale-info">
        <div class="w-title">
          ${item.amount} <strong>${item.coin}</strong>
          <span style="color:${impactClr[item.impact]};font-size:0.78rem;margin-left:6px">${item.impact}</span>
        </div>
        <div class="w-detail">${item.from} → ${item.to}</div>
        <div style="font-size:0.72rem;color:var(--muted);margin-top:3px">${item.analysis}</div>
      </div>
      <div class="whale-amount">
        <div>${item.usdValue}</div>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:3px">${whaleTimeLabel(item.time)}</div>
        <div style="font-size:0.62rem;color:var(--muted);margin-top:2px">${item.source}</div>
      </div>
    </div>`).join('');

  container.innerHTML = statsBar + `<div class="whale-feed fade-up">${html}</div>`;
}

// ── Select Whale ──────────────────────────────────────────
function selectWhale(id) {
  document.querySelectorAll('.whale-item').forEach(w => w.classList.remove('selected'));
  document.getElementById('wh-'+id)?.classList.add('selected');
  _selectedWhale = _whaleItems.find(w => w.id === id);
  if (!_selectedWhale) return;

  const preview = document.getElementById('whale-preview');
  if (!preview) return;
  const w = _selectedWhale;
  const impactCls = { BEARISH:'red', BULLISH:'green', NEUTRAL:'' };

  preview.innerHTML = `
    <div style="font-weight:700;font-size:0.95rem;margin-bottom:10px">
      ${w.amount} ${w.coin} Movement
    </div>
    <div class="detail-grid" style="margin-top:0">
      ${statBox('USD Value', w.usdValue, 'gold')}
      ${statBox('Impact', w.impact, impactCls[w.impact]||'')}
      ${statBox('Type', w.type.replace('_',' '), '')}
      ${statBox('Time', whaleTimeLabel(w.time), '')}
    </div>
    <div style="margin-top:12px;font-size:0.8rem;color:var(--muted)">
      From: <code style="font-size:0.72rem;color:var(--text)">${w.from}</code>
    </div>
    <div style="margin-top:6px;font-size:0.8rem;color:var(--muted)">
      To: <code style="font-size:0.72rem;color:var(--text)">${w.to}</code>
    </div>
    <div style="margin-top:10px;font-size:0.82rem;color:var(--text);line-height:1.6">${w.analysis}</div>
    ${w.explorerUrl ? `<a href="${w.explorerUrl}" target="_blank" style="display:inline-block;margin-top:10px;font-size:0.75rem;color:var(--accent);text-decoration:none">View on Explorer →</a>` : ''}`;
}

// ── Generate Post ─────────────────────────────────────────
async function generateWhalePost() {
  if (!_selectedWhale) { showToast('info','🐋','Select a whale movement first'); return; }

  const btn = document.getElementById('whaleGenBtn');
  if (btn) { btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Analyzing...'; }

  const w = _selectedWhale;
  try {
    const post = await callClaude(
      `You are a crypto on-chain analyst writing for Binance Square. Write engaging, concise posts. Max 500 characters. Use 🐋 emoji. Explain market impact clearly. End with hashtags.`,
      `Write a Binance Square post about this whale movement:

${w.amount} ${w.coin} (${w.usdValue}) — ${w.type.replace('_',' ')}
From: ${w.from} → To: ${w.to}
Market Impact: ${w.impact}
Analysis: ${w.analysis}

Keep under 500 chars. End with hashtags like #WhaleAlert #${w.coin} #Crypto #OnChain.`,
      false
    );
    loadComposer(post);
    showToast('success','✨','Post generated!');
  } catch(e) {
    showToast('error','❌', SP.groqKey ? 'Generation failed: '+e.message : 'Add Groq key in ⚙ API Keys (free at groq.com)');
  }

  if (btn) { btn.disabled=false; btn.innerHTML='✨ Generate Post'; }
}

// ── Helpers ───────────────────────────────────────────────
function whaleTimeLabel(timeStr) {
  if (!timeStr) return 'Recently';
  const diff = Math.floor((Date.now() - new Date(timeStr)) / 60000);
  if (isNaN(diff)||diff<0) return 'Just now';
  if (diff < 60)   return diff+'m ago';
  if (diff < 1440) return Math.floor(diff/60)+'h ago';
  return Math.floor(diff/1440)+'d ago';
}

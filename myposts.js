// ============================================================
// myposts.js — 24/7 Post Tracking & Management
// ============================================================

const API_URL = 'http://localhost:5000/api';
let currentPage = 1;
let alertCheckInterval = null;

// Helper functions
function formatPrice(p) {
  if (!p) return '0.00';
  const n = parseFloat(p);
  if (n >= 1000)   return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (n >= 1)      return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  return n.toExponential(4);
}

function timeAgo(date) {
  if (typeof date === 'string') date = new Date(date);
  if (!(date instanceof Date)) return 'unknown';
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60)   return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400)return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

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
    });
  } catch(e) {
    console.log('Alert sound unavailable');
  }
}

// Fallback showToast if not defined by index.html
if (typeof window.showToast === 'undefined') {
  window.showToast = function(type, icon, msg) {
    console.log(`${icon} [${type}] ${msg}`);
  };
}

// Load posts on tab switch
async function loadMyPosts(page = 1) {
  currentPage = page;
  const btn = document.getElementById('mypostsRefreshBtn');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/posts?page=${page}`);
    const data = await res.json();

    renderPostsTable(data.posts);
    renderPagination(data.pages, page);
    updateStats(data.posts);

    showToast('success', '📋', 'Posts loaded');
    
    // Start alert checking when tab opens
    startAlertChecking();
  } catch (error) {
    console.error('Error loading posts:', error);
    showToast('error', '❌', 'Failed to load posts');
    document.getElementById('mypostsBody').innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:30px;color:var(--red)">
        ⚠️ Backend not running. Start with: npm start in /backend folder
      </td></tr>
    `;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Start checking for TP/SL alerts periodically
function startAlertChecking() {
  if (alertCheckInterval) return; // Already running

  checkForAlerts(); // Check immediately
  
  // Check every 5 minutes for alerts
  alertCheckInterval = setInterval(checkForAlerts, 5 * 60 * 1000);
  console.log('🔔 Alert checking started');
}

function stopAlertChecking() {
  if (alertCheckInterval) {
    clearInterval(alertCheckInterval);
    alertCheckInterval = null;
    console.log('🔔 Alert checking stopped');
  }
}

// Check for pending TP/SL alerts
async function checkForAlerts() {
  try {
    const res = await fetch(`${API_URL}/posts/alerts/pending`);
    const alerts = await res.json();

    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        await handleAlert(alert);
      }
      // Refresh the table
      loadMyPosts(currentPage);
    }
  } catch (error) {
    console.log('Alert check failed:', error.message);
  }
}

// Handle individual alert - auto-post with user's Binance key
async function handleAlert(alert) {
  const binanceKey = localStorage.getItem('sq_api_key');
  if (!binanceKey) {
    console.log(`⚠️ Cannot auto-post ${alert.coin_symbol} - Binance API Key not set`);
    return;
  }

  let autoPostContent = '';
  let alertType = '';
  const originalPostLink = alert.post_url ? `\n\n📖 Original Signal: ${alert.post_url}` : '';

  if (alert.tp1_hit_at && !alert.tp2_hit_at && !alert.sl_hit_at) {
    alertType = 'TP1';
    autoPostContent = `🎉 TP1 HIT! $${alert.coin_symbol} reached target! 📈\n\n💰 Entry: $${formatPrice(alert.entry_price)}\n✅ TP1 Target: $${formatPrice(alert.tp1)}\n🎯 Next Target: $${formatPrice(alert.tp2)}\n\nRide the wave! #${alert.coin_symbol} #CryptoProfits #Profitable${originalPostLink}`;
  } else if (alert.tp2_hit_at) {
    alertType = 'TP2';
    autoPostContent = `🚀 TP2 HIT! $${alert.coin_symbol} reached second target! 💰\n\n✅ TP1: $${formatPrice(alert.tp1)}\n🎯 TP2: $${formatPrice(alert.tp2)}\n\nLock in those gains and take profit! #${alert.coin_symbol} #Trading #Successful${originalPostLink}`;
  } else if (alert.sl_hit_at) {
    alertType = 'SL';
    autoPostContent = `⚠️ Stop Loss Hit - $${alert.coin_symbol}\n\nPrice hit stop loss at $${formatPrice(alert.sl)}.\n\nThe trade didn't work out. Cut losses & move to next opportunity.\nDOYR - Not financial advice.\n\n#RiskManagement #Trading${originalPostLink}`;
  }

  if (!autoPostContent) return;

  // Auto-post using user's Binance API key
  try {
    const res = await fetch('http://localhost:5000/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: binanceKey, content: autoPostContent })
    });
    const data = await res.json();

    if (data.code === '000000' || data.data?.id) {
      // Mark as posted
      await fetch(`${API_URL}/posts/${alert.id}/posted`, { method: 'PATCH' });
      
      const sound = alertType === 'TP1' || alertType === 'TP2' ? true : false;
      playAlertSound(sound);
      
      const icon = alertType === 'TP1' ? '✅' : alertType === 'TP2' ? '🚀' : '🛑';
      showToast('success', icon, `${alertType} Auto-posted for ${alert.coin_symbol}!`);
      
      console.log(`📤 ${alertType} alert auto-posted for ${alert.coin_symbol}`);
    } else {
      console.log(`Failed to auto-post ${alertType}: ${data.code}`);
    }
  } catch (error) {
    console.error(`Error auto-posting ${alertType}:`, error.message);
  }
}

function renderPostsTable(posts) {
  const tbody = document.getElementById('mypostsBody');
  
  if (!posts || posts.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:30px;color:var(--muted)">
        No posts yet. Start posting to track them here!
      </td></tr>
    `;
    return;
  }

  tbody.innerHTML = posts.map(post => {
    const statusColor = post.status === 'ACTIVE' ? 'var(--accent)' 
                      : post.status === 'TP1_HIT' ? 'var(--green)'
                      : post.status === 'TP2_HIT' ? 'var(--accent)'
                      : post.status === 'SL_HIT' ? 'var(--red)'
                      : 'var(--muted)';
    
    const age = timeAgo(new Date(post.created_at));
    
    const statusBadge = post.tp2_hit_at ? '🚀 TP2' 
                      : post.tp1_hit_at ? '✅ TP1'
                      : post.sl_hit_at ? '🛑 SL'
                      : '🟢 LIVE';
    
    return `
      <tr style="border-bottom:1px solid var(--border);transition:all 0.2s;hover:background:var(--surface)">
        <td style="padding:12px;font-weight:700">${post.coin_symbol}</td>
        <td style="text-align:right;padding:12px;color:var(--muted)">$${formatPrice(post.entry_price)}</td>
        <td style="text-align:right;padding:12px;color:var(--green);font-weight:600">$${formatPrice(post.tp1)}</td>
        <td style="text-align:right;padding:12px;color:var(--accent);font-weight:600">$${formatPrice(post.tp2)}</td>
        <td style="text-align:right;padding:12px;color:var(--red)">$${formatPrice(post.sl)}</td>
        <td style="text-align:center;padding:12px">
          <span style="background:${statusColor}0f;color:${statusColor};padding:4px 8px;border-radius:4px;font-size:0.75rem;font-weight:700;border:1px solid ${statusColor}3f">
            ${statusBadge}
          </span>
        </td>
        <td style="text-align:center;padding:12px;color:var(--muted);font-size:0.8rem">${age}</td>
        <td style="text-align:center;padding:12px">
          <button class="btn btn-ghost" onclick="closePost(${post.id})" style="font-size:0.75rem;padding:6px 10px">Close</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination(pages, currentPage) {
  const pagination = document.getElementById('mypostsPagination');
  let html = '';

  // Previous button
  if (currentPage > 1) {
    html += `<button class="btn btn-ghost" onclick="loadMyPosts(${currentPage - 1})" style="padding:8px 12px">← Prev</button>`;
  }

  // Page numbers
  for (let i = 1; i <= pages; i++) {
    if (i === currentPage) {
      html += `<button class="btn btn-primary" style="padding:8px 12px">${i}</button>`;
    } else if (i <= 3 || i > pages - 3 || Math.abs(i - currentPage) <= 1) {
      html += `<button class="btn btn-ghost" onclick="loadMyPosts(${i})" style="padding:8px 12px">${i}</button>`;
    } else if (i === 4 && currentPage > 5) {
      html += `<span style="padding:8px;color:var(--muted)">...</span>`;
    }
  }

  // Next button
  if (currentPage < pages) {
    html += `<button class="btn btn-ghost" onclick="loadMyPosts(${currentPage + 1})" style="padding:8px 12px">Next →</button>`;
  }

  pagination.innerHTML = html || '';
}

function updateStats(posts) {
  const stats = {
    active: posts.filter(p => !p.tp1_hit_at && !p.tp2_hit_at && !p.sl_hit_at).length,
    tp1: posts.filter(p => p.tp1_hit_at && !p.tp2_hit_at).length,
    tp2: posts.filter(p => p.tp2_hit_at).length,
    sl: posts.filter(p => p.sl_hit_at).length,
  };

  document.getElementById('stat-active').textContent = stats.active;
  document.getElementById('stat-tp1').textContent = stats.tp1;
  document.getElementById('stat-tp2').textContent = stats.tp2;
  document.getElementById('stat-sl').textContent = stats.sl;
}

async function closePost(postId) {
  if (!confirm('Close this post?')) return;

  try {
    await fetch(`${API_URL}/posts/${postId}/close`, { method: 'PATCH' });
    loadMyPosts(currentPage);
    showToast('success', '✓', 'Post closed');
  } catch (error) {
    showToast('error', '❌', 'Failed to close post');
  }
}

async function exportPostsCSV() {
  try {
    window.open(`${API_URL}/posts/export/csv`, '_blank');
    showToast('success', '💾', 'CSV exported');
  } catch (error) {
    showToast('error', '❌', 'Export failed');
  }
}

// Load on tab switch
document.addEventListener('DOMContentLoaded', () => {
  // Intercept tab switch for My Posts
  const originalSwitchTab = window.switchMainTab;
  window.switchMainTab = function(name, btn) {
    originalSwitchTab(name, btn);
    if (name === 'myposts') {
      loadMyPosts(1);
    } else {
      stopAlertChecking();
    }
  };
});


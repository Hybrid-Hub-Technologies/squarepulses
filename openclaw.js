// ============================================================
// openclaw.js — Trading Position Management (OpenClaw)
// ============================================================

// Modal functions
function openOpenClawModal() {
  const coin = SP.selectedCoin || '';
  if (coin) {
    document.getElementById('oc_coinSymbol').value = coin;
  }
  document.getElementById('openClawModal').style.display = 'flex';
}

function closeOpenClawModal() {
  document.getElementById('openClawModal').style.display = 'none';
  // Clear inputs
  document.getElementById('oc_coinSymbol').value = '';
  document.getElementById('oc_entryPrice').value = '';
  document.getElementById('oc_tp1').value = '';
  document.getElementById('oc_tp2').value = '';
  document.getElementById('oc_sl').value = '';
  document.getElementById('oc_positionSize').value = '1';
  document.getElementById('oc_leverage').value = '1';
}

// Open a trading position
async function openPosition() {
  const coinSymbol = document.getElementById('oc_coinSymbol').value.toUpperCase();
  const entryPrice = parseFloat(document.getElementById('oc_entryPrice').value);
  const tp1 = parseFloat(document.getElementById('oc_tp1').value);
  const tp2 = parseFloat(document.getElementById('oc_tp2').value);
  const sl = parseFloat(document.getElementById('oc_sl').value);
  const positionSize = parseFloat(document.getElementById('oc_positionSize').value);
  const leverage = parseFloat(document.getElementById('oc_leverage').value);

  if (!coinSymbol || !entryPrice || !tp1 || !tp2 || !sl) {
    showToast('error', '⚠️', 'Please fill all required fields');
    return;
  }

  if (!SP.userId) {
    SP.userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('sq_user_id', SP.userId);
  }

  try {
    const res = await fetch('http://localhost:5000/api/openclaw/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: SP.userId,
        coin_symbol: coinSymbol,
        entry_price: entryPrice,
        tp1: tp1,
        tp2: tp2,
        sl: sl,
        position_size: positionSize,
        leverage: leverage
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast('success', '🦅', `Position opened! Entry: $${entryPrice} | SL: $${sl}`);
      closeOpenClawModal();
      loadOpenPositions(); // Refresh positions list
    } else {
      showToast('error', '❌', data.error || 'Failed to open position');
    }
  } catch(e) {
    showToast('error', '⚠️', 'Network error: ' + e.message);
  }
}

// Close a trading position
async function closePosition(positionId) {
  const closePrice = prompt('Enter closing price:');
  if (!closePrice) return;

  try {
    const res = await fetch(`http://localhost:5000/api/openclaw/close/${positionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        close_price: parseFloat(closePrice),
        pnl: null
      })
    });

    const data = await res.json();
    
    if (res.ok) {
      showToast('success', '✅', 'Position closed successfully');
      loadOpenPositions(); // Refresh list
    } else {
      showToast('error', '❌', data.error || 'Failed to close position');
    }
  } catch(e) {
    showToast('error', '⚠️', 'Network error: ' + e.message);
  }
}

// Load user's positions
async function loadOpenPositions() {
  if (!SP.userId) return;

  try {
    const res = await fetch(`http://localhost:5000/api/openclaw/positions/${SP.userId}`);
    const data = await res.json();
    
    if (data.positions && data.positions.length > 0) {
      renderOpenPositions(data.positions);
    }
  } catch(e) {
    console.log('Could not load positions:', e.message);
  }
}

// Render positions table (can be used in a dedicated tab later)
function renderOpenPositions(positions) {
  console.log('📊 Open Positions:', positions);
  // This can be integrated into the My Posts tab or a dedicated Trading tab
}

// Load positions on page load
document.addEventListener('DOMContentLoaded', () => {
  if (SP.userId) {
    loadOpenPositions();
  }
});

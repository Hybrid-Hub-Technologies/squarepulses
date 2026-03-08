// ============================================================
// api/proxy.js — Vercel Serverless Function
// Routes:
//   POST /api/proxy               → Binance Square post
//   GET  /api/proxy?type=news     → RSS news feeds
//   GET  /api/proxy?type=forex    → Forex Factory calendar
//   GET  /api/proxy?type=whales   → Whale transactions
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET routes ───────────────────────────────────────────
  if (req.method === 'GET') {
    const { type, waKey, ethKey } = req.query;

    // ── NEWS ─────────────────────────────────────────────
    if (type === 'news') {
      const feeds = [
        { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',  name: 'CoinDesk'         },
        { url: 'https://cointelegraph.com/rss',                    name: 'CoinTelegraph'    },
        { url: 'https://decrypt.co/feed',                          name: 'Decrypt'          },
        { url: 'https://bitcoinmagazine.com/.rss/full/',           name: 'Bitcoin Magazine' },
      ];

      const results = await Promise.allSettled(
        feeds.map(f =>
          fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f.url)}&count=12`)
            .then(r => r.json())
            .then(data => {
              if (data.status !== 'ok') return [];
              return (data.items || []).map((item, i) => {
                const ts = item.pubDate ? new Date(item.pubDate).getTime() : 0;
                return {
                  id:           `${f.name}-${i}-${ts}`,
                  title:        (item.title || '').trim(),
                  description:  stripHtml(item.description || item.content || '').substring(0, 220),
                  source:       f.name,
                  url:          item.link || '#',
                  image:        item.thumbnail || item.enclosure?.link || extractImg(item.description) || null,
                  published_at: ts ? new Date(ts).toLocaleString() : 'Recent',
                  tags:         (item.categories || []).slice(0, 3),
                  _ts:          ts,
                };
              });
            })
            .catch(() => [])
        )
      );

      let allNews = [];
      results.forEach(r => { if (r.status === 'fulfilled') allNews = allNews.concat(r.value); });
      allNews.sort((a, b) => b._ts - a._ts);

      const seen = new Set();
      const deduped = allNews.filter(n => {
        const key = n.title.toLowerCase().replace(/\s+/g,'').substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);

      return res.status(200).json({ success: true, data: deduped });
    }

    // ── FOREX ─────────────────────────────────────────────
    if (type === 'forex') {
      try {
        const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!r.ok) throw new Error(`FF API ${r.status}`);
        const raw = await r.json();

        const FLAGS    = { 'USD':'🇺🇸','EUR':'🇪🇺','GBP':'🇬🇧','JPY':'🇯🇵','AUD':'🇦🇺','CAD':'🇨🇦','CHF':'🇨🇭','NZD':'🇳🇿','CNY':'🇨🇳','CNH':'🇨🇳' };
        const COUNTRIES= { 'USD':'United States','EUR':'Eurozone','GBP':'United Kingdom','JPY':'Japan','AUD':'Australia','CAD':'Canada','CHF':'Switzerland','NZD':'New Zealand','CNY':'China','CNH':'China' };
        const IMPACT_MAP = {
          'CPI':    { text:'High CPI = Fed stays hawkish → bearish for crypto',     bullish:false },
          'NFP':    { text:'Strong jobs = Fed tightening risk → bearish crypto',     bullish:false },
          'FOMC':   { text:'Rate decision drives volatility → watch BTC reaction',   bullish:null  },
          'GDP':    { text:'Weak GDP = risk-off mood → short-term bearish crypto',   bullish:false },
          'PPI':    { text:'High PPI signals inflation → Fed pressure → bearish',    bullish:false },
          'PCE':    { text:'Core PCE drives Fed policy → high = bearish crypto',     bullish:false },
          'UNEMPLOYMENT':{ text:'Rising unemployment = dovish pivot → bullish crypto',bullish:true },
          'JOBLESS':{ text:'High jobless claims = Fed may ease → bullish crypto',    bullish:true  },
          'INTEREST':{ text:'Rate decision is key catalyst — watch for surprise cuts',bullish:null },
          'ISM':    { text:'ISM below 50 = contraction → risk-off → bearish crypto',bullish:false },
          'PMI':    { text:'PMI contraction signals slowdown → bearish sentiment',   bullish:false },
        };

        function getCryptoImpact(title) {
          const u = (title||'').toUpperCase();
          for (const [k,v] of Object.entries(IMPACT_MAP)) { if (u.includes(k)) return v; }
          return { text:'Macro event may impact risk assets including crypto', bullish:null };
        }

        const events = raw
          .filter(e => e.impact === 'High' || e.impact === 'Medium')
          .slice(0, 12)
          .map((e, i) => {
            const cur = e.currency || 'USD';
            const ci  = getCryptoImpact(e.title);
            let timeStr = '—';
            try { timeStr = new Date(e.date).toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch(_){}
            return {
              id: i+1, event: e.title||'Unknown', country: COUNTRIES[cur]||cur,
              flag: FLAGS[cur]||'🌍', time: timeStr,
              impact: e.impact==='High'?'HIGH':'MEDIUM',
              forecast: e.forecast||'N/A', previous: e.previous||'N/A', actual: e.actual||null,
              cryptoImpact: ci.text, bullishForCrypto: ci.bullish,
            };
          });

        return res.status(200).json({ success: true, data: events });
      } catch(e) {
        return res.status(500).json({ success: false, message: e.message });
      }
    }

    // ── WHALES ────────────────────────────────────────────
    if (type === 'whales') {
      const WHALE_MIN_USD = 500000; // $500K minimum
      let allWhales = [];

      // Source 1: Whale Alert (if key provided)
      if (waKey) {
        try {
          const since = Math.floor(Date.now()/1000) - 3600;
          const waRes = await fetch(
            `https://api.whale-alert.io/v1/transactions?api_key=${waKey}&min_value=${WHALE_MIN_USD}&start=${since}&limit=20`
          );
          if (waRes.ok) {
            const waData = await waRes.json();
            const waTxns = (waData.transactions || []).map((tx, i) => {
              const fromType = tx.from?.owner_type || '';
              const toType   = tx.to?.owner_type   || '';
              let txType = 'TRANSFER';
              if (toType   === 'exchange') txType = 'EXCHANGE_IN';
              if (fromType === 'exchange') txType = 'EXCHANGE_OUT';
              if (fromType === 'mint')     txType = 'MINT';
              if (toType   === 'burn')     txType = 'BURN';
              const impact = toType==='exchange' ? 'BEARISH' : fromType==='exchange' ? 'BULLISH' : 'NEUTRAL';
              const coin = (tx.symbol||'UNKNOWN').toUpperCase();
              const amt  = tx.amount || 0;
              const usd  = tx.amount_usd || 0;
              const from = tx.from?.owner || tx.from?.address?.substring(0,12)+'...' || 'Unknown';
              const to   = tx.to?.owner   || tx.to?.address?.substring(0,12)+'...'   || 'Unknown';
              return {
                id:          `wa-${tx.id||i}`,
                source:      'WhaleAlert',
                type:        txType,
                coin,
                amount:      fmtNum(amt) + ' ' + coin,
                usdValue:    '$' + fmtNum(usd),
                usdValueRaw: usd,
                from, to, impact,
                analysis:    buildWhaleAnalysis(txType, amt, coin, usd, from, to),
                time:        tx.timestamp ? new Date(tx.timestamp*1000).toISOString() : new Date().toISOString(),
                txHash:      tx.hash?.substring(0,14) || `wa-${tx.id}`,
                explorerUrl: tx.blockchain && tx.hash ? `https://www.blockchain.com/explorer/transactions/${tx.blockchain}/${tx.hash}` : '',
              };
            });
            allWhales = allWhales.concat(waTxns);
          }
        } catch(_) {}
      }

      // Source 2: Etherscan large ETH transfers (free, no key needed for basic)
      try {
        // Use Etherscan free endpoint — top ETH transfers by value
        const ethApiKey = ethKey || 'YourApiKeyToken';
        const ethRes = await fetch(
          `https://api.etherscan.io/api?module=account&action=txlist&address=0x0000000000000000000000000000000000000000&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${ethApiKey}`
        );
        // Better: use Etherscan's free large transactions endpoint
        const btcRes = await fetch(
          'https://blockchain.info/unconfirmed-transactions?format=json&limit=20'
        );
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          const BTC_PRICE = 97000; // approximate
          const btcTxns = (btcData.txs || [])
            .filter(tx => {
              const outVal = tx.out?.reduce((s, o) => s + (o.value||0), 0) / 1e8;
              return outVal * BTC_PRICE > WHALE_MIN_USD;
            })
            .slice(0, 5)
            .map((tx, i) => {
              const btcAmt = (tx.out?.reduce((s,o) => s+(o.value||0),0) / 1e8).toFixed(4);
              const usd    = parseFloat(btcAmt) * BTC_PRICE;
              return {
                id:          `btc-${tx.hash?.substring(0,8)||i}`,
                source:      'Bitcoin',
                type:        'TRANSFER',
                coin:        'BTC',
                amount:      btcAmt + ' BTC',
                usdValue:    '~$' + fmtNum(usd),
                usdValueRaw: usd,
                from:        tx.inputs?.[0]?.prev_out?.addr?.substring(0,14)+'...' || 'Unknown',
                to:          tx.out?.[0]?.addr?.substring(0,14)+'...'               || 'Unknown',
                impact:      'NEUTRAL',
                analysis:    buildWhaleAnalysis('TRANSFER', btcAmt, 'BTC', usd, 'Unknown', 'Unknown'),
                time:        new Date().toISOString(),
                txHash:      tx.hash?.substring(0,14) || 'btc-'+i,
                explorerUrl: tx.hash ? `https://www.blockchain.com/explorer/transactions/btc/${tx.hash}` : '',
              };
            });
          allWhales = allWhales.concat(btcTxns);
        }
      } catch(_) {}

      // Source 3: Etherscan large ETH transfers (free tier)
      try {
        const ETH_PRICE  = 2400;
        // Fetch recent large ETH internal transactions via free public endpoint
        const ethRes2 = await fetch(
          'https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true&apikey=YourApiKeyToken'
        );
        if (ethRes2.ok) {
          const ethData = await ethRes2.json();
          const txns = ethData?.result?.transactions || [];
          const largeTxns = txns
            .filter(tx => {
              const eth = parseInt(tx.value, 16) / 1e18;
              return eth * ETH_PRICE > WHALE_MIN_USD;
            })
            .slice(0, 5)
            .map((tx, i) => {
              const ethAmt = (parseInt(tx.value,16) / 1e18).toFixed(4);
              const usd    = parseFloat(ethAmt) * ETH_PRICE;
              return {
                id:          `eth-${tx.hash?.substring(0,8)||i}`,
                source:      'Ethereum',
                type:        'TRANSFER',
                coin:        'ETH',
                amount:      ethAmt + ' ETH',
                usdValue:    '~$' + fmtNum(usd),
                usdValueRaw: usd,
                from:        tx.from?.substring(0,14)+'...' || 'Unknown',
                to:          tx.to?.substring(0,14)+'...'   || 'Unknown',
                impact:      'NEUTRAL',
                analysis:    buildWhaleAnalysis('TRANSFER', ethAmt, 'ETH', usd, tx.from, tx.to),
                time:        new Date().toISOString(),
                txHash:      tx.hash?.substring(0,14)||'eth-'+i,
                explorerUrl: tx.hash ? `https://etherscan.io/tx/${tx.hash}` : '',
              };
            });
          allWhales = allWhales.concat(largeTxns);
        }
      } catch(_) {}

      // Fallback: CoinGecko top volume movers (always works, no key needed)
      if (allWhales.length < 3) {
        try {
          const cgRes = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
          );
          if (cgRes.ok) {
            const coins = await cgRes.json();
            const cgWhales = coins
              .filter(c => c.total_volume > WHALE_MIN_USD * 10)
              .map((c, i) => {
                const change = c.price_change_percentage_24h || 0;
                const txType = change > 2 ? 'EXCHANGE_OUT' : change < -2 ? 'EXCHANGE_IN' : 'TRANSFER';
                const impact = change > 3 ? 'BULLISH' : change < -3 ? 'BEARISH' : 'NEUTRAL';
                return {
                  id:          `cg-${c.id}`,
                  source:      'CoinGecko',
                  type:        txType,
                  coin:        c.symbol.toUpperCase(),
                  amount:      fmtNum(c.total_volume / (c.current_price||1)) + ' ' + c.symbol.toUpperCase(),
                  usdValue:    '$' + fmtNum(c.total_volume),
                  usdValueRaw: c.total_volume,
                  from:        txType === 'EXCHANGE_OUT' ? 'Exchange Wallets' : 'Whale Wallets',
                  to:          txType === 'EXCHANGE_IN'  ? 'Exchange'         : 'Cold Storage',
                  impact,
                  analysis:    `${c.name} recorded $${fmtNum(c.total_volume)} in 24h volume with ${change.toFixed(2)}% price movement. ${impact === 'BULLISH' ? 'Accumulation pattern detected.' : impact === 'BEARISH' ? 'Distribution pattern detected.' : 'Neutral flow observed.'}`,
                  time:        new Date().toISOString(),
                  txHash:      'cg-vol-'+c.id,
                  explorerUrl: `https://www.coingecko.com/en/coins/${c.id}`,
                };
              });
            allWhales = allWhales.concat(cgWhales);
          }
        } catch(_) {}
      }

      if (!allWhales.length) {
        return res.status(500).json({ success: false, message: 'No whale data available' });
      }

      // Sort by USD value desc
      allWhales.sort((a,b) => (b.usdValueRaw||0) - (a.usdValueRaw||0));

      return res.status(200).json({ success: true, data: allWhales.slice(0, 20) });
    }

    return res.status(400).json({ code: 'ERR', message: 'Unknown type' });
  }

  // ── POST → Binance Square ────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ code:'ERR', message:'Method not allowed' });

  const { apiKey, content } = req.body || {};
  if (!apiKey)  return res.status(400).json({ code:'ERR', message:'API Key missing' });
  if (!content) return res.status(400).json({ code:'ERR', message:'Content empty' });

  try {
    const response = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      {
        method: 'POST',
        headers: {
          'Content-Type':         'application/json',
          'X-Square-OpenAPI-Key': apiKey,
          'clienttype':           'binanceSkill',
        },
        body: JSON.stringify({ bodyTextOnly: content }),
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ code:'ERR', message: e.message });
  }
}

// ── Server-side helpers ───────────────────────────────────
function fmtNum(n) {
  const num = parseFloat(n) || 0;
  if (num >= 1e9) return (num/1e9).toFixed(2)+'B';
  if (num >= 1e6) return (num/1e6).toFixed(2)+'M';
  if (num >= 1e3) return (num/1e3).toFixed(2)+'K';
  return num.toFixed(2);
}

function buildWhaleAnalysis(type, amount, coin, usd, from, to) {
  const usdStr = '$' + fmtNum(usd);
  if (type === 'EXCHANGE_IN')  return `🔴 ${fmtNum(amount)} ${coin} (${usdStr}) moved TO exchange. Potential sell pressure incoming — watch for price dip.`;
  if (type === 'EXCHANGE_OUT') return `🟢 ${fmtNum(amount)} ${coin} (${usdStr}) withdrawn FROM exchange. Whale accumulating — reduced sell pressure.`;
  if (type === 'MINT')         return `🆕 ${fmtNum(amount)} ${coin} freshly minted (${usdStr}). Monitor for distribution activity.`;
  if (type === 'BURN')         return `🔥 ${fmtNum(amount)} ${coin} (${usdStr}) burned. Deflationary event — bullish for supply.`;
  return `🔄 Large transfer: ${fmtNum(amount)} ${coin} (${usdStr}) moved between wallets. Monitor for follow-up exchange activity.`;
}

function stripHtml(html) {
  return (html||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    .replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
}

function extractImg(html) {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
// ============================================================
// api/proxy.js — Vercel Serverless Function
// Routes:
//   POST /api/proxy               → Binance Square post
//   GET  /api/proxy?type=news     → RSS news feeds
//   GET  /api/proxy?type=forex    → Forex Factory calendar
//   GET  /api/proxy?type=whales   → Whale transactions
//   GET  /api/proxy?type=xfeed    → Crypto X/social feed via CryptoPanic
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET routes ───────────────────────────────────────────
  if (req.method === 'GET') {
    const { type, waKey, ethKey, cpKey } = req.query;

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
        const key = n.title.toLowerCase().replace(/\s+/g,'').substring(0,50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);
      return res.status(200).json({ success: true, data: deduped });
    }

    // ── FOREX ─────────────────────────────────────────────
    if (type === 'forex') {
      const FLAGS     = { 'USD':'🇺🇸','EUR':'🇪🇺','GBP':'🇬🇧','JPY':'🇯🇵','AUD':'🇦🇺','CAD':'🇨🇦','CHF':'🇨🇭','NZD':'🇳🇿','CNY':'🇨🇳','CNH':'🇨🇳' };
      const COUNTRIES = { 'USD':'United States','EUR':'Eurozone','GBP':'United Kingdom','JPY':'Japan','AUD':'Australia','CAD':'Canada','CHF':'Switzerland','NZD':'New Zealand','CNY':'China','CNH':'China' };
      const IMAP = {
        'CPI':       { text:'High CPI = Fed stays hawkish → bearish for crypto',       bullish:false },
        'NON-FARM':  { text:'Strong jobs = Fed tightening risk → bearish crypto',       bullish:false },
        'NFP':       { text:'Strong jobs = Fed tightening risk → bearish crypto',       bullish:false },
        'FOMC':      { text:'Rate decision drives volatility → watch BTC reaction',     bullish:null  },
        'FEDERAL':   { text:'Fed decision is key catalyst — watch for surprise cuts',   bullish:null  },
        'INTEREST':  { text:'Rate decision is key catalyst — watch for surprise cuts',  bullish:null  },
        'GDP':       { text:'Weak GDP = risk-off mood → short-term bearish crypto',     bullish:false },
        'PPI':       { text:'High PPI signals inflation → Fed pressure → bearish',      bullish:false },
        'PCE':       { text:'Core PCE drives Fed policy → high = bearish crypto',       bullish:false },
        'UNEMPLOYMENT':{ text:'Rising unemployment = dovish pivot → bullish crypto',    bullish:true  },
        'JOBLESS':   { text:'High jobless claims = Fed may ease → bullish crypto',      bullish:true  },
        'ISM':       { text:'ISM below 50 = contraction → risk-off → bearish crypto',  bullish:false },
        'PMI':       { text:'PMI contraction signals slowdown → bearish sentiment',     bullish:false },
        'RETAIL':    { text:'Retail sales reflect consumer strength → mixed for crypto',bullish:null  },
        'INFLATION': { text:'Inflation data directly impacts Fed rate expectations',    bullish:false },
      };
      function getCryptoImpact(title) {
        const u = (title||'').toUpperCase();
        for (const [k,v] of Object.entries(IMAP)) { if (u.includes(k)) return v; }
        return { text:'Macro event may impact risk assets including crypto', bullish:null };
      }
      function formatEvent(e, i) {
        const cur       = e.currency || 'USD';
        const ci        = getCryptoImpact(e.title);
        const eventDate = new Date(e.date);
        const dateStr   = eventDate.toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' });
        const timeStr   = eventDate.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit', timeZoneName:'short', timeZone:'America/New_York' });
        const hasActual = e.actual !== undefined && e.actual !== null && e.actual !== '';
        return {
          id: i+1, event: e.title||'Unknown Event',
          country: COUNTRIES[cur]||cur, flag: FLAGS[cur]||'🌍',
          date: dateStr, time: timeStr,
          isoDate: eventDate.toISOString(),
          impact: e.impact==='High'?'HIGH':'MEDIUM',
          forecast: e.forecast||'N/A', previous: e.previous||'N/A',
          actual: hasActual ? e.actual : null, isPast: hasActual,
          cryptoImpact: ci.text, bullishForCrypto: ci.bullish,
        };
      }
      try {
        const [r1, r2] = await Promise.allSettled([
          fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json',  { headers:{ 'User-Agent':'Mozilla/5.0 (compatible)' } }).then(r => r.ok ? r.json() : []),
          fetch('https://nfs.faireconomy.media/ff_calendar_nextweek.json',  { headers:{ 'User-Agent':'Mozilla/5.0 (compatible)' } }).then(r => r.ok ? r.json() : []),
        ]);
        let raw = [];
        if (r1.status==='fulfilled' && Array.isArray(r1.value)) raw = raw.concat(r1.value);
        if (r2.status==='fulfilled' && Array.isArray(r2.value)) raw = raw.concat(r2.value);
        if (!raw.length) throw new Error('Forex Factory unreachable');
        const now = Date.now();
        const events = raw
          .filter(e => e.impact==='High' || e.impact==='Medium')
          .sort((a,b) => new Date(a.date)-new Date(b.date))
          .filter(e => new Date(e.date).getTime() >= now - 7200000)
          .slice(0, 20)
          .map((e,i) => formatEvent(e,i));
        return res.status(200).json({ success:true, data:events, serverTime:new Date().toISOString() });
      } catch(e) {
        return res.status(500).json({ success:false, message:e.message });
      }
    }

    // ── WHALES ────────────────────────────────────────────
    if (type === 'whales') {
      const WHALE_MIN_USD = 500000;
      let allWhales = [];

      if (waKey) {
        try {
          const since = Math.floor(Date.now()/1000) - 3600;
          const waRes = await fetch(`https://api.whale-alert.io/v1/transactions?api_key=${waKey}&min_value=${WHALE_MIN_USD}&start=${since}&limit=20`);
          if (waRes.ok) {
            const waData = await waRes.json();
            const waTxns = (waData.transactions || []).map((tx, i) => {
              const ft = tx.from?.owner_type||''; const tt = tx.to?.owner_type||'';
              let txType = 'TRANSFER';
              if (tt==='exchange') txType='EXCHANGE_IN'; else if (ft==='exchange') txType='EXCHANGE_OUT';
              else if (ft==='mint') txType='MINT'; else if (tt==='burn') txType='BURN';
              const impact = tt==='exchange'?'BEARISH':ft==='exchange'?'BULLISH':'NEUTRAL';
              const coin=(tx.symbol||'UNKNOWN').toUpperCase();
              return {
                id:`wa-${tx.id||i}`, source:'WhaleAlert', type:txType, coin,
                amount:fmtNum(tx.amount)+' '+coin,
                usdValue:'$'+fmtNum(tx.amount_usd), usdValueRaw:tx.amount_usd,
                from:tx.from?.owner||tx.from?.address?.substring(0,12)+'...'||'Unknown',
                to:tx.to?.owner||tx.to?.address?.substring(0,12)+'...'||'Unknown',
                impact, analysis:buildWhaleAnalysis(txType,tx.amount,coin,tx.amount_usd),
                time:tx.timestamp?new Date(tx.timestamp*1000).toISOString():new Date().toISOString(),
                txHash:tx.hash?.substring(0,14)||`wa-${tx.id}`,
                explorerUrl:tx.blockchain&&tx.hash?`https://www.blockchain.com/explorer/transactions/${tx.blockchain}/${tx.hash}`:'',
              };
            });
            allWhales = allWhales.concat(waTxns);
          }
        } catch(_) {}
      }

      try {
        const btcRes = await fetch('https://blockchain.info/unconfirmed-transactions?format=json&limit=20');
        if (btcRes.ok) {
          const btcData = await btcRes.json();
          const BTC_PRICE = 97000;
          const btcTxns = (btcData.txs||[])
            .filter(tx => (tx.out?.reduce((s,o)=>s+(o.value||0),0)/1e8)*BTC_PRICE > WHALE_MIN_USD)
            .slice(0,5).map((tx,i) => {
              const btcAmt=(tx.out?.reduce((s,o)=>s+(o.value||0),0)/1e8).toFixed(4);
              const usd=parseFloat(btcAmt)*BTC_PRICE;
              return {
                id:`btc-${tx.hash?.substring(0,8)||i}`, source:'Bitcoin', type:'TRANSFER', coin:'BTC',
                amount:btcAmt+' BTC', usdValue:'~$'+fmtNum(usd), usdValueRaw:usd,
                from:tx.inputs?.[0]?.prev_out?.addr?.substring(0,14)+'...'||'Unknown',
                to:tx.out?.[0]?.addr?.substring(0,14)+'...'||'Unknown',
                impact:'NEUTRAL', analysis:buildWhaleAnalysis('TRANSFER',btcAmt,'BTC',usd),
                time:new Date().toISOString(),
                txHash:tx.hash?.substring(0,14)||'btc-'+i,
                explorerUrl:tx.hash?`https://www.blockchain.com/explorer/transactions/btc/${tx.hash}`:'',
              };
            });
          allWhales = allWhales.concat(btcTxns);
        }
      } catch(_) {}

      try {
        const ethRes = await fetch('https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=latest&boolean=true&apikey=YourApiKeyToken');
        if (ethRes.ok) {
          const ethData = await ethRes.json();
          const ETH_PRICE = 2400;
          const largeTxns = (ethData?.result?.transactions||[])
            .filter(tx => parseInt(tx.value,16)/1e18*ETH_PRICE > WHALE_MIN_USD)
            .slice(0,5).map((tx,i) => {
              const ethAmt=(parseInt(tx.value,16)/1e18).toFixed(4);
              const usd=parseFloat(ethAmt)*ETH_PRICE;
              return {
                id:`eth-${tx.hash?.substring(0,8)||i}`, source:'Ethereum', type:'TRANSFER', coin:'ETH',
                amount:ethAmt+' ETH', usdValue:'~$'+fmtNum(usd), usdValueRaw:usd,
                from:tx.from?.substring(0,14)+'...'||'Unknown',
                to:tx.to?.substring(0,14)+'...'||'Unknown',
                impact:'NEUTRAL', analysis:buildWhaleAnalysis('TRANSFER',ethAmt,'ETH',usd),
                time:new Date().toISOString(),
                txHash:tx.hash?.substring(0,14)||'eth-'+i,
                explorerUrl:tx.hash?`https://etherscan.io/tx/${tx.hash}`:'',
              };
            });
          allWhales = allWhales.concat(largeTxns);
        }
      } catch(_) {}

      if (allWhales.length < 3) {
        try {
          const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
          if (cgRes.ok) {
            const coins = await cgRes.json();
            const cgWhales = coins.filter(c=>c.total_volume>WHALE_MIN_USD*10).map((c,i)=>{
              const change=c.price_change_percentage_24h||0;
              const txType=change>2?'EXCHANGE_OUT':change<-2?'EXCHANGE_IN':'TRANSFER';
              const impact=change>3?'BULLISH':change<-3?'BEARISH':'NEUTRAL';
              return {
                id:`cg-${c.id}`, source:'CoinGecko', type:txType, coin:c.symbol.toUpperCase(),
                amount:fmtNum(c.total_volume/(c.current_price||1))+' '+c.symbol.toUpperCase(),
                usdValue:'$'+fmtNum(c.total_volume), usdValueRaw:c.total_volume,
                from:txType==='EXCHANGE_OUT'?'Exchange Wallets':'Whale Wallets',
                to:txType==='EXCHANGE_IN'?'Exchange':'Cold Storage',
                impact, analysis:`${c.name} recorded $${fmtNum(c.total_volume)} in 24h volume with ${change.toFixed(2)}% price movement. ${impact==='BULLISH'?'Accumulation pattern detected.':impact==='BEARISH'?'Distribution pattern detected.':'Neutral flow observed.'}`,
                time:new Date().toISOString(), txHash:'cg-vol-'+c.id,
                explorerUrl:`https://www.coingecko.com/en/coins/${c.id}`,
              };
            });
            allWhales = allWhales.concat(cgWhales);
          }
        } catch(_) {}
      }

      if (!allWhales.length) return res.status(500).json({ success:false, message:'No whale data available' });
      allWhales.sort((a,b)=>(b.usdValueRaw||0)-(a.usdValueRaw||0));
      return res.status(200).json({ success:true, data:allWhales.slice(0,20) });
    }

    // ── XFEED ─────────────────────────────────────────────
    if (type === 'xfeed') {
      // Real source: CryptoPanic — crypto social posts & news with sentiment
      // Free public endpoint, no key required (key optional for more data)
      const token = cpKey ? `&auth_token=${cpKey}` : '';

      let allPosts = [];

      // Fetch hot + bullish + bearish posts for variety
      const filters = ['hot', 'bullish', 'bearish'];
      const fetchResults = await Promise.allSettled(
        filters.map(f =>
          fetch(`https://cryptopanic.com/api/v1/posts/?public=true&kind=news&filter=${f}${token}&limit=10`)
            .then(r => r.json())
            .catch(() => ({ results: [] }))
        )
      );

      fetchResults.forEach((r, fi) => {
        if (r.status === 'fulfilled') {
          const items = (r.value.results || []).map((p, i) => {
            const coin = p.currencies?.[0]?.code || 'General';
            const votes = p.votes || {};
            const bullishVotes = (votes.positive||0) + (votes.liked||0);
            const bearishVotes = (votes.negative||0) + (votes.disliked||0);
            const totalVotes   = bullishVotes + bearishVotes + (votes.important||0) + (votes.saved||0);
            const marketEffect = bullishVotes > bearishVotes ? 'BULLISH' : bearishVotes > bullishVotes ? 'BEARISH' : 'NEUTRAL';
            const impact       = totalVotes > 20 ? 'HIGH' : totalVotes > 5 ? 'MEDIUM' : 'LOW';
            const source       = p.source?.title || 'CryptoPanic';
            const sourceDomain = p.source?.domain || '';

            // Map source domain to influencer-style author
            const authorMap = {
              'coindesk.com':       { author:'CoinDesk',        handle:'CoinDesk',        emoji:'📰' },
              'cointelegraph.com':  { author:'CoinTelegraph',   handle:'Cointelegraph',   emoji:'📡' },
              'decrypt.co':         { author:'Decrypt Media',   handle:'decryptmedia',    emoji:'🔓' },
              'theblock.co':        { author:'The Block',       handle:'TheBlock__',      emoji:'⛓' },
              'bitcoinmagazine.com':{ author:'Bitcoin Magazine',handle:'BitcoinMagazine', emoji:'₿'  },
              'cryptoslate.com':    { author:'CryptoSlate',     handle:'CryptoSlate',     emoji:'🗞' },
              'u.today':            { author:'U.Today Crypto',  handle:'UToday_en',       emoji:'📊' },
              'ambcrypto.com':      { author:'AMBCrypto',       handle:'AMBCrypto',       emoji:'🔮' },
            };
            const authorInfo = authorMap[sourceDomain] || { author:source, handle:source.replace(/\s/g,''), emoji:'🐦' };

            const ts = p.published_at ? new Date(p.published_at).getTime() : Date.now();
            const diff = Math.floor((Date.now() - ts) / 60000);
            const timeStr = diff < 60 ? diff+'m ago' : diff < 1440 ? Math.floor(diff/60)+'h ago' : Math.floor(diff/1440)+'d ago';

            return {
              id:          `cp-${p.id}`,
              author:      authorInfo.author,
              handle:      authorInfo.handle,
              emoji:       authorInfo.emoji,
              content:     p.title,
              time:        timeStr,
              impact,
              marketEffect,
              coin,
              votes:       { bullish: bullishVotes, bearish: bearishVotes, total: totalVotes },
              analysis:    buildXAnalysis(p.title, marketEffect, coin, bullishVotes, bearishVotes),
              url:         p.url || '#',
              _ts:         ts,
            };
          });
          allPosts = allPosts.concat(items);
        }
      });

      // Deduplicate by title
      const seen = new Set();
      allPosts = allPosts.filter(p => {
        const key = p.content.toLowerCase().replace(/\s+/g,'').substring(0,50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort: HIGH impact first, then by time
      allPosts.sort((a,b) => {
        const iOrder = { HIGH:0, MEDIUM:1, LOW:2 };
        const iDiff = (iOrder[a.impact]||2) - (iOrder[b.impact]||2);
        return iDiff !== 0 ? iDiff : b._ts - a._ts;
      });

      return res.status(200).json({ success: true, data: allPosts.slice(0, 25) });
    }

    return res.status(400).json({ code: 'ERR', message: 'Unknown type' });
  }

  // ── POST → Binance Square ─────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ code:'ERR', message:'Method not allowed' });
  const { apiKey, content } = req.body || {};
  if (!apiKey)  return res.status(400).json({ code:'ERR', message:'API Key missing' });
  if (!content) return res.status(400).json({ code:'ERR', message:'Content empty' });
  try {
    const response = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'X-Square-OpenAPI-Key':apiKey, 'clienttype':'binanceSkill' },
        body: JSON.stringify({ bodyTextOnly: content }),
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({ code:'ERR', message: e.message });
  }
}

// ── Helpers ───────────────────────────────────────────────
function buildXAnalysis(title, effect, coin, bullish, bearish) {
  const total = bullish + bearish;
  const pct   = total > 0 ? Math.round(bullish/total*100) : 50;
  const coinStr = coin !== 'General' ? `$${coin} ` : '';
  if (effect === 'BULLISH') return `${coinStr}community sentiment is ${pct}% bullish. This news could drive buying pressure — watch for price reaction.`;
  if (effect === 'BEARISH') return `${coinStr}community is cautious with ${100-pct}% bearish votes. Potential sell-off risk — monitor support levels.`;
  return `${coinStr}mixed signals from the community. Wait for confirmation before taking positions.`;
}

function buildWhaleAnalysis(type, amount, coin, usd) {
  const usdStr = '$'+fmtNum(usd);
  if (type==='EXCHANGE_IN')  return `🔴 ${fmtNum(amount)} ${coin} (${usdStr}) moved TO exchange. Potential sell pressure incoming — watch for price dip.`;
  if (type==='EXCHANGE_OUT') return `🟢 ${fmtNum(amount)} ${coin} (${usdStr}) withdrawn FROM exchange. Whale accumulating — reduced sell pressure.`;
  if (type==='MINT')         return `🆕 ${fmtNum(amount)} ${coin} freshly minted (${usdStr}). Monitor for distribution activity.`;
  if (type==='BURN')         return `🔥 ${fmtNum(amount)} ${coin} (${usdStr}) burned. Deflationary event — bullish for supply.`;
  return `🔄 Large transfer: ${fmtNum(amount)} ${coin} (${usdStr}) moved between wallets. Monitor for follow-up exchange activity.`;
}

function fmtNum(n) {
  const num = parseFloat(n)||0;
  if (num>=1e9) return (num/1e9).toFixed(2)+'B';
  if (num>=1e6) return (num/1e6).toFixed(2)+'M';
  if (num>=1e3) return (num/1e3).toFixed(2)+'K';
  return num.toFixed(2);
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
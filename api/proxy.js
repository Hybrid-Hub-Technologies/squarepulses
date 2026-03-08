// ============================================================
// api/proxy.js — Vercel Serverless Function
// Routes:
//   POST /api/proxy              → Binance Square post
//   GET  /api/proxy?type=news    → RSS news feeds
//   GET  /api/proxy?type=forex   → Forex Factory calendar
// ============================================================

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET routes ──────────────────────────────────────────
  if (req.method === 'GET') {
    const { type } = req.query;

    // ── News: fetch all RSS feeds server-side ─────────────
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

      // Deduplicate
      const seen = new Set();
      const deduped = allNews.filter(n => {
        const key = n.title.toLowerCase().replace(/\s+/g,'').substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);

      return res.status(200).json({ success: true, data: deduped });
    }

    // ── Forex: Forex Factory calendar ────────────────────
    if (type === 'forex') {
      try {
        const r = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!r.ok) throw new Error(`FF API ${r.status}`);
        const raw = await r.json();

        const COUNTRY_FLAGS = {
          'USD':'🇺🇸','EUR':'🇪🇺','GBP':'🇬🇧','JPY':'🇯🇵',
          'AUD':'🇦🇺','CAD':'🇨🇦','CHF':'🇨🇭','NZD':'🇳🇿',
          'CNY':'🇨🇳','CNH':'🇨🇳',
        };
        const CURRENCY_COUNTRY = {
          'USD':'United States','EUR':'Eurozone','GBP':'United Kingdom',
          'JPY':'Japan','AUD':'Australia','CAD':'Canada',
          'CHF':'Switzerland','NZD':'New Zealand','CNY':'China','CNH':'China',
        };
        const CRYPTO_IMPACT = {
          'CPI':    { text:'High CPI = Fed stays hawkish → bearish for crypto',      bullish: false },
          'NFP':    { text:'Strong jobs = Fed tightening risk → bearish for crypto',  bullish: false },
          'FOMC':   { text:'Rate decision drives volatility → watch BTC reaction',    bullish: null  },
          'GDP':    { text:'Weak GDP = risk-off mood → short-term bearish crypto',    bullish: false },
          'PPI':    { text:'High PPI signals inflation → Fed pressure → bearish',     bullish: false },
          'PCE':    { text:'Core PCE drives Fed policy → high = bearish crypto',      bullish: false },
          'UNEMPLOYMENT':{ text:'Rising unemployment = dovish pivot → bullish crypto',bullish: true  },
          'JOBLESS':{ text:'High jobless claims = Fed may ease → bullish crypto',     bullish: true  },
          'INTEREST':{ text:'Rate decision is key catalyst — watch for surprise cuts',bullish: null  },
          'ISM':    { text:'ISM below 50 = contraction → risk-off → bearish crypto', bullish: false },
          'PMI':    { text:'PMI contraction signals slowdown → bearish sentiment',    bullish: false },
        };

        function getCryptoImpact(title) {
          const u = (title || '').toUpperCase();
          for (const [k, v] of Object.entries(CRYPTO_IMPACT)) {
            if (u.includes(k)) return v;
          }
          return { text: 'Macro event may impact risk assets including crypto', bullish: null };
        }

        const events = raw
          .filter(e => e.impact === 'High' || e.impact === 'Medium')
          .slice(0, 12)
          .map((e, i) => {
            const cur    = e.currency || 'USD';
            const impact = getCryptoImpact(e.title);
            let timeStr  = '—';
            try { timeStr = new Date(e.date).toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch(_){}
            return {
              id:              i + 1,
              event:           e.title || 'Unknown Event',
              country:         CURRENCY_COUNTRY[cur] || cur,
              flag:            COUNTRY_FLAGS[cur]    || '🌍',
              time:            timeStr,
              impact:          e.impact === 'High' ? 'HIGH' : 'MEDIUM',
              forecast:        e.forecast || 'N/A',
              previous:        e.previous || 'N/A',
              actual:          e.actual   || null,
              cryptoImpact:    impact.text,
              bullishForCrypto:impact.bullish,
            };
          });

        return res.status(200).json({ success: true, data: events });

      } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
      }
    }

    return res.status(400).json({ code: 'ERR', message: 'Unknown type' });
  }

  // ── POST route — Binance Square ─────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ code: 'ERR', message: 'Method not allowed' });

  const { apiKey, content } = req.body || {};
  if (!apiKey)  return res.status(400).json({ code: 'ERR', message: 'API Key missing' });
  if (!content) return res.status(400).json({ code: 'ERR', message: 'Content empty' });

  try {
    const response = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      {
        method: 'POST',
        headers: {
          'Content-Type':          'application/json',
          'X-Square-OpenAPI-Key':  apiKey,
          'clienttype':            'binanceSkill',
        },
        body: JSON.stringify({ bodyTextOnly: content }),
      }
    );
    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ code: 'ERR', message: e.message });
  }
}

// ── Server-side helpers ───────────────────────────────────
function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}
function extractImg(html) {
  if (!html) return null;
  const m = (html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
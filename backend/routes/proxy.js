const express = require('express');
const router = express.Router();
const axios = require('axios');
const Parser = require('rss-parser');

/**
 * GET /api/proxy?type=news|whales|forex|tokens
 * Proxy endpoint that aggregates data from multiple sources
 */
router.get('/proxy', async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'type parameter required' });
    }

    let data;

    switch (type) {
      case 'news':
        data = await getNewsData();
        break;
      case 'whales':
        data = await getWhaleData();
        break;
      case 'forex':
        data = await getForexData();
        break;
      case 'tokens':
        data = await getTokensData(req.query.keyword);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type parameter' });
    }

    res.json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get crypto news from RSS feeds
 */
async function getNewsData() {
  const feeds = [
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', name: 'CoinDesk' },
    { url: 'https://cointelegraph.com/rss', name: 'CoinTelegraph' },
    { url: 'https://decrypt.co/feed', name: 'Decrypt' },
    { url: 'https://bitcoinmagazine.com/.rss/full/', name: 'Bitcoin Magazine' },
  ];

  try {
    const parser = new Parser();
    const articles = [];

    for (const feed of feeds) {
      try {
        const parsedFeed = await parser.parseURL(feed.url);
        
        (parsedFeed.items || []).slice(0, 5).forEach((item) => {
          articles.push({
            title: item.title || '',
            description: stripHtml(item.content || item.description || '').substring(0, 220),
            source: feed.name,
            url: item.link || '#',
            pubDate: item.pubDate || item.isoDate || new Date(),
            thumbnail: item.imageUrl || null
          });
        });
      } catch (err) {
        console.warn(`Failed to parse feed ${feed.name}:`, err.message);
      }
    }

    return {
      success: true,
      type: 'news',
      news: articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    };
  } catch (error) {
    console.error('News fetch error:', error);
    // Return mock data if API fails
    return {
      success: true,
      type: 'news',
      news: [
        {
          title: 'Bitcoin breaks $48,000 resistance',
          description: 'Major bullish momentum detected as Bitcoin surges past key resistance levels.',
          source: 'CoinDesk',
          pubDate: new Date(),
          thumbnail: null
        },
        {
          title: 'Ethereum ETF approval expected this week',
          description: 'Regulatory clarity on Ethereum futures could boost adoption.',
          source: 'CoinTelegraph',
          pubDate: new Date(Date.now() - 3600000),
          thumbnail: null
        },
        {
          title: 'Major exchange custody solutions upgraded',
          description: 'Leading crypto platforms enhance security protocols for institutional traders.',
          source: 'Decrypt',
          pubDate: new Date(Date.now() - 7200000),
          thumbnail: null
        }
      ]
    };
  }
}

/**
 * Get whale movements (mock data for now)
 */
async function getWhaleData() {
  try {
    // Try to get from Whale Alert API if key is available
    const whaleAlertKey = process.env.WHALE_ALERT_KEY;
    
    if (whaleAlertKey) {
      try {
        const response = await axios.get('https://api.whale-alert.io/v1/transactions', {
          params: {
            api_key: whaleAlertKey,
            min_value: 1000000,
            limit: 10
          },
          timeout: 5000
        });

        return {
          success: true,
          type: 'whales',
          whales: (response.data.transactions || []).map(tx => ({
            symbol: tx.symbol.toUpperCase(),
            amount: tx.amount,
            usd_value: tx.amount_usd,
            from_address: tx.from.address,
            to_address: tx.to.address,
            transaction_type: tx.from.owner_type === 'unknown' ? 'transfer_out' : 'transfer_in',
            timestamp: tx.timestamp
          }))
        };
      } catch (apiError) {
        console.warn('Whale Alert API error:', apiError.message);
      }
    }

    // Return mock data
    return {
      success: true,
      type: 'whales',
      whales: [
        {
          symbol: 'BTC',
          amount: 15.5,
          usd_value: 775000,
          from_address: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
          to_address: '1A1z7agoat5kuNLqGtVPzVzsDmtydk5Qan',
          transaction_type: 'transfer_out',
          timestamp: Date.now()
        },
        {
          symbol: 'ETH',
          amount: 500,
          usd_value: 1500000,
          from_address: '0x1234567890123456789012345678901234567890',
          to_address: '0x0987654321098765432109876543210987654321',
          transaction_type: 'transfer_in',
          timestamp: Date.now() - 3600000
        },
        {
          symbol: 'BTC',
          amount: 8.2,
          usd_value: 410000,
          from_address: '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
          to_address: '1A1z7agoat5kuNLqGtVPzVzsDmtydk5Qan',
          transaction_type: 'transfer_out',
          timestamp: Date.now() - 7200000
        }
      ]
    };
  } catch (error) {
    console.error('Whale data error:', error);
    return {
      success: false,
      type: 'whales',
      whales: []
    };
  }
}

/**
 * Get forex economic calendar
 */
async function getForexData() {
  try {
    // Try Forex Factory API or similar
    // For now, return mock data
    return {
      success: true,
      type: 'forex',
      events: [
        {
          country: 'US',
          event: 'Non-Farm Payroll',
          impact: 'HIGH',
          date: new Date(Date.now() + 86400000).toISOString(),
          forecast: 200000,
          previous: 185000,
          actual: null
        },
        {
          country: 'US',
          event: 'CPI (Consumer Price Index)',
          impact: 'HIGH',
          date: new Date(Date.now() + 172800000).toISOString(),
          forecast: 3.5,
          previous: 3.7,
          actual: null
        },
        {
          country: 'EU',
          event: 'ECB Interest Rate Decision',
          impact: 'HIGH',
          date: new Date(Date.now() + 259200000).toISOString(),
          forecast: 5.5,
          previous: 5.5,
          actual: null
        },
        {
          country: 'UK',
          event: 'Retail Sales',
          impact: 'MEDIUM',
          date: new Date(Date.now() + 345600000).toISOString(),
          forecast: -0.5,
          previous: 0.3,
          actual: null
        }
      ]
    };
  } catch (error) {
    console.error('Forex data error:', error);
    return {
      success: false,
      type: 'forex',
      events: []
    };
  }
}

/**
 * Get tokens
 */
async function getTokensData(keyword = 'bitcoin') {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/search', {
      params: {
        query: keyword
      },
      timeout: 5000
    });

    const tokens = (response.data.coins || []).slice(0, 10).map(coin => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase() || '',
      image: coin.large || coin.thumb || null,
      price: coin.market_cap_rank ? `#${coin.market_cap_rank}` : 'N/A'
    }));

    return {
      success: true,
      type: 'tokens',
      tokens: tokens
    };
  } catch (error) {
    console.error('Tokens error:', error);
    return {
      success: false,
      type: 'tokens',
      tokens: []
    };
  }
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

module.exports = router;

// ============================================================
// api/proxy.js — Vercel Serverless Function
// Proxies requests to Binance Square API
// ============================================================

export default async function handler(req, res) {
  // CORS headers — allow requests from frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ code: 'ERR', message: 'Only POST allowed' });

  const { apiKey, content } = req.body || {};

  if (!apiKey)  return res.status(400).json({ code: 'ERR', message: 'API Key missing' });
  if (!content) return res.status(400).json({ code: 'ERR', message: 'Content empty' });

  try {
    const response = await fetch(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Square-OpenAPI-Key': apiKey,
          'clienttype': 'binanceSkill',
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

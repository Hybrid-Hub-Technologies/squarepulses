const express = require('express');
const axios = require('axios');
const db = require('../database');
const { encrypt, decrypt } = require('../utils/encryption');
const router = express.Router();

// ── USER KEY MANAGEMENT ───────────────────────────────────

// Store encrypted user Binance API key
router.post('/users/:userId/api-key', (req, res) => {
  const { userId } = req.params;
  const { apiKey, email } = req.body;

  if (!apiKey || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const encryptedKey = encrypt(apiKey);
    
    db.run(`
      INSERT OR REPLACE INTO users (id, binance_api_key_encrypted, email, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [userId, encryptedKey, email || null], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'API key saved securely' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Encryption failed' });
  }
});

// Get decrypted user key (only for backend auto-posting)
router.get('/users/:userId/api-key', (req, res) => {
  const { userId } = req.params;

  db.get('SELECT binance_api_key_encrypted FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    try {
      const decryptedKey = decrypt(row.binance_api_key_encrypted);
      res.json({ apiKey: decryptedKey });
    } catch (error) {
      res.status(500).json({ error: 'Decryption failed' });
    }
  });
});

// ── CREATE: Save new post
router.post('/posts', (req, res) => {
  const { user_id, coin_name, coin_symbol, entry_price, tp1, tp2, sl, post_content, status } = req.body;

  if (!user_id || !coin_symbol || !entry_price || !tp1 || !tp2 || !sl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(`
    INSERT INTO posts (user_id, coin_name, coin_symbol, entry_price, tp1, tp2, sl, post_content, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [user_id, coin_name, coin_symbol, entry_price, tp1, tp2, sl, post_content, status || 'ACTIVE'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Post saved successfully' });
  });
});

// ── READ: Get all active posts (paginated)
router.get('/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  db.all(`
    SELECT * FROM posts 
    WHERE status != 'CLOSED'
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.get('SELECT COUNT(*) as total FROM posts WHERE status != "CLOSED"', (err, count) => {
      res.json({
        posts: rows,
        total: count.total,
        pages: Math.ceil(count.total / limit),
        current_page: page
      });
    });
  });
});

// ── READ: Get single post
router.get('/posts/:id', (req, res) => {
  db.get('SELECT * FROM posts WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Post not found' });
    res.json(row);
  });
});

// ── UPDATE: Mark post as posted to Square
router.patch('/posts/:id/posted', (req, res) => {
  db.run('UPDATE posts SET posted_to_square = 1 WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Post marked as posted' });
  });
});

// ── UPDATE: Close post
router.patch('/posts/:id/close', (req, res) => {
  db.run('UPDATE posts SET status = ? WHERE id = ?', ['CLOSED', req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Post closed' });
  });
});

// ── DELETE: Delete post
router.delete('/posts/:id', (req, res) => {
  db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Post deleted' });
  });
});

// ── GET: Check for TP/SL alerts (for frontend auto-posting)
router.get('/posts/alerts/pending', (req, res) => {
  db.all(`
    SELECT id, coin_symbol, tp1, tp2, sl, tp1_hit_at, tp2_hit_at, sl_hit_at, entry_price, post_content
    FROM posts 
    WHERE (tp1_hit_at IS NOT NULL AND posted_to_square = 0)
       OR (tp2_hit_at IS NOT NULL AND posted_to_square = 0)
       OR (sl_hit_at IS NOT NULL AND posted_to_square = 0)
    LIMIT 10
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// ── Export as CSV
router.get('/posts/export/csv', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let csv = 'Coin,Symbol,Entry,TP1,TP2,SL,Status,Created At\n';
    rows.forEach(row => {
      csv += `${row.coin_name},${row.coin_symbol},${row.entry_price},${row.tp1},${row.tp2},${row.sl},${row.status},${row.created_at}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="posts.csv"');
    res.send(csv);
  });
});

// ── API KEYS: Get Groq API key from backend env
router.get('/keys', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY || '';
  if (!groqKey) {
    return res.status(400).json({ error: 'Groq API key not configured on server' });
  }
  res.json({ groqKey });
});

// ── GROQ PROXY: Call Groq API from backend (avoids CORS)
router.post('/claude', async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body;
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return res.status(500).json({ error: 'Groq API key not configured on server' });
    }

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or userPrompt' });
    }

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        timeout: 15000
      }
    );

    const text = response.data?.choices?.[0]?.message?.content || '';
    if (!text) {
      return res.status(500).json({ error: 'Empty response from Groq' });
    }

    res.json({ text });

  } catch (error) {
    console.error('Groq proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message,
      details: 'Failed to call Groq API'
    });
  }
});

// ── PROXY: Forward requests to Binance Square API

router.post('/proxy', async (req, res) => {
  try {
    const { apiKey, content } = req.body;

    if (!apiKey || !content) {
      return res.status(400).json({ 
        code: '220011',
        message: 'Content body must not be empty',
        msg: 'Missing apiKey or content'
      });
    }

    console.log('Posting to Binance Square with key:', apiKey.substring(0, 10) + '...');

    // Use correct Binance Square API endpoint per documentation
    const response = await axios.post(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      { bodyTextOnly: content },  // Correct field name per docs
      {
        headers: {
          'X-Square-OpenAPI-Key': apiKey,
          'Content-Type': 'application/json',
          'clienttype': 'binanceSkill'  // Required header
        },
        timeout: 10000
      }
    );

    console.log('Binance response:', response.data);
    res.json(response.data);

  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    
    const statusCode = error.response?.status || 500;
    const binanceError = error.response?.data || {};
    
    res.status(statusCode).json({
      code: binanceError.code || 'API_ERROR',
      message: binanceError.message || error.message,
      data: binanceError.data || null
    });
  }
});

// ── PROXY GET: Forward GET requests for data fetching
router.get('/proxy', async (req, res) => {
  try {
    const { type } = req.query;

    if (type === 'news') {
      // Fetch crypto news from external API
      const response = await axios.get('https://api.coingecko.com/api/v3/global', {
        timeout: 5000
      });
      return res.json(response.data);
    }

    // Default: return error
    res.status(400).json({ error: 'Unknown proxy type' });

  } catch (error) {
    console.error('Proxy GET error:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch data'
    });
  }
});

module.exports = router;

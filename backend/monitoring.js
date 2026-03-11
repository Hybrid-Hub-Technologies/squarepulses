const cron = require('node-cron');
const db = require('./database');
const axios = require('axios');
const { decrypt } = require('./utils/encryption');
const { 
  sendNotification, 
  getTP1EmailTemplate, 
  getTP2EmailTemplate, 
  getSLEmailTemplate 
} = require('./utils/emailNotifications');

let isMonitoring = false;

// Post to Binance Square using correct endpoint (via local proxy)
async function postToSquareWithKey(apiKey, content) {
  try {
    console.log('Auto-posting to Binance Square...');
    const response = await axios.post(
      'https://www.binance.com/bapi/composite/v1/public/pgc/openApi/content/add',
      { bodyTextOnly: content },
      {
        headers: {
          'X-Square-OpenAPI-Key': apiKey,
          'Content-Type': 'application/json',
          'clienttype': 'binanceSkill'
        },
        timeout: 10000
      }
    );
    
    if (response.data.code === '000000') {
      console.log('✅ Auto-post successful! ID:', response.data.data?.id);
      return response.data;
    } else {
      console.error('Auto-post failed with code:', response.data.code);
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Auto-post error:', error.response?.data || error.message);
    throw error;
  }
}

async function checkPrices() {
  console.log(`[${new Date().toISOString()}] ⏰ Checking prices for TP/SL hits...`);

  // Get all active posts
  db.all("SELECT * FROM posts WHERE status = 'ACTIVE'", async (err, posts) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }

    if (posts.length === 0) {
      console.log('No active posts to monitor');
      return;
    }

    console.log(`Monitoring ${posts.length} active trades...`);

    for (const post of posts) {
      try {
        // Get current price from CoinGecko
        const coinId = post.coin_name.toLowerCase();
        const priceRes = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
          { timeout: 5000 }
        );
        
        const currentPrice = priceRes.data[coinId]?.usd;
        if (!currentPrice) {
          console.log(`⚠️ Could not fetch price for ${post.coin_symbol}`);
          continue;
        }

        console.log(`${post.coin_symbol}: $${currentPrice} (Entry: $${post.entry_price}, TP1: $${post.tp1}, SL: $${post.sl})`);

        // Check for TP1 hit
        if (currentPrice >= post.tp1 && !post.tp1_hit_at) {
          console.log(`🎯 TP1 HIT for ${post.coin_symbol}!`);
          
          db.run(
            'UPDATE posts SET tp1_hit_at = CURRENT_TIMESTAMP WHERE id = ?',
            [post.id],
            async (err) => {
              if (err) {
                console.error('Error updating TP1:', err);
                return;
              }

              try {
                // Get user's encrypted API key
                const userRes = await new Promise((resolve, reject) => {
                  db.get('SELECT binance_api_key_encrypted, email FROM users WHERE id = ?', [post.user_id], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                  });
                });

                if (userRes && userRes.binance_api_key_encrypted) {
                  const apiKey = decrypt(userRes.binance_api_key_encrypted);
                  
                  // Auto-post TP1 hit message
                  const autoPostContent = `🎯 TP1 HIT - ${post.coin_symbol}\n\n$${post.coin_symbol} just hit TP1 at $${currentPrice}!\n\nEntry: $${post.entry_price}\nTP1: $${post.tp1}\n\nTake profits! #Trading #Crypto`;
                  
                  await postToSquareWithKey(apiKey, autoPostContent);
                  
                  // Send email notification
                  if (userRes.email) {
                    await sendNotification(userRes.email, getTP1EmailTemplate(post.coin_symbol, currentPrice, post.entry_price, post.tp1));
                  }
                }
              } catch (postErr) {
                console.error('Failed to auto-post TP1:', postErr.message);
              }
            }
          );
        }

        // Check for TP2 hit
        if (currentPrice >= post.tp2 && !post.tp2_hit_at) {
          console.log(`🚀 TP2 HIT for ${post.coin_symbol}!`);
          
          db.run(
            'UPDATE posts SET tp2_hit_at = CURRENT_TIMESTAMP WHERE id = ?',
            [post.id],
            async (err) => {
              if (err) {
                console.error('Error updating TP2:', err);
                return;
              }

              try {
                const userRes = await new Promise((resolve, reject) => {
                  db.get('SELECT binance_api_key_encrypted, email FROM users WHERE id = ?', [post.user_id], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                  });
                });

                if (userRes && userRes.binance_api_key_encrypted) {
                  const apiKey = decrypt(userRes.binance_api_key_encrypted);
                  
                  const autoPostContent = `🚀 TP2 HIT - ${post.coin_symbol}\n\n$${post.coin_symbol} reached TP2 at $${currentPrice}!\n\nEntry: $${post.entry_price}\nTP2: $${post.tp2}\n\nExcellent trade! #TradingWin #Crypto`;
                  
                  await postToSquareWithKey(apiKey, autoPostContent);
                  
                  if (userRes.email) {
                    await sendNotification(userRes.email, getTP2EmailTemplate(post.coin_symbol, currentPrice, post.entry_price, post.tp2));
                  }
                }
              } catch (postErr) {
                console.error('Failed to auto-post TP2:', postErr.message);
              }
            }
          );
        }

        // Check for SL hit
        if (currentPrice <= post.sl && !post.sl_hit_at) {
          console.log(`⚠️ STOP LOSS HIT for ${post.coin_symbol}!`);
          
          db.run(
            'UPDATE posts SET sl_hit_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?',
            ['CLOSED', post.id],
            async (err) => {
              if (err) {
                console.error('Error updating SL:', err);
                return;
              }

              try {
                const userRes = await new Promise((resolve, reject) => {
                  db.get('SELECT binance_api_key_encrypted, email FROM users WHERE id = ?', [post.user_id], (err, user) => {
                    if (err) reject(err);
                    else resolve(user);
                  });
                });

                if (userRes && userRes.binance_api_key_encrypted) {
                  const apiKey = decrypt(userRes.binance_api_key_encrypted);
                  
                  const autoPostContent = `⚠️ Stop Loss Hit - ${post.coin_symbol}\n\n$${post.coin_symbol} hit SL at $${currentPrice}.\n\nEntry: $${post.entry_price}\nSL: $${post.sl}\n\nCut losses & move to next opportunity. #RiskManagement #Trading`;
                  
                  await postToSquareWithKey(apiKey, autoPostContent);
                  
                  if (userRes.email) {
                    await sendNotification(userRes.email, getSLEmailTemplate(post.coin_symbol, currentPrice, post.entry_price, post.sl));
                  }
                }
              } catch (postErr) {
                console.error('Failed to auto-post SL:', postErr.message);
              }
            }
          );
        }
      } catch (error) {
        console.error(`Error checking ${post.coin_symbol}:`, error.message);
      }
    }
  });
}

// Start monitoring - runs every 15 minutes
function startMonitoring() {
  if (isMonitoring) return;
  
  isMonitoring = true;
  console.log('🟢 24/7 Price Monitoring Started');
  console.log('📧 Email notifications enabled (if configured)');
  
  // Check immediately on start
  checkPrices();
  
  // Then every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    checkPrices();
  });
}

function stopMonitoring() {
  isMonitoring = false;
  console.log('🔴 Price Monitoring Stopped');
}

module.exports = { startMonitoring, stopMonitoring, checkPrices };



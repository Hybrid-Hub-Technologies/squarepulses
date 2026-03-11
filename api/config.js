// Load environment variables
require('dotenv').config();

module.exports = {
  groqKey: process.env.GROQ_API_KEY || '',
  binanceKey: process.env.BINANCE_API_KEY || '',
};

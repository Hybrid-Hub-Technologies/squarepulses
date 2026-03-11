const axios = require('axios');

async function postToSquare(content) {
  const apiKey = process.env.BINANCE_SQUARE_API_KEY;
  
  if (!apiKey) {
    throw new Error('BINANCE_SQUARE_API_KEY not configured in .env');
  }

  try {
    const response = await axios.post(
      'https://api.binance.com/api/v1/square/posts',
      {
        content: content,
        type: 1
      },
      {
        headers: {
          'x-square-openapi-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Post to Square failed:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = postToSquare;

/**
 * GET /api/keys
 * Returns public safe keys (but NOT hardcoded in frontend)
 */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Only send Groq key to frontend (safe to expose)
  return res.status(200).json({
    groqKey: process.env.GROQ_API_KEY || '',
  });
};

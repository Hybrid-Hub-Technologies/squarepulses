const mongoose = require('mongoose');

// Schema definitions
const postsSchema = new mongoose.Schema({
  user_id: String,
  coin_name: String,
  coin_symbol: String,
  entry_price: Number,
  tp1: Number,
  tp2: Number,
  sl: Number,
  post_content: String,
  status: { type: String, default: 'ACTIVE' },
  tp1_hit_at: Date,
  tp2_hit_at: Date,
  sl_hit_at: Date,
  posted_to_square: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});

const usersSchema = new mongoose.Schema({
  id: { type: String, primary: true },
  binance_api_key_encrypted: String,
  email: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date
});

const priceHistorySchema = new mongoose.Schema({
  post_id: mongoose.Schema.Types.ObjectId,
  current_price: Number,
  checked_at: { type: Date, default: Date.now }
});

// Models
const Post = mongoose.model('Post', postsSchema);
const User = mongoose.model('User', usersSchema);
const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/squarepulse';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectDB, Post, User, PriceHistory, mongoose };

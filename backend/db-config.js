// db-config.js - Use SQLite locally, PostgreSQL on Vercel/Production

const isProduction = process.env.NODE_ENV === 'production';

let db;

if (isProduction) {
  // Use PostgreSQL (Supabase) in production
  const { Pool } = require('pg');
  db = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  console.log('📊 Using PostgreSQL on Supabase');
} else {
  // Use SQLite locally
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  db = new sqlite3.Database(path.join(__dirname, 'posts.db'));
  console.log('📄 Using SQLite locally');
}

module.exports = db;

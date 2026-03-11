const crypto = require('crypto');

// Encryption key from env (should be 32 bytes for aes-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'squarepulse-dev-key-32bytes!!!';

// Ensure key is correct length
const key = crypto
  .createHash('sha256')
  .update(String(ENCRYPTION_KEY))
  .digest();

function encrypt(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
}

function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
}

module.exports = { encrypt, decrypt };

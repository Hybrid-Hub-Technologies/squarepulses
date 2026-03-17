/**
 * ============================================================
 * API Key Management System
 * ============================================================
 * 
 * Securely stores and manages Binance API credentials
 * Uses encryption for sensitive data
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_DIR = path.join(__dirname, '../secure');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sp-default-key-change-in-production';

// Ensure secure directory exists
if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true, mode: 0o700 });
}

class APIKeyManager {
  /**
   * Encrypt data using AES-256
   */
  static _encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        iv
      );

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('❌ Encryption error:', error.message);
      throw error;
    }
  }

  /**
   * Decrypt data
   */
  static _decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
        iv
      );

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Decryption error:', error.message);
      throw error;
    }
  }

  /**
   * Mask sensitive API key for display
   * Shows: first 5 + last 4 characters
   */
  static maskKey(key, showLast = 4) {
    if (!key || key.length < 10) return '***';
    return key.slice(0, 5) + '*'.repeat(key.length - 9) + key.slice(-4);
  }

  /**
   * Save API credentials
   */
  static saveCredentials(accountName, apiKey, apiSecret, environment = 'mainnet') {
    try {
      const filePath = path.join(KEYS_DIR, `${accountName}.json`);

      const encrypted = {
        apiKey: this._encrypt(apiKey),
        apiSecret: this._encrypt(apiSecret),
        environment,
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(filePath, JSON.stringify(encrypted, null, 2), {
        mode: 0o600,
      });

      return {
        success: true,
        message: `✅ Credentials saved for account: ${accountName}`,
        account: {
          name: accountName,
          apiKey: this.maskKey(apiKey),
          environment,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save credentials: ${error.message}`,
      };
    }
  }

  /**
   * Load API credentials
   */
  static loadCredentials(accountName) {
    try {
      const filePath = path.join(KEYS_DIR, `${accountName}.json`);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Account "${accountName}" not found`,
        };
      }

      const encrypted = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      return {
        success: true,
        data: {
          apiKey: this._decrypt(encrypted.apiKey),
          apiSecret: this._decrypt(encrypted.apiSecret),
          environment: encrypted.environment,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load credentials: ${error.message}`,
      };
    }
  }

  /**
   * List all saved accounts
   */
  static listAccounts() {
    try {
      const files = fs.readdirSync(KEYS_DIR);
      const accounts = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(KEYS_DIR, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const accountName = file.replace('.json', '');

          // Decrypt just to verify it works
          try {
            const decrypted = this._decrypt(data.apiKey);
            accounts.push({
              name: accountName,
              apiKey: this.maskKey(decrypted),
              environment: data.environment,
              createdAt: data.createdAt,
            });
          } catch (e) {
            console.error(`⚠️ Failed to decrypt ${accountName}`);
          }
        }
      }

      return {
        success: true,
        data: accounts,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list accounts: ${error.message}`,
      };
    }
  }

  /**
   * Delete saved credentials
   */
  static deleteCredentials(accountName) {
    try {
      const filePath = path.join(KEYS_DIR, `${accountName}.json`);

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Account "${accountName}" not found`,
        };
      }

      fs.unlinkSync(filePath);

      return {
        success: true,
        message: `✅ Account "${accountName}" deleted`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete credentials: ${error.message}`,
      };
    }
  }

  /**
   * Check if account exists
   */
  static accountExists(accountName) {
    try {
      const filePath = path.join(KEYS_DIR, `${accountName}.json`);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }
}

module.exports = APIKeyManager;

/**
 * ============================================================
 * OpenClaw Configuration File
 * ============================================================
 * 
 * This file contains the configuration for running OpenClaw
 * with the SquarePulse trading system
 */

module.exports = {
  // ────────────────────────────────────────────────────────────
  // OpenClaw Core Settings
  // ────────────────────────────────────────────────────────────
  
  openclaw: {
    // Version
    version: '2026.3.0',
    
    // Agent name
    name: 'SquarePulse Trading Agent',
    
    // Agent description
    description: 'AI trading assistant that manages positions, monitors prices, and executes trades',
    
    // Model configuration - adjust based on your setup
    model: {
      provider: 'openai', // Options: openai, gemini, groq, anthropic
      name: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2000,
      // Add your API key in .env file, not here!
    },
    
    // Gateway settings
    gateway: {
      host: 'localhost',
      port: 18789,
      secure: false,
      
      // Security settings
      auth: {
        enabled: true,
        // Generate a strong token - replace with actual token
        token: process.env.OPENCLAW_AUTH_TOKEN || 'change-this-strong-token-12345',
        tokenLength: 32
      },
      
      // CORS settings
      cors: {
        enabled: true,
        origins: ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'],
      }
    }
  },

  // ────────────────────────────────────────────────────────────
  // SquarePulse Backend Integration
  // ────────────────────────────────────────────────────────────
  
  squarepulse: {
    // Backend server URL
    baseUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    
    // API endpoints
    endpoints: {
      health: '/api/health',
      positions: '/api/openclaw/positions',
      trades: '/api/posts',
      alerts: '/api/posts/alerts/pending',
      portfolio: '/api/portfolio',
      stats: '/api/openclaw/stats'
    },
    
    // Polling intervals (in milliseconds)
    polling: {
      price_check: 15 * 60 * 1000, // 15 minutes
      position_update: 5 * 60 * 1000, // 5 minutes
      alert_check: 1 * 60 * 1000 // 1 minute
    },
    
    // Default user ID for OpenClaw
    userId: 'openclaw-agent'
  },

  // ────────────────────────────────────────────────────────────
  // SquarePulse Skills Configuration
  // ────────────────────────────────────────────────────────────
  
  skills: {
    // Trading Position Manager skill
    trading: {
      enabled: true,
      name: 'trading-position-manager',
      version: '1.0.0',
      description: 'Manage trading positions',
      commands: [
        'open position',
        'close position',
        'modify position',
        'get positions',
        'get trading stats'
      ]
    },
    
    // Price Monitor skill
    prices: {
      enabled: true,
      name: 'price-monitor',
      version: '1.0.0',
      description: 'Monitor cryptocurrency prices',
      commands: [
        'get current price',
        'get prices',
        'check targets',
        'market analysis'
      ],
      dataSource: 'coingecko', // Free cryptocurrency price data
      supportedCoins: ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'MATIC']
    },
    
    // Market Alerts skill
    alerts: {
      enabled: true,
      name: 'market-alerts',
      version: '1.0.0',
      description: 'Set and manage market alerts',
      commands: [
        'set price alert',
        'get active alerts',
        'cancel alert',
        'market news',
        'check volatility'
      ],
      alertTypes: ['price_reachedabove', 'price_reached_below', 'volatility_threshold', 'custom']
    },
    
    // Signals & Analysis skill (integrates with existing signals/news/whales/forex)
    signals: {
      enabled: true,
      name: 'signals-and-analysis',
      version: '1.0.0',
      description: 'Token search, market analysis, whale movements, forex events',
      commands: [
        'search tokens',
        'crypto news',
        'whale movements',
        'forex events',
        'market analysis',
        'trading signals',
        'generate post'
      ],
      dataSources: ['coingecko', 'binance-dex', 'on-chain', 'whale-alert', 'forex-factory', 'rss-feeds'],
      features: ['token_search', 'news_aggregation', 'whale_tracking', 'forex_calendar', 'signal_generation', 'post_creation']
    }
  },

  // ────────────────────────────────────────────────────────────
  // Channel Configuration (How to interact with OpenClaw)
  // ────────────────────────────────────────────────────────────
  
  channels: {
    // Web Dashboard (Recommended for initial setup)
    web: {
      enabled: true,
      url: 'http://localhost:18789',
      interface: 'modern', // Options: modern, classic, minimal
      features: ['chat', 'dashboard', 'settings', 'logs', 'position_tracker']
    },
    
    // Terminal/CLI Interface
    terminal: {
      enabled: true,
      interface: 'TUI', // Text User Interface
      commands: {
        start: 'openclaw start',
        stop: 'openclaw stop',
        restart: 'openclaw restart',
        status: 'openclaw status',
        logs: 'openclaw logs',
        dashboard: 'openclaw dashboard'
      }
    },
    
    // Telegram Bot (For mobile access)
    telegram: {
      enabled: false,
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
      features: ['trade_alerts', 'position_updates', 'price_alerts', 'commands']
    },
    
    // WhatsApp Bot
    whatsapp: {
      enabled: false,
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
    },
    
    // Slack Bot
    slack: {
      enabled: false,
      botToken: process.env.SLACK_BOT_TOKEN || '',
      appToken: process.env.SLACK_APP_TOKEN || ''
    }
  },

  // ────────────────────────────────────────────────────────────
  // Hooks Configuration (Automation)
  // ────────────────────────────────────────────────────────────
  
  hooks: {
    // On startup
    onBoot: {
      enabled: true,
      commands: [
        'initialize all skills',
        'check backend health',
        'load user positions',
        'start monitoring'
      ]
    },
    
    // On trade alert
    onTradeAlert: {
      enabled: true,
      actions: [
        'send notification',
        'log to database',
        'update dashboard',
        'backup position'
      ]
    },
    
    // On price alert
    onPriceAlert: {
      enabled: true,
      actions: [
        'send notification',
        'check take profits',
        'check stop losses',
        'evaluate positions'
      ]
    },
    
    // On shutdown
    onShutdown: {
      enabled: true,
      commands: [
        'save all positions',
        'close connections',
        'backup database'
      ]
    }
  },

  // ────────────────────────────────────────────────────────────
  // Security Configuration
  // ────────────────────────────────────────────────────────────
  
  security: {
    // Encryption for sensitive data
    encryption: {
      enabled: true,
      algorithm: 'aes-256-cbc',
      key: process.env.ENCRYPTION_KEY || 'your-encryption-key-here-change-me'
    },
    
    // API Key protection
    apiKeys: {
      storeEncrypted: true,
      requireValidation: true
    },
    
    // Access control
    accessControl: {
      requireAuth: true,
      roleBasedAccess: false,
      allowedIps: ['127.0.0.1', 'localhost'] // Restrict to local only
    },
    
    // Rate limiting
    rateLimit: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    },
    
    // Audit logging
    auditLog: {
      enabled: true,
      logFile: './logs/audit.log',
      logLevel: 'info'
    }
  },

  // ────────────────────────────────────────────────────────────
  // Notification Configuration
  // ────────────────────────────────────────────────────────────
  
  notifications: {
    // Email notifications
    email: {
      enabled: true,
      provider: 'gmail', // Gmail SMTP
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      password: process.env.EMAIL_PASSWORD || '', // Use app password for Gmail
      recipients: {
        default: process.env.EMAIL_USER || ''
      },
      templates: ['position_opened', 'position_closed', 'tp_hit', 'sl_hit', 'alert_triggered']
    },
    
    // Push notifications
    push: {
      enabled: false,
      service: 'webpush'
    },
    
    // SMS notifications
    sms: {
      enabled: false,
      provider: 'twilio'
    }
  },

  // ────────────────────────────────────────────────────────────
  // Logging & Monitoring
  // ────────────────────────────────────────────────────────────
  
  logging: {
    level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    format: 'json', // json or text
    output: {
      console: true,
      file: './logs/openclaw.log',
      maxSize: '100m',
      maxFiles: 10
    }
  },

  // ────────────────────────────────────────────────────────────
  // Feature Flags
  // ────────────────────────────────────────────────────────────
  
  features: {
    autoTrading: true, // Allow automated position opening/closing
    priceMonitoring: true, // Keep 24/7 price monitoring
    emailAlerts: true, // Send email notifications
    advancedAnalytics: true, // Use advanced market analysis
    backtesting: false, // Backtesting feature (future)
    socialTrading: false // Social trading features (future)
  }
};

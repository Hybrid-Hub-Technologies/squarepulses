// ════════════════════════════════════════════════════════════════════════════
// app.js - SquarePulse Frontend
// Connects to OpenClaw AI Intelligence Engine
// ════════════════════════════════════════════════════════════════════════════

const APP = {
  // Configuration
  apiUrl: 'http://localhost:5000',
  openclawUrl: 'http://localhost:18789',
  
  // State
  messages: [],
  isWaitingForResponse: false,
  userId: null,

  init() {
    console.log('🚀 SquarePulse initializing...');
    
    // Generate user ID
    this.userId = localStorage.getItem('userId') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', this.userId);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Show welcome message
    this.displayWelcome();
    
    console.log('✅ SquarePulse ready');
  },

  setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');

    sendBtn.addEventListener('click', () => this.sendMessage());
    
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  },

  displayWelcome() {
    this.addMessage('🤖', '👋 Hello! I\'m your SquarePulse AI Assistant powered by OpenClaw.\n\nI can help you with:\n\n🐋 Whale movements\n📰 Crypto news\n💱 Forex & economic calendar\n💰 Real-time prices\n📊 Market analysis\n🟢 Trading signals\n🔎 Token search\n\nJust ask me anything!');
  },

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message || this.isWaitingForResponse) return;

    // Clear input
    input.value = '';
    input.focus();

    // Display user message
    this.addMessage('👤', message);

    // Show typing indicator
    this.showTypingIndicator();
    this.isWaitingForResponse = true;

    try {
      // Send to OpenClaw orchestration endpoint
      const response = await fetch(`${this.apiUrl}/api/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          userId: this.userId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Hide typing indicator
      this.hideTypingIndicator();

      // Display AI response
      if (data.success && data.response) {
        this.addMessage('🤖', data.response);
      } else {
        this.addMessage('🤖', '❌ Error processing your request. Please try again.');
      }

    } catch (error) {
      console.error('Error:', error);
      this.hideTypingIndicator();
      
      // Fallback - show error
      this.addMessage('🤖', `❌ Connection error: ${error.message}\n\nMake sure backend server is running on port 5000.`);
    } finally {
      this.isWaitingForResponse = false;
    }
  },

  addMessage(sender, text) {
    const container = document.getElementById('messagesContainer');
    const msgEl = document.createElement('div');
    msgEl.className = `message ${sender === '👤' ? 'user' : 'bot'}`;
    msgEl.innerHTML = `<div class="message-bubble">${this.escapeHtml(text)}</div>`;
    
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
    
    this.messages.push({ sender, text, timestamp: new Date() });
  },

  showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'flex';
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
  },

  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => APP.init());

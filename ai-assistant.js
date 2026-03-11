// ============================================================
// ai-assistant.js — Personal AI Assistant with OpenClaw
// ============================================================

// AI Assistant State
const AIAssistant = {
  isOpen: false,
  tasks: [],
  messages: [],
  init() {
    this.loadTasks();
    this.setupEventListeners();
  },
  setupEventListeners() {
    // Chat input
    const chatInput = document.getElementById('ai-chatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  },
  async sendMessage() {
    const input = document.getElementById('ai-chatInput');
    const message = input.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addChatMessage(message, 'user');
    input.value = '';

    // Parse and execute command
    const response = await this.parseAndExecuteCommand(message);
    this.addChatMessage(response, 'bot');
  },
  addChatMessage(text, sender) {
    const chatBox = document.getElementById('ai-chatBox');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${sender}`;
    msgEl.innerHTML = `<div class="message-content">${this.escapeHtml(text)}</div>`;
    chatBox.appendChild(msgEl);
    chatBox.scrollTop = chatBox.scrollHeight;
  },
  async parseAndExecuteCommand(message) {
    const msg = message.toLowerCase();

    // 1️⃣ SCHEDULED POST (e.g., "post at 4pm about news")
    if (msg.includes('post') && (msg.includes('pm') || msg.includes('am') || msg.includes('o clock'))) {
      return this.handleScheduledPost(message);
    }

    // 2️⃣ BUY/TRADE COMMAND (e.g., "buy 5$ dash")
    if ((msg.includes('buy') || msg.includes('sell')) && msg.includes('$')) {
      return this.handleTradeCommand(message);
    }

    // 3️⃣ PROFIT/LOSS TRIGGER (e.g., "if btc profit 1$ close trade")
    if (msg.includes('if') && (msg.includes('profit') || msg.includes('loss'))) {
      return this.handleProfitTrigger(message);
    }

    // 4️⃣ RECURRING TASK (e.g., "every day post good morning")
    if (msg.includes('every day') || msg.includes('daily') || msg.includes('recurring')) {
      return this.handleRecurringTask(message);
    }

    // 5️⃣ GENERAL HELP
    return '🤖 Hello! I can help you with:\n\n' +
      '📅 Scheduled posts: "Post at 4pm about crypto news"\n' +
      '💰 Trading: "Buy $5 DASH on Binance"\n' +
      '🎯 Profit triggers: "If BTC profit $1 close trade"\n' +
      '⏰ Recurring: "Every day post good morning from Groq"\n' +
      '📋 View tasks: "Show my tasks"\n\n' +
      'What would you like me to do?';
  },
  async handleScheduledPost(message) {
    // Extract time and content from message
    const timeMatch = message.match(/(\d{1,2})\s*([:.]?)(\d{2})?\s*(pm|am)/i);
    const topicMatch = message.match(/about\s+(.+?)(?:\s+today|$)/i);

    if (!timeMatch) {
      return '⏰ Please specify time (e.g., "4pm", "2:30am")';
    }

    let hours = parseInt(timeMatch[1]);
    const period = timeMatch[4].toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    const topic = topicMatch ? topicMatch[1].trim() : 'crypto news';

    // Create task
    const task = {
      id: Date.now(),
      type: 'scheduled_post',
      title: `Post about ${topic}`,
      description: message,
      time: `${String(hours).padStart(2, '0')}:00`,
      topic,
      status: 'pending',
      createdAt: new Date(),
      content: ''
    };

    this.tasks.push(task);
    await this.saveTasks();
    this.updateTaskDashboard();

    return `✅ Task added! I'll post about "${topic}" at ${hours}:00 today.\n\n📝 I'll auto-generate content from Groq when the time comes.`;
  },
  async handleTradeCommand(message) {
    // Extract coin and amount: "buy 5$ dash" or "sell 2$ btc"
    const amountMatch = message.match(/(\d+)\s*\$\s*(\w+)/i);
    if (!amountMatch) {
      return '💰 Format: "buy $5 DASH" or "sell $2 BTC"';
    }

    const amount = amountMatch[1];
    const coin = amountMatch[2].toUpperCase();
    const action = message.includes('buy') ? 'BUY' : 'SELL';

    const task = {
      id: Date.now(),
      type: 'trade',
      title: `${action} $${amount} ${coin}`,
      description: message,
      status: 'pending',
      action,
      amount,
      coin,
      createdAt: new Date()
    };

    this.tasks.push(task);
    await this.saveTasks();
    this.updateTaskDashboard();

    // Try to execute trade with Binance
    await this.executeBinanceTrade(coin, amount, action);

    return `🚀 Trade initiated!\n${action} $${amount} worth of ${coin}\n\n✅ Check Binance for order status.`;
  },
  async handleProfitTrigger(message) {
    // Extract: "if btc profit 1$ close" or "if eth loss 50$ sell"
    const triggerMatch = message.match(/if\s+(\w+)\s+(profit|loss)\s+(\d+)\s*\$\s+(close|sell|stop)/i);
    if (!triggerMatch) {
      return '🎯 Format: "If BTC profit $1 close trade"';
    }

    const coin = triggerMatch[1].toUpperCase();
    const type = triggerMatch[2].toLowerCase();
    const amount = triggerMatch[3];
    const action = triggerMatch[4].toLowerCase();

    const task = {
      id: Date.now(),
      type: 'profit_trigger',
      title: `Close ${coin} if ${type} $${amount}`,
      description: message,
      status: 'active',
      coin,
      triggerType: type,
      triggerAmount: amount,
      action,
      createdAt: new Date()
    };

    this.tasks.push(task);
    await this.saveTasks();
    this.updateTaskDashboard();

    // Start monitoring
    this.startProfitMonitoring(task);

    return `🔔 Monitoring activated!\n\nI'll ${action} ${coin} when ${type} reaches $${amount}.\n\n📊 Live tracking started...`;
  },
  async handleRecurringTask(message) {
    // Extract: "every day post good morning"
    const contentMatch = message.match(/post\s+(.+?)(?:\s+from\s+groq)?$/i);
    if (!contentMatch) {
      return '⏰ Format: "Every day post good morning"';
    }

    const content = contentMatch[1].trim();

    const task = {
      id: Date.now(),
      type: 'recurring_post',
      title: `Daily: ${content}`,
      description: message,
      status: 'active',
      frequency: 'daily',
      time: '09:00', // Default morning time
      content,
      useGroq: message.includes('groq'),
      createdAt: new Date()
    };

    this.tasks.push(task);
    await this.saveTasks();
    this.updateTaskDashboard();

    // Schedule task
    this.scheduleRecurringTask(task);

    return `📅 Recurring task created!\n\nEvery day at 9:00 AM I'll:\n${message.includes('groq') ? '🤖 Generate content using Groq\n' : ''}📝 Post: "${content}"\n\n✅ Task is now active!`;
  },
  async executeBinanceTrade(coin, amount, action) {
    try {
      const response = await fetch('http://localhost:5000/api/tasks/execute-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coin, amount, action })
      });
      const result = await response.json();
      return result.success;
    } catch (e) {
      console.error('Trade execution error:', e);
      return false;
    }
  },
  async startProfitMonitoring(task) {
    // Start checking price every 30 seconds
    const checkInterval = setInterval(async () => {
      if (task.status !== 'active') {
        clearInterval(checkInterval);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/tasks/check-profit-trigger/${task.id}`);
        const result = await response.json();
        
        if (result.triggered) {
          task.status = 'completed';
          this.saveTasks();
          this.updateTaskDashboard();
          this.addChatMessage(`🎯 Profit trigger hit! ${task.action} ${task.coin} executed.`, 'bot');
          clearInterval(checkInterval);
        }
      } catch (e) {
        console.error('Profit trigger check error:', e);
      }
    }, 30000); // Check every 30 seconds
  },
  async scheduleRecurringTask(task) {
    // This will be handled by backend cron job
    // Frontend can start checking periodically
    const checkInterval = setInterval(async () => {
      if (task.status !== 'active') {
        clearInterval(checkInterval);
        return;
      }

      const now = new Date();
      const [hours, minutes] = task.time.split(':');
      
      if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
        // Time to execute
        let content = task.content;

        if (task.useGroq) {
          try {
            const response = await fetch('http://localhost:5000/api/tasks/generate-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: task.content })
            });
            const result = await response.json();
            content = result.content || task.content;
          } catch (e) {
            console.error('Groq generation error:', e);
          }
        }

        // Post to Square/Social
        await this.postToSquare(content);
        this.addChatMessage(`📝 Daily post published at ${task.time}:\n"${content}"`, 'bot');
        
        clearInterval(checkInterval); // Reset for next day
        setTimeout(() => this.scheduleRecurringTask(task), 60000); // Check again next minute
      }
    }, 60000); // Check every minute
  },
  async postToSquare(content) {
    try {
      const response = await fetch('http://localhost:5000/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, source: 'ai-assistant' })
      });
      return await response.json();
    } catch (e) {
      console.error('Post error:', e);
      return null;
    }
  },
  updateTaskDashboard() {
    const dashboardEl = document.getElementById('ai-taskDashboard');
    if (!dashboardEl) return;

    const pending = this.tasks.filter(t => t.status === 'pending' || t.status === 'active');
    const completed = this.tasks.filter(t => t.status === 'completed');

    // Update stats
    const statPending = document.getElementById('ai-stat-pending');
    const statCompleted = document.getElementById('ai-stat-completed');
    if (statPending) statPending.textContent = pending.length;
    if (statCompleted) statCompleted.textContent = completed.length;

    let html = '<div class="tasks-container">';

    if (pending.length > 0) {
      html += '<div class="tasks-section"><h3>📋 Upcoming Tasks</h3>';
      pending.forEach(task => {
        html += `
          <div class="task-item" data-id="${task.id}">
            <div class="task-header">
              <span class="task-title">${task.title}</span>
              <span class="task-badge">${task.status}</span>
            </div>
            <p class="task-desc">${task.description}</p>
            <div class="task-actions">
              <button onclick="AIAssistant.cancelTask(${task.id})" class="btn btn-ghost btn-sm">✕ Cancel</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }

    if (completed.length > 0) {
      html += '<div class="tasks-section"><h3>✅ Completed</h3>';
      completed.forEach(task => {
        html += `
          <div class="task-item completed" data-id="${task.id}">
            <span class="task-title">${task.title}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    dashboardEl.innerHTML = html;
  },
  async cancelTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    await this.saveTasks();
    this.updateTaskDashboard();
    this.addChatMessage(`❌ Task cancelled.`, 'bot');
  },
  async loadTasks() {
    try {
      const response = await fetch('http://localhost:5000/api/tasks');
      const data = await response.json();
      this.tasks = data.tasks || [];
      this.updateTaskDashboard();
    } catch (e) {
      console.error('Error loading tasks:', e);
    }
  },
  async saveTasks() {
    try {
      await fetch('http://localhost:5000/api/tasks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: this.tasks })
      });
    } catch (e) {
      console.error('Error saving tasks:', e);
    }
  },
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  AIAssistant.init();
});

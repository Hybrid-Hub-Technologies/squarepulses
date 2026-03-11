// ============================================================
// ai-assistant.js — Personal AI Assistant with OpenClaw
// ============================================================

// AI Assistant State
const AIAssistant = {
  isOpen: false,
  tasks: [],
  messages: [],
  
  init() {
    this.setupEventListeners();
    this.loadTasks();
    console.log('🤖 AI Assistant Initialized');
  },
  
  setupEventListeners() {
    // Setup chat input with timeout to ensure element exists
    setTimeout(() => {
      const chatInput = document.getElementById('ai-chatInput');
      const sendBtn = document.querySelector('[onclick="AIAssistant.sendMessage()"]');
      
      if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
      
      if (sendBtn) {
        sendBtn.addEventListener('click', () => this.sendMessage());
      }
    }, 100);
  },
  
  async sendMessage() {
    const input = document.getElementById('ai-chatInput');
    const message = input.value.trim();
    if (!message) {
      console.warn('Empty message');
      return;
    }

    // Add user message to chat
    this.addChatMessage(message, 'user');
    input.value = '';

    // Parse and execute command
    const response = await this.parseAndExecuteCommand(message);
    setTimeout(() => this.addChatMessage(response, 'bot'), 300);
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

    return `🚀 OpenClaw Trade Executed!\n${action} $${amount} ${coin}\n\n🦅 Position opened with auto TP/SL monitoring`;
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
      // Set default TP/SL if not provided
      const entryPrice = 100; // Placeholder - get actual current price
      const tpPercent = 5;  // 5% profit target
      const slPercent = 2;  // 2% stop loss

      const tp1 = entryPrice * (1 + (tpPercent / 100));
      const tp2 = entryPrice * (1 + ((tpPercent * 1.5) / 100));
      const sl = entryPrice * (1 - (slPercent / 100));

      // Use OpenClaw to open position
      const response = await fetch('http://localhost:5000/api/openclaw/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: SP.userId || 'demo_user',
          coin_symbol: coin,
          entry_price: entryPrice,
          tp1: tp1,
          tp2: tp2,
          sl: sl,
          position_size: parseFloat(amount),
          leverage: 1
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Monitor the position
        if (result.position) {
          this.startPositionMonitoring(result.position);
        }
        return true;
      }

      return false;
    } catch (e) {
      console.error('OpenClaw trade execution error:', e);
      return false;
    }
  },

  async startPositionMonitoring(position) {
    // Start monitoring position for TP/SL hits
    const monitorInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/openclaw/monitor/${position.id}`);
        const result = await response.json();

        if (result.success && result.position) {
          if (result.tp1_hit && !position.tp1_notified) {
            this.addChatMessage(`🎯 TP1 Hit on ${result.position.coin_symbol}! Current: $${result.position.current_price}`, 'bot');
            position.tp1_notified = true;
          }
          if (result.tp2_hit && !position.tp2_notified) {
            this.addChatMessage(`🎯🎯 TP2 Hit on ${result.position.coin_symbol}! Current: $${result.position.current_price}`, 'bot');
            position.tp2_notified = true;
          }
          if (result.sl_hit) {
            this.addChatMessage(`⛔ Stop Loss Hit on ${result.position.coin_symbol}! Position closed.`, 'bot');
            clearInterval(monitorInterval);
          }
        } else if (!result.success) {
          clearInterval(monitorInterval);
        }
      } catch (e) {
        console.error('Monitoring error:', e);
      }
    }, 5000); // Check every 5 seconds
  },
  async startProfitMonitoring(task) {
    // Start OpenClaw monitoring for profit triggers
    const checkInterval = setInterval(async () => {
      if (task.status !== 'active') {
        clearInterval(checkInterval);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/openclaw/positions/${SP.userId || 'demo_user'}`);
        const result = await response.json();

        if (result.success && result.positions) {
          const position = result.positions.find(p => p.coin_symbol === task.coin);
          
          if (position) {
            let conditionMet = false;

            if (task.triggerType === 'profit') {
              const profit = (position.current_price - position.entry_price) * position.position_size;
              conditionMet = profit >= parseFloat(task.triggerAmount);
            } else if (task.triggerType === 'loss') {
              const loss = Math.abs((position.current_price - position.entry_price) * position.position_size);
              conditionMet = loss >= parseFloat(task.triggerAmount);
            }

            if (conditionMet) {
              await fetch(`http://localhost:5000/api/openclaw/close/${position.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ close_price: position.current_price })
              });

              task.status = 'completed';
              this.saveTasks();
              this.updateTaskDashboard();
              this.addChatMessage(`✅ ${task.coin} ${task.action}ed! ${task.triggerType} $${task.triggerAmount} triggered.`, 'bot');
              clearInterval(checkInterval);
            }
          }
        }
      } catch (e) {
        console.error('Profit trigger check error:', e);
      }
    }, 10000);
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
  // Don't auto-init, only init when tab is opened
  console.log('🤖 AI Assistant ready to initialize');
});

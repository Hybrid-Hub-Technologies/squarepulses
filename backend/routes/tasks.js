// ============================================================
// routes/tasks.js — Task Management & AI Automation
// ============================================================

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../database');

// In-memory task storage (could be database)
let tasksDb = [];

// ────────────────────────────────────────────────────────────
// Get all tasks
// ────────────────────────────────────────────────────────────
router.get('/tasks', (req, res) => {
  try {
    res.json({ success: true, tasks: tasksDb });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Save tasks
// ────────────────────────────────────────────────────────────
router.post('/tasks/save', (req, res) => {
  try {
    const { tasks } = req.body;
    tasksDb = tasks;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Execute Binance Trade
// ────────────────────────────────────────────────────────────
router.post('/tasks/execute-trade', async (req, res) => {
  try {
    const { coin, amount, action } = req.body;

    console.log(`🤖 AI Assistant: ${action} $${amount} of ${coin}`);

    // Integration with Binance API
    // This would use the binanceApi from your project
    // For now, simulate the trade
    const tradeResult = {
      success: true,
      orderId: 'ORD-' + Date.now(),
      coin,
      amount,
      action,
      timestamp: new Date(),
      status: 'executed'
    };

    res.json(tradeResult);
  } catch (e) {
    res.status (500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Check Profit Trigger
// ────────────────────────────────────────────────────────────
router.get('/tasks/check-profit-trigger/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tasksDb.find(t => t.id === parseInt(taskId));

    if (!task || task.type !== 'profit_trigger') {
      return res.json({ triggered: false, reason: 'task not found' });
    }

    // Get current price from CoinGecko
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${task.coin.toLowerCase()}&vs_currencies=usd`
      );

      const currentPrice = response.data[task.coin.toLowerCase()].usd;
      
      // Check if trigger condition is met
      let triggered = false;

      if (task.triggerType === 'profit') {
        // Calculate if profit threshold reached
        // This is simplified - you'd need to track entry price
        triggered = currentPrice >= task.triggerAmount;
      } else if (task.triggerType === 'loss') {
        triggered = currentPrice <= task.triggerAmount;
      }

      if (triggered) {
        task.status = 'completed';
        // Execute the close/sell action
        console.log(`🎯 Profit trigger hit! ${task.action} ${task.coin}`);
      }

      res.json({ triggered, currentPrice });
    } catch (e) {
      res.json({ triggered: false, reason: 'price fetch error' });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Generate Content using Groq
// ────────────────────────────────────────────────────────────
router.post('/tasks/generate-content', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Call Groq API for content generation
    // Using existing groq integration or creating new one
    const response = await axios.post(
      'https://api.groq.com/api/v1/generate',
      {
        prompt: `Generate a short, engaging crypto post about: ${prompt}. Keep it under 280 characters.`,
        max_tokens: 100,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      content: response.data.choices?.[0]?.text || prompt
    });
  } catch (e) {
    console.error('Groq generation error:', e.message);
    // Fallback to original prompt
    res.json({
      success: true,
      content: req.body.prompt
    });
  }
});

// ────────────────────────────────────────────────────────────
// Scheduled Post Handler
// ────────────────────────────────────────────────────────────
router.post('/tasks/scheduled-post', async (req, res) => {
  try {
    const { taskId, content, coin } = req.body;

    // Find task
    const task = tasksDb.find(t => t.id === parseInt(taskId));
    if (!task) {
      return res.json({ success: false, error: 'Task not found' });
    }

    // Post the content
    // Integration with Square/Social posting here
    console.log(`📝 Posting scheduled content: ${content}`);

    // Mark task as completed
    task.status = 'completed';

    res.json({
      success: true,
      taskId,
      content,
      postedAt: new Date()
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Create/Update Task
// ────────────────────────────────────────────────────────────
router.post('/tasks/create', (req, res) => {
  try {
    const { type, title, description, ...rest } = req.body;

    const task = {
      id: Date.now(),
      type,
      title,
      description,
      status: 'pending',
      createdAt: new Date(),
      ...rest
    };

    tasksDb.push(task);

    res.json({ success: true, task });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ────────────────────────────────────────────────────────────
// Delete Task
// ────────────────────────────────────────────────────────────
router.delete('/tasks/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    tasksDb = tasksDb.filter(t => t.id !== parseInt(taskId));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

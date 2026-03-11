const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendNotification(userEmail, subject, htmlContent) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️  Email not configured - skipping notification');
    return false;
  }

  try {
    await transporter.sendMail({
      from: `SquarePulse <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`📧 Email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error.message);
    return false;
  }
}

function getTP1EmailTemplate(coin, entry, tp1Price) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00d084;">🎉 TP1 HIT! ${coin}</h2>
      <p>Your trade just reached its first target!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Coin:</strong> ${coin}</p>
        <p><strong>Entry Price:</strong> $${entry}</p>
        <p><strong>TP1 Reached:</strong> $${tp1Price}</p>
      </div>
      <p style="color: #666;">Take some profits and let the rest ride! 🚀</p>
      <a href="https://www.binance.com/square" style="display: inline-block; background: #00d084; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View on Binance Square</a>
    </div>
  `;
}

function getTP2EmailTemplate(coin, entry, tp1, tp2) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f0b90b;">🚀 TP2 HIT! ${coin}</h2>
      <p>Congratulations! Your trade reached the second target!</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Coin:</strong> ${coin}</p>
        <p><strong>Entry:</strong> $${entry}</p>
        <p><strong>TP1:</strong> $${tp1}</p>
        <p><strong>TP2 Reached:</strong> $${tp2}</p>
      </div>
      <p style="color: #666;">Great profits! Consider locking in gains. 💰</p>
    </div>
  `;
}

function getSLEmailTemplate(coin, entry, sl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ff4757;">🛑 Stop Loss Hit - ${coin}</h2>
      <p>Your stop loss was triggered. Cut losses and move to the next trade.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Coin:</strong> ${coin}</p>
        <p><strong>Entry:</strong> $${entry}</p>
        <p><strong>Stop Loss At:</strong> $${sl}</p>
      </div>
      <p style="color: #666;">Risk management is key. Learn and trade better next time! 📚</p>
    </div>
  `;
}

module.exports = {
  sendNotification,
  getTP1EmailTemplate,
  getTP2EmailTemplate,
  getSLEmailTemplate,
};

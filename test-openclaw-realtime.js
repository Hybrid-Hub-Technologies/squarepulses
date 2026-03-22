/**
 * TEST OPENCLAW REAL-TIME MARKET SKILL
 * Run this to test market analysis and post generation
 */

const OpenClawIntegration = require('./openclaw/integration');

async function testRealtimeMarket() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🧪 TESTING OPENCLAW REAL-TIME MARKET SKILL');
  console.log('═══════════════════════════════════════════════════════\n');

  const agent = new OpenClawIntegration({
    baseUrl: 'http://localhost:5000/api'
  });

  try {
    // Test 1: Market Analysis & Post
    console.log('📊 TEST 1: Market Analysis Request\n');
    console.log('Command: "Make a post for crypto market update analysis karo"');
    console.log('');
    
    const marketAnalysis = await agent.processCommand('market analysis karo');
    console.log('RESPONSE:\n');
    console.log(JSON.stringify(marketAnalysis, null, 2));
    
    if (marketAnalysis.post) {
      console.log('\n✅ Generated Post:\n');
      console.log(marketAnalysis.post);
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 2: Specific Coin Analysis  
    console.log('📊 TEST 2: Bitcoin Analysis\n');
    console.log('Command: "analyze BTC"');
    console.log('');
    
    const btcAnalysis = await agent.processCommand('analyze BTC');
    console.log('RESPONSE:\n');
    console.log(JSON.stringify(btcAnalysis, null, 2));

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 3: Price Check
    console.log('📊 TEST 3: Ethereum Price with Real-Time Data\n');
    console.log('Command: "current price of ETH"');
    console.log('');
    
    const ethPrice = await agent.processCommand('current price of ETH');
    console.log('RESPONSE:\n');
    console.log(JSON.stringify(ethPrice, null, 2));

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Test 4: Check Skill Status
    console.log('📊 TEST 4: Real-Time Market Skill Status\n');
    const status = agent.realtimemarket.getStatus();
    console.log('RESPONSE:\n');
    console.log(JSON.stringify(status, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ All tests completed successfully!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error);
  }
}

// Run tests if called directly
if (require.main === module) {
  testRealtimeMarket();
}

module.exports = testRealtimeMarket;

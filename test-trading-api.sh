#!/bin/bash
# ============================================================
# Trading API Test Script
# ============================================================
# Run these commands to test each trading endpoint

API="http://192.168.100.81:5000/api/trading"
ACCOUNT="main"

echo "🧪 SQUAREPULSE TRADING API TEST SCRIPT"
echo "=====================================\n"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. List Accounts
echo -e "${BLUE}1. List Saved Accounts:${NC}"
echo "curl -X GET $API/keys/list"
# curl -X GET $API/keys/list | jq '.'
echo ""

# 2. Get Account Info
echo -e "${BLUE}2. Get Account Information:${NC}"
echo "curl -X GET '$API/account?account=$ACCOUNT'"
# curl -X GET "$API/account?account=$ACCOUNT" | jq '.'
echo ""

# 3. Get Portfolio
echo -e "${BLUE}3. Get Portfolio (USDT Value):${NC}"
echo "curl -X GET '$API/portfolio?account=$ACCOUNT'"
# curl -X GET "$API/portfolio?account=$ACCOUNT" | jq '.'
echo ""

# 4. Get Price
echo -e "${BLUE}4. Get Current Price:${NC}"
echo "curl -X GET '$API/price/BTCUSDT?account=$ACCOUNT'"
# curl -X GET "$API/price/BTCUSDT?account=$ACCOUNT" | jq '.'
echo ""

# 5. Get Active Trades
echo -e "${BLUE}5. Get Active Trades:${NC}"
echo "curl -X GET '$API/bot/trades?account=$ACCOUNT&status=active'"
# curl -X GET "$API/bot/trades?account=$ACCOUNT&status=active" | jq '.'
echo ""

# 6. Get Trading Stats
echo -e "${BLUE}6. Get Trading Statistics:${NC}"
echo "curl -X GET '$API/bot/stats?account=$ACCOUNT'"
# curl -X GET "$API/bot/stats?account=$ACCOUNT" | jq '.'
echo ""

# 7. Open a Trade (EXAMPLE - NEEDS MODIFICATION)
echo -e "${YELLOW}7. Open a New Trade (EXAMPLE):${NC}"
echo "curl -X POST $API/bot/open-trade \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"symbol\": \"BTCUSDT\","
echo "    \"side\": \"BUY\","
echo "    \"quantity\": 0.001,"
echo "    \"targetProfit\": 5,"
echo "    \"account\": \"$ACCOUNT\","
echo "    \"confirm\": true"
echo "  }'"
echo ""

# 8. Close a Trade (EXAMPLE)
echo -e "${YELLOW}8. Close a Trade (EXAMPLE):${NC}"
echo "curl -X POST $API/bot/close-trade \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"tradeId\": \"BTCUSDT-1710710400000\","
echo "    \"account\": \"$ACCOUNT\","
echo "    \"confirm\": true"
echo "  }'"
echo ""

# 9. Update Trade TP/SL
echo -e "${YELLOW}9. Update Trade TP/SL (EXAMPLE):${NC}"
echo "curl -X PUT $API/bot/trade/BTCUSDT-1710710400000 \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"takeProfit\": 51000,"
echo "    \"stopLoss\": 49000,"
echo "    \"account\": \"$ACCOUNT\""
echo "  }'"
echo ""

# 10. Add API Keys
echo -e "${YELLOW}10. Add Binance API Keys:${NC}"
echo "curl -X POST $API/keys/add \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"accountName\": \"main\","
echo "    \"apiKey\": \"YOUR_API_KEY\","
echo "    \"apiSecret\": \"YOUR_API_SECRET\","
echo "    \"environment\": \"mainnet\""
echo "  }'"
echo ""

echo -e "${GREEN}==== INSTRUCTIONS ====${NC}"
echo "1. Uncomment the curl command you want to test"
echo "2. Make sure backend is running: npm start"
echo "3. Update ACCOUNT, API values if needed"
echo "4. Run this script: bash test-trading-api.sh"
echo ""
echo "Or run individual commands in PowerShell/Terminal"

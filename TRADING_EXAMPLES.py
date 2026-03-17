"""
════════════════════════════════════════════════════════════════════════════════
        SQUAREPULSE BINANCE TRADING - PRACTICAL EXAMPLES
════════════════════════════════════════════════════════════════════════════════

This file shows real-world examples of how to use the trading system.
All examples are ready to copy & paste!

"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://192.168.100.81:5000/api/trading"
ACCOUNT = "main"  # Your account name

# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 1: ADD BINANCE API CREDENTIALS
# ════════════════════════════════════════════════════════════════════════════════

def add_api_credentials():
    """
    Add your Binance API credentials to SquarePulse
    """
    
    # Get from Binance.com account
    api_key = "YOUR_BINANCE_API_KEY_HERE"
    api_secret = "YOUR_BINANCE_API_SECRET_HERE"
    
    payload = {
        "accountName": "main",
        "apiKey": api_key,
        "apiSecret": api_secret,
        "environment": "mainnet"  # Use "testnet" for practice
    }
    
    response = requests.post(
        f"{API_BASE}/keys/add",
        json=payload
    )
    
    result = response.json()
    print(f"✅ Credentials saved: {result['message']}")
    return result


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 2: CHECK PORTFOLIO
# ════════════════════════════════════════════════════════════════════════════════

def check_portfolio():
    """
    Get your portfolio with USDT valuation
    """
    
    response = requests.get(
        f"{API_BASE}/portfolio",
        params={"account": ACCOUNT}
    )
    
    data = response.json()
    
    if data['success']:
        portfolio = data['data']
        print(f"\n💼 YOUR PORTFOLIO")
        print(f"{'='*50}")
        print(f"Total Value: ${portfolio['totalValue']:,.2f} USDT\n")
        
        print(f"{'Asset':<12} {'Quantity':<15} {'Value (USDT)':<15}")
        print("-" * 50)
        
        for asset in portfolio['assets']:
            print(f"{asset['asset']:<12} "
                  f"{asset['quantity']:<15.8f} "
                  f"${asset['usdtValue']:<14,.2f}")
    else:
        print(f"❌ Error: {data.get('error')}")


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 3: GET CURRENT PRICE
# ════════════════════════════════════════════════════════════════════════════════

def get_price(symbol):
    """
    Get current price for a trading pair
    """
    
    response = requests.get(
        f"{API_BASE}/price/{symbol}",
        params={"account": ACCOUNT}
    )
    
    data = response.json()
    
    if data['success']:
        price = float(data['data']['price'])
        display_symbol = symbol.replace('USDT', '')
        print(f"💰 {display_symbol} Price: ${price:,.2f}")
        return price
    else:
        print(f"❌ Error: {data.get('error')}")
        return None


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 4: OPEN A TRADE (WITH AUTO-CLOSE)
# ════════════════════════════════════════════════════════════════════════════════

def open_trade(symbol, side, quantity, target_profit=5):
    """
    Open a new trade with automatic profit targeting
    
    Args:
        symbol: Trading pair (e.g., 'BTCUSDT')
        side: 'BUY' or 'SELL'
        quantity: Amount to trade
        target_profit: Dollar amount to close at (default: $5)
    
    The bot will automatically close this trade when the profit target is hit!
    """
    
    print(f"\n⚠️  OPENING TRADE:\n"
          f"  Symbol: {symbol}\n"
          f"  Side: {side}\n"
          f"  Quantity: {quantity}\n"
          f"  Target Profit: ${target_profit}")
    
    # Get confirmation
    confirm = input("\nType 'YES' to confirm: ").upper() == 'YES'
    
    if not confirm:
        print("❌ Trade cancelled")
        return None
    
    payload = {
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "targetProfit": target_profit,
        "account": ACCOUNT,
        "confirm": True
    }
    
    response = requests.post(
        f"{API_BASE}/bot/open-trade",
        json=payload
    )
    
    data = response.json()
    
    if data['success']:
        trade = data['trade']
        print(f"\n✅ TRADE OPENED!\n"
              f"  Trade ID: {trade['tradeId']}\n"
              f"  Entry Price: ${trade['entryPrice']:.2f}\n"
              f"  Take Profit: ${trade['takeProfit']:.2f}\n"
              f"  Status: {trade['status']}")
        return trade
    else:
        print(f"❌ Error: {data.get('error')}")
        return None


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 5: GET ACTIVE TRADES
# ════════════════════════════════════════════════════════════════════════════════

def get_active_trades():
    """
    List all your active (open) trades
    """
    
    response = requests.get(
        f"{API_BASE}/bot/trades",
        params={"account": ACCOUNT, "status": "active"}
    )
    
    data = response.json()
    
    if data['success']:
        trades = data['data']
        
        if not trades:
            print("\n📭 No active trades")
            return
        
        print(f"\n📈 ACTIVE TRADES ({len(trades)} total)")
        print("=" * 80)
        
        for trade in trades:
            print(f"\nTrade: {trade['symbol']} ({trade['side']})")
            print(f"  Entry: ${trade['entryPrice']:.2f}")
            print(f"  Qty: {trade['quantity']}")
            print(f"  Target: ${trade['targetProfit']}")
            print(f"  ID: {trade['tradeId']}")
            print(f"  Opened: {trade['entryTime']}")


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 6: CLOSE A TRADE MANUALLY
# ════════════════════════════════════════════════════════════════════════════════

def close_trade(trade_id):
    """
    Manually close an active trade
    """
    
    print(f"\n⚠️  Closing trade: {trade_id}")
    confirm = input("Type 'YES' to confirm: ").upper() == 'YES'
    
    if not confirm:
        print("❌ Close cancelled")
        return None
    
    payload = {
        "tradeId": trade_id,
        "account": ACCOUNT,
        "confirm": True
    }
    
    response = requests.post(
        f"{API_BASE}/bot/close-trade",
        json=payload
    )
    
    data = response.json()
    
    if data['success']:
        trade = data['trade']
        print(f"\n✅ TRADE CLOSED!\n"
              f"  Entry: ${trade['entryPrice']:.2f}\n"
              f"  Exit: ${trade['closePrice']:.2f}\n"
              f"  PnL: ${trade['pnl']:.2f} ({trade['pnlPercent']:.2f}%)\n"
              f"  Closed: {trade['closeTime']}")
        return trade
    else:
        print(f"❌ Error: {data.get('error')}")
        return None


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 7: GET TRADING STATISTICS
# ════════════════════════════════════════════════════════════════════════════════

def get_trading_stats():
    """
    Get your overall trading performance statistics
    """
    
    response = requests.get(
        f"{API_BASE}/bot/stats",
        params={"account": ACCOUNT}
    )
    
    data = response.json()
    
    if data['success']:
        stats = data['data']
        
        print(f"\n📊 TRADING STATISTICS")
        print("=" * 50)
        print(f"Total Trades: {stats['totalTrades']}")
        print(f"Active: {stats['activeTrades']}")
        print(f"Closed: {stats['closedTrades']}\n")
        
        print(f"Total PnL: ${stats['totalPnL']:.2f}")
        print(f"Average PnL: ${stats['avgPnL']:.2f}")
        print(f"Win Rate: {stats['winRate']:.1f}%")
        print(f"\nWins: {stats['winCount']}")
        print(f"Losses: {stats['lossCount']}\n")
        
        best = stats.get('bestTrade', {})
        worst = stats.get('worstTrade', {})
        
        if best:
            print(f"Best Trade: ${best.get('pnl', 0):.2f}")
        if worst:
            print(f"Worst Trade: ${worst.get('pnl', 0):.2f}")


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 8: UPDATE TRADE TP/SL
# ════════════════════════════════════════════════════════════════════════════════

def update_trade_levels(trade_id, new_tp=None, new_sl=None, new_target=None):
    """
    Update Take Profit or Stop Loss for an active trade
    """
    
    payload = {"account": ACCOUNT}
    
    if new_tp:
        payload["takeProfit"] = new_tp
        print(f"Setting TP to: ${new_tp}")
    
    if new_sl:
        payload["stopLoss"] = new_sl
        print(f"Setting SL to: ${new_sl}")
    
    if new_target:
        payload["targetProfit"] = new_target
        print(f"Setting profit target to: ${new_target}")
    
    response = requests.put(
        f"{API_BASE}/bot/trade/{trade_id}",
        json=payload
    )
    
    data = response.json()
    
    if data['success']:
        print("✅ Trade updated!")
        return data['trade']
    else:
        print(f"❌ Error: {data.get('error')}")
        return None


# ════════════════════════════════════════════════════════════════════════════════
# EXAMPLE 9: COMPLETE TRADING WORKFLOW
# ════════════════════════════════════════════════════════════════════════════════

def trading_workflow():
    """
    Complete example workflow showing typical trading session
    """
    
    print("\n" + "=" * 80)
    print("SQUAREPULSE TRADING WORKFLOW EXAMPLE")
    print("=" * 80)
    
    # Step 1: Check portfolio
    print("\n📊 STEP 1: Check Portfolio")
    print("-" * 80)
    check_portfolio()
    
    # Step 2: Check Bitcoin price
    print("\n💹 STEP 2: Check BTC Price")
    print("-" * 80)
    btc_price = get_price("BTCUSDT")
    
    # Step 3: Open a trade
    print("\n🚀 STEP 3: Open Trade")
    print("-" * 80)
    if btc_price:
        # Example: Buy 0.001 BTC with $5 profit target
        trade = open_trade("BTCUSDT", "BUY", 0.001, target_profit=5)
    
    # Step 4: Get active trades
    print("\n📈 STEP 4: View Active Trades")
    print("-" * 80)
    get_active_trades()
    
    # Step 5: Get stats
    print("\n📊 STEP 5: Trading Statistics")
    print("-" * 80)
    get_trading_stats()
    
    # Step 6: Update trade (if needed)
    if trade:
        print("\n⚙️  STEP 6: Update Trade Levels")
        print("-" * 80)
        response = input("\nUpdate TP? (y/n): ")
        if response.lower() == 'y':
            new_tp = float(input("Enter new TP price: "))
            update_trade_levels(trade['tradeId'], new_tp=new_tp)
    
    print("\n" + "=" * 80)
    print("Workflow complete!")
    print("=" * 80)


# ════════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ════════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    
    print("""
    
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║      SQUAREPULSE BINANCE TRADING - EXAMPLE SCRIPTS          ║
    ║                                                              ║
    ║  Choose what you want to do:                                ║
    ║  1. Check Portfolio                                         ║
    ║  2. Get Current Price                                       ║
    ║  3. Open a Trade                                            ║
    ║  4. View Active Trades                                      ║
    ║  5. Get Trading Statistics                                  ║
    ║  6. Close a Trade                                           ║
    ║  7. Update Trade TP/SL                                      ║
    ║  8. Full Trading Workflow                                   ║
    ║  0. Exit                                                    ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    
    """)
    
    while True:
        choice = input("Enter your choice (0-8): ").strip()
        
        if choice == "0":
            print("Goodbye! 👋")
            break
        
        elif choice == "1":
            check_portfolio()
        
        elif choice == "2":
            symbol = input("Enter symbol (e.g., BTCUSDT): ").upper()
            get_price(symbol)
        
        elif choice == "3":
            symbol = input("Enter symbol (e.g., BTCUSDT): ").upper()
            side = input("BUY or SELL: ").upper()
            qty = float(input("Quantity: "))
            tp = float(input("Target Profit ($) [default 5]: ") or "5")
            open_trade(symbol, side, qty, tp)
        
        elif choice == "4":
            get_active_trades()
        
        elif choice == "5":
            get_trading_stats()
        
        elif choice == "6":
            trade_id = input("Enter Trade ID: ")
            close_trade(trade_id)
        
        elif choice == "7":
            trade_id = input("Enter Trade ID: ")
            new_tp = input("New TP price (or leave blank): ")
            new_sl = input("New SL price (or leave blank): ")
            update_trade_levels(
                trade_id,
                new_tp=float(new_tp) if new_tp else None,
                new_sl=float(new_sl) if new_sl else None
            )
        
        elif choice == "8":
            trading_workflow()
        
        else:
            print("❌ Invalid choice")
        
        input("\nPress Enter to continue...")

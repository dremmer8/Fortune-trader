# 🎮 Fortune Trader - Beginner's Manual

Welcome to Fortune Trader! This comprehensive guide will teach you everything you need to know to become a successful trader in a world where fortune cookie prophecies actually come true.

---

## 🚀 Getting Started

### First Login

1. **Visit the game** at https://dremmer8.github.io/Fortune-trader/
2. **Enter your credentials**:
   - **Card Holder Name**: Enter any name (this is your username)
   - **Security Code**: Enter any password (this is your password)
   - Click "Login" to start
3. **Initial Setup**: You start with $1,000 in your bank account

### Understanding the Interface

The game has two main views:

- **Phone Interface**: Access banking, shop, expenses, leaderboard, and settings
- **Trading Interface**: The main trading screen with charts and trading controls

**Keyboard Shortcuts:**
- `ESC` - Toggle phone interface during gameplay
- `A` - Open Long position
- `D` - Open Short position
- `Space` - Buy Stock
- `Z` - Long Margin (when unlocked)
- `C` - Short Margin (when unlocked)

---

## 💰 Banking System

### Depositing Money

Before you can trade, you need to deposit money from your bank to your trading account:

1. **Open Baker's Bank** from the phone interface
2. **Select Deposit mode** (default)
3. **Choose deposit amount**:
   - Use preset buttons: $100, $250, $500, or "All"
   - Or enter a custom amount (minimum $100)
4. **Click "Deposit"**

**Important**: You need at least $100 in your bank to make a deposit. The minimum deposit is $100.

### Loans

Loans provide additional capital based on your lifetime earnings:

1. **Open Baker's Bank** → Switch to "Loans" tab
2. **Loan Details**:
   - **Amount**: Based on your lifetime earnings
   - **Interest Rate**: Random between 5% and 15% per week
   - **Term**: 1 week (fixed)
3. **Take Loan**: Click to accept the loan
4. **Repayment**: The loan amount + interest is automatically deducted from your bank balance after 1 week

**Strategy Tip**: Only take loans when you're confident you can generate enough profit to cover the interest!

---

## 📈 Trading Basics

### Understanding Positions

There are four main types of trading:

1. **Long/Short Positions** (Basic trading)
2. **Position Predictions** (Price range betting)
3. **Stock Trading** (Buy and hold stocks)
4. **Margin Trading** (High-risk, high-reward)

### Long Positions

**What it is**: Betting that the price will go UP

**How it works**:
1. Click "Long" button (or press `A`)
2. Your bet amount is deducted from balance
3. Position lasts for 2 seconds
4. If price goes UP → You win 2x your bet (double your money)
5. If price goes DOWN or stays same → You lose your bet

**Example**: 
- Bet $100 on Long
- Price of stock goes from $100 → $101
- You win $200 (2x your bet)
- Profit: $100

### Short Positions

**What it is**: Betting that the price will go DOWN

**How it works**:
1. Click "Short" button (or press `D`)
2. Your bet amount is deducted from balance
3. Position lasts for 2 seconds
4. If price goes DOWN → You win 2x your bet
5. If price goes UP or stays same → You lose your bet

**Example**:
- Bet $100 on Short
- Price goes from $100 → $99
- You win $200 (2x your bet)
- Profit: $100

### Position Predictions

**What it is**: Betting that the price will touch a specific price range within 10 ticks (20 seconds)

**How it works**:
1. **Hover over the right edge** of the chart (within 20px of the right edge) to see a preview
2. **Click on the right edge** of the chart at your desired price level
3. A **prediction interval** is created (2% range around the clicked price)
4. Your bet amount is **2x your current bet** (deducted immediately)
5. The prediction **shrinks horizontally** over 10 ticks (20 seconds)
6. If the price **touches the interval** within 10 ticks → You win 2x your bet (4x total: 2x bet back + 2x profit)
7. If the price **doesn't touch** the interval → You lose your bet

**Example**:
- Current bet: $100
- Click on right edge at $105
- Prediction cost: $200 (2x your bet)
- Interval created: $103.95 - $106.05 (2% range)
- If price touches $103.95-$106.05 within 20 seconds → Win $400 (2x bet back + 2x profit)
- Profit if won: $200


### Bet Amounts & Streaks

**Bet System**:
- Start with default bet amounts: $50, $100, $150, $200
- **Win Streak**: Each win increases your bet to the next tier
- **Loss**: Resets bet to the first tier ($50)


### Bet Lock Timer

After placing a bet, you must wait 2 seconds before placing another bet.

---

## 🥠 Fortune Cookie System

### Buying Fortune Cookies

Fortune cookies contain prophecies that reveal future price movements:

1. **Open Cookie Shop** (right panel)
2. **Click the cookie purchase button** (shows current tier and price)
3. **Cookie is added to your stash**

**Cookie Preview Hints** (Upgrades):
- With **Cookie Stock Hint** upgrade: Hover over cookies in your stash to see which stock they target
- With **Cookie Prophecy Hint** upgrade: Hover over cookies in your stash to see which prophecy type they contain
- These hints help you plan which cookies to decode first based on your trading strategy


### Decoding Prophecies

1. **Drag a cookie** from your stash to the "Signal Reveal" area
2. **Type the fortune text** that appears (like a typing mini-game)
3. **As you type correctly**, encrypted symbols are revealed
4. **When fully decoded**, the prophecy activates!


### Prophecy Types

When decoded, prophecies reveal one of these types:

#### 📈 Trend Up Strength
- **Effect**: Upward trend regime detected - price will trend upward for the duration
- **Duration**: 25-35 seconds (longer with higher tier cookies)
- **Strategy**: Open Long positions during this time
- **Mechanics**: Applies upward trend force - higher tier cookies have stronger trend application

#### 📉 Trend Down Strength
- **Effect**: Downward trend regime detected - price will trend downward for the duration
- **Duration**: 25-35 seconds
- **Strategy**: Open Short positions during this time
- **Mechanics**: Applies downward trend force - higher tier cookies have stronger trend application

#### 🛡️ Shore
- **Effect**: Price floor and ceiling guaranteed - price stays within a safe range
- **Duration**: 25-35 seconds
- **Strategy**: Trade within the safe zone boundaries (floor = green, ceiling = orange)
- **Mechanics**: Combined prophecy that sets both lower bound (floor) and upper bound (ceiling)

#### 🎯 Inevitable Zone
- **Effect**: Price will definitely touch a specific zone (magnetic pull toward target)
- **Duration**: 25-35 seconds
- **Strategy**: Understand future trend and bet towards it - higher tiers place zones farther away for more dramatic movement
- **Mechanics**: Zone distance varies by tier (Tier 1: 0.3-0.5%, Tier 2: 2.0-4.0%, Tier 3: 5.0-10.0%)

#### ⚡ Volatility Spike
- **Effect**: High volatility incoming - big price swings during active window
- **Duration**: 25-35 seconds (with active time window)
- **Strategy**: Buy low sell high - capitalize on large price movements
- **Mechanics**: Volatility multiplier 4.0x-8.0x (Tier 1), 5.0x-10.0x (Tier 2), 6.0x-12.0x (Tier 3)

#### 🌊 Volatility Calm
- **Effect**: Low volatility period - small, predictable price movements
- **Duration**: 25-35 seconds (with active time window)
- **Strategy**: Safer trading environment, smaller gains but more predictable
- **Mechanics**: Volatility multiplier 0.05x-0.1x (much lower than normal)

**Pro Tip**: Higher tier cookies (Golden, Rare) provide:
- Longer durations
- More precise intervals
- Stronger effects

---

### Stock Selection

Use the dropdown in the top navigation to switch between stocks:
- **APLS** - Apples Corp.
- **LOOGL** - Loogle Inc.
- **MASFT** - Macrosoft Corp.
- **LST** - List Inc.
- **NWTN** - Newton Inc.

Each stock has independent price movements and can have different prophecies active.

---

## 🛍️ Shop & Upgrades

### Cookie Shop Upgrades

Purchase upgrades to enhance your trading capabilities:

#### Cookie Discounts
- **Cookie Discount I** ($400): 10% off cookies
- **Cookie Discount II** ($1,200): 25% off cookies
- **Cookie Discount III** ($3,000): 50% off cookies

#### Auto Reveal
- **Auto Reveal I** ($1,200): Automatically reveals 1 letter per tick
- **Auto Reveal II** ($3,000): Reveals 2 letters per tick
- **Auto Reveal III** ($8,000): Reveals 4 letters per tick (very fast)

#### Bet Combo
- **Bet Combo I** ($2,000): Unlock higher bet amounts ($150-$400)
- **Bet Combo II** ($6,000): Even higher bets ($300-$650)
- **Bet Combo III** ($15,000): Maximum bets ($500-$1000)

#### Cookie Tiers
- **Golden Cookie** ($1,000): Unlocks Golden Cookie tier (better prophecies)
- **Rare Cookie** ($5,000): Unlocks Rare Cookie tier (best prophecies)

#### Trading Unlocks
- **Stock Trading Unlock** ($2,500): Unlock stock trading (buy/sell stocks)
- **Margin Trading Unlock** ($5,000): Unlock margin trading (25x multiplier)

#### Margin Multipliers
- **Margin Multiplier I** ($10,000): Increase to 30x
- **Margin Multiplier II** ($20,000): Increase to 40x
- **Margin Multiplier III** ($35,000): Increase to 55x

#### News Access
- **News Tab Unlock** ($1,500): Unlock news tab
- **News Access I** ($3,000): See 25% of news articles
- **News Access II** ($7,000): See 50% of news articles
- **News Access III** ($12,000): See 100% of news articles

#### Bot System
- **Console Tab Unlock** ($2,000): Unlock console/bots tab
- **Bot Bet Tier I** ($3,000): Bots use 25% of your bet
- **Bot Bet Tier II** ($8,000): Bots use 50% of your bet
- **Bot Bet Tier III** ($20,000): Bots use 100% of your bet

#### Cookie Preview Hints
- **Cookie Stock Hint** ($2,500): Shows stock name hint on undecoded cookies (which stock the prophecy targets)
- **Cookie Prophecy Hint** ($3,000): Shows prophecy type hint on undecoded cookies (which type of prophecy it contains)

### Cash Out (Prestige)

When you're ready to transfer your trading profits back to your bank:

1. **Click "Cash Out"** button in the top navigation
2. **Review the summary**:
   - Portfolio Value: Total value of all your positions and stocks
   - Cash Out Fee: 5% of portfolio value (deducted automatically)
   - Net Profit/Loss: Your profit after fees compared to initial deposit
   - You Receive: Final amount transferred to bank
3. **Confirm Cash Out**

**What Happens**:
- All trading positions are closed
- All stocks are sold
- All fortune cookies are cleared
- Trading account resets to $0
- Money (minus 5% fee) is transferred to bank
- You can start a new trading round with more capital!

**Note**: Your bank balance, owned items, and upgrades persist across cash outs.


### Real life Shop

Purchase items to reduce expenses and show off.

**Note**: Estate and cars eliminate daily expenses. Luxury items are purely cosmetic but show your wealth!

---

## 📦 Stock Trading

### Unlocking Stock Trading

Purchase "Stock Trading Unlock" upgrade ($2,500) from the Cookie Shop.

### Buying Stocks

1. **Select a stock** from the dropdown
2. **Click "Buy Stock"** (or press `Space`)
3. **Shares purchased**: Your bet amount ÷ current stock price
4. **Fee**: $25 per transaction (encourages bulk buying)

**Example**:
- Current price: $100
- Bet amount: $500
- Shares: 5.0 shares
- Total cost: $525 ($500 + $25 fee)

### Selling Stocks

1. **Click "Sell All Stock"** button
2. **All shares** of the current stock are sold at current price
3. **Proceeds** added to your balance


### Stock Holdings Display

The chart header shows your current stock holdings:
- **Shares**: Number of shares owned
- **Avg Price**: Your average purchase price
- **Current Value**: Current market value
- **P&L**: Profit or Loss (green = profit, red = loss)

**Strategy**: Buy stocks when you expect long-term price increases. Hold them and sell when profitable!

---

## ⚡ Margin Trading

### Unlocking Margin Trading

Purchase "Margin Trading Unlock" upgrade ($5,000) from the Cookie Shop.

### How Margin Trading Works

Margin trading offers **25x multiplier** (upgradeable to 55x) on price movements:

1. **Open Margin Position**: Click "Long Margin" or "Short Margin"
2. **Two Phases**:
   - **Phase 1 (25 ticks)**: Position is LOCKED - you cannot close it
   - **Phase 2 (25 ticks)**: Position is CLOSABLE - you can close anytime
   - **After Phase 2**: Position auto-closes

3. **Profit/Loss Calculation**:
   - Profit = Bet Amount × (Price Change %) × Multiplier
   - Example: $100 bet, 2% price increase, 25x multiplier = $50 profit

### Margin Call

If your position loses too much value, it will be automatically closed (margin call). This protects you from extreme losses.

### Strategy Tips

- **High Risk, High Reward**: Small price movements = big profits/losses
- **Use with Prophecies**: Combine with fortune cookie prophecies for better timing
- **Watch the Timer**: Close positions during Phase 2 when profitable
- **Start Small**: Test with small bets before going big

---

## 📰 News System

### Unlocking News

1. Purchase "News Tab Unlock" ($1,500) to access the News tab
2. Purchase News Access upgrades to see more articles:
   - News Access I: 25% visible
   - News Access II: 50% visible
   - News Access III: 100% visible

### How News Works

News articles are generated based on actual market events:

- **Trend Up**: Articles about upward price movements
- **Trend Down**: Articles about downward price movements
- **Volatility**: Articles about high volatility periods
- **General**: General market updates

**Strategy**: News can provide additional context for trading decisions.

---

## 🤖 Bot Trading System

### Unlocking Bots

1. Purchase "Console Tab Unlock" ($2,000) to access the Console tab
2. Purchase Bot Bet Tier upgrades to increase bot bet sizes

### Creating Bots

Bots automatically trade based on technical indicators:

1. **Open Console Tab** (right panel)
2. **Use console commands** to create bots:
   ```
   create [fast] [slow] [separation] [strength] [cooldown] [confidence]
   ```

**Example**: `create 10 30 0.5 1 0 5`


### Bot Management

**Console Commands**:
- `create` - Create or update bot
- `show` - Show bot status (updates in real-time)
- `enable` - Enable bot
- `disable` - Disable bot
- `delete` - Delete bot
- `help` - Show all commands

**Bot Bet Sizes**:
- Default: 10% of your current bet
- Bot Bet Tier I: 25% of your bet
- Bot Bet Tier II: 50% of your bet
- Bot Bet Tier III: 100% of your bet

**Strategy**: Use bots to trade automatically when you find good parameter combination

---


## 💸 Expenses & Lifestyle

### Daily Expenses

Every real calendar day at midnight, expenses are deducted from your bank balance:

- **Rent**: $30/day (eliminated by owning estate)
- **Utilities**: $3/day
- **Groceries**: $12/day
- **Transport**: $3/day (eliminated by owning car)
- **Phone Bill**: $1/day
- **Internet**: $1/day
- **Insurance**: $10/day
- **Subscriptions**: $1/day

**Total**: ~$61/day (can be reduced by purchasing estate and cars)

### Managing Expenses

1. **Open Expenses App** from phone interface
2. **View all expenses** and totals
3. **Adjust spending** using +/- buttons (minimum values shown)
4. **Purchase estate/cars** to eliminate rent/transport expenses

**Strategy**: This is a mostly RP sandbox feature go ahead and place here whatever you like!


---

## 🏆 Leaderboard

### Viewing the Leaderboard

1. **Open "Whales" app** from phone interface
2. **See top traders** ranked by bank balance
3. **Your rank** is displayed if you're in the top players

**Note**: Only legitimate players appear on the leaderboard (anti-cheat system filters suspicious accounts). If you have not cheated and think that you have been blocked falsly reachout to arkhipov.design@gmail.com

---

## 💡 Tips & Strategies

### Beginner Strategy

1. **Start Small**: Begin with small deposits ($100-$250)
2. **Learn the Basics**: Master Long/Short positions first
3. **Use Prophecies**: Buy fortune cookies and decode them for trading insights
4. **Manage Risk**: Don't bet your entire balance on one trade
5. **Cash Out Regularly**: Transfer profits to bank to avoid losing everything

### Intermediate Strategy

1. **Upgrade Smartly**: 
   - Cookie Discount I is great value
2. **Combine Systems**: Use prophecies + margin trading for maximum profit
3. **Build Streaks**: Win multiple trades in a row to increase bet sizes
4. **Use Predictions**: Position predictions work great with Inevitable Zone prophecies

### Advanced Strategy

1. **Margin Trading**: Use margin with strong prophecies for huge profits
2. **Bot Automation**: Create bots to trade while you sleep
3. **Portfolio Diversification**: Hold stocks in multiple stocks
4. **News Analysis**: News provide reliable trending insights
5. **Loan Management**: Use loans strategically when you have strong trading setups

### Common Mistakes to Avoid

1. **Betting Too Much**: Don't risk your entire balance
2. **Not Using Prophecies**: Fortune cookies are your best tool - use them!
3. **Panic Trading**: Don't make emotional decisions
4. **Forgetting to Cash Out**: Transfer profits regularly to protect gains

---

## ❓ Frequently Asked Questions

**Q: What happens if I lose all my money?**
A: If your bank balance and trading balance both drop below $50 with no loan available, you'll see a Game Over screen. You can restart the game.

**Q: Do I lose my upgrades when I cash out?**
A: No! Upgrades, owned items, and bank balance persist across cash outs. Only your trading account resets.

**Q: Can I trade multiple stocks at once?**
A: Yes! You can hold stocks in multiple symbols simultaneously. Each stock is tracked independently.

**Q: How do I know which prophecy is active?**
A: Active prophecies are shown in the "Active Prophecies" panel on the left side of the screen.

**Q: Can bots trade while I'm offline?**
A: No, bots only trade when the game is open and running. The game must be active for bots to execute trades.

**Q: How do I increase my bet amounts?**
A: Win multiple trades in a row to build a streak, or purchase Bet Combo upgrades to unlock higher bet tiers.

**Q: How do position predictions work?**
A: Click on the right edge of the chart (within 20px) to place a prediction. You bet 2x your current bet amount that the price will touch a 2% interval around your clicked price within 10 ticks (20 seconds). If successful, you win 2x your bet (4x total return).

**Q: Can I place multiple predictions?**
A: Yes! You can place multiple predictions on the chart. Each prediction is independent and resolves after 10 ticks.

---

*Last Updated: January 2026*

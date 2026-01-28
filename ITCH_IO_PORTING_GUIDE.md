# 🎮 Itch.io Porting Guide

This guide explains how to prepare and upload Fortune Trader to itch.io.

## 📦 Two Versions Available

### 1. **Online Version** (Main Project)
- Location: Root directory (`/`)
- Features: Firebase integration, cloud sync, leaderboard
- Use for: GitHub Pages, Firebase Hosting, or other online hosting

### 2. **Singleplayer Version** (Itch.io Ready)
- Location: `/singleplayer/` directory
- Features: Offline-only, localStorage saves, no Firebase
- Use for: Itch.io uploads (no file limit issues)

---

## 📝 Itch.io Page Description

Use this comprehensive description for your itch.io page:

```
🎮 FORTUNE TRADER - Trading Sandbox Game

A deep trading sandbox game set in a world where fortune cookie prophecies actually come true! 
Experience the thrill of simulated stock market trading with real-time price charts, multiple 
trading strategies, and a unique prophecy system that guides your decisions.

📈 CORE TRADING FEATURES:
• Real-time price charts with 5 different stocks (APLS, LOOGL, MASFT, LST, NWTN)
• Long/Short positions - Bet on price direction with 2x returns
• Position Predictions - Place bets on price ranges with 4x returns
• Stock Trading - Buy and hold shares across multiple stocks
• Margin Trading - High-risk, high-reward trading with up to 55x multipliers
• Win streak system - Build combos to unlock higher bet amounts

🥠 FORTUNE COOKIE SYSTEM:
• Purchase and decode fortune cookies to reveal prophecies
• 6 prophecy types: Trend Up/Down, Shore (price floors/ceilings), Inevitable Zone, 
  Volatility Spike/Calm
• Interactive decoding mini-game - type to reveal encrypted prophecies
• Three cookie tiers: Standard, Golden, and Rare (with stronger effects)
• Cookie preview hints - See which stock and prophecy type before decoding

💰 BANKING & FINANCE:
• Deposit money from bank to trading account
• Take loans based on lifetime earnings (5-15% interest)
• Daily expenses system - Manage rent, utilities, groceries, transport, and more
• Cash out system - Transfer profits back to bank (5% fee)

🛍️ SHOP & UPGRADES:
• Cookie Discounts (up to 50% off)
• Auto Reveal upgrades (automatically decode prophecies faster)
• Bet Combo upgrades (unlock higher bet amounts up to $1000)
• Cookie tier unlocks (Golden and Rare cookies)
• Trading unlocks (Stock Trading, Margin Trading)
• Margin multipliers (up to 55x leverage)
• News access upgrades (see market news articles)
• Bot system unlocks (automated trading bots)
• Cookie preview hints (stock and prophecy type hints)

🏠 LIFESTYLE ITEMS:
• Purchase cars, real estate, and luxury items
• Reduce daily expenses by owning property and vehicles
• Show off your wealth with cosmetic items

🤖 AUTOMATED TRADING:
• Create custom trading bots using technical indicators
• Configure bot parameters (fast/slow moving averages, separation, strength, cooldown)
• Bots trade automatically based on your settings
• Multiple bot bet tiers (up to 100% of your bet size)

📰 NEWS SYSTEM:
• Market news generated based on actual price movements
• Unlock news access to see more articles
• Use news to inform trading decisions

🎯 GAMEPLAY SYSTEMS:
• Win streak mechanics - Increase bet sizes with consecutive wins
• Bet lock timer - Strategic timing between trades
• Multiple stock selection - Trade across 5 different companies
• Portfolio management - Track holdings, average price, P&L
• Active prophecy tracking - See all active prophecies in real-time

This is the offline singleplayer version with all core gameplay features. Your progress is 
saved locally in your browser. For the full online experience with global leaderboards, 
cloud syncing across devices, multiplayer features, and competitive rankings, check out the 
online version at: https://dremmer8.github.io/Fortune-trader/

Perfect for players who want to experience the complete trading sandbox offline, or for those 
who want to try the game before creating an account on the online version!
```

**Medium version (if you need something shorter but still comprehensive):**
```
🎮 FORTUNE TRADER - Trading Sandbox Game

A deep trading sandbox where fortune cookie prophecies actually come true! Trade in 
simulated stock markets with real-time charts, multiple strategies, and a unique prophecy 
system.

FEATURES:
• Multiple trading types: Long/Short positions, Position Predictions, Stock Trading, 
  Margin Trading (up to 55x leverage)
• Fortune Cookie System: Decode prophecies to reveal market insights (6 prophecy types, 
  3 tiers)
• Banking & Finance: Deposits, loans, daily expenses, cash out system
• Shop & Upgrades: Cookie discounts, auto-reveal, bet combos, trading unlocks, bot system, 
  news access
• Lifestyle Items: Purchase cars, real estate, luxury items to reduce expenses
• Automated Trading: Create custom bots with technical indicators
• News System: Market news based on price movements
• 5 Tradeable Stocks: APLS, LOOGL, MASFT, LST, NWTN

This offline version includes all core gameplay with local save. For global leaderboards, 
cloud syncing, and online features, visit: https://dremmer8.github.io/Fortune-trader/
```

**Short version (if character limit is very tight):**
```
Trading sandbox game where fortune cookie prophecies come true! Trade in simulated markets 
with Long/Short positions, Stock Trading, Margin Trading (55x), and decode prophecies for 
trading insights. Features: banking system, shop upgrades, automated bots, news system, 
lifestyle items, and 5 tradeable stocks. Offline version with local saves. For leaderboards, 
cloud sync, and online features: https://dremmer8.github.io/Fortune-trader/
```

---

## 🚀 Porting to Itch.io

### Step 1: Use the Singleplayer Version

The singleplayer version is already configured for itch.io:
- ✅ No Firebase dependencies (reduces file count)
- ✅ Works offline
- ✅ Under 1000 files limit
- ✅ All game features intact

### Step 2: Create ZIP File

**Option A: Use PowerShell Script**
```powershell
cd singleplayer
..\create-itch-zip.ps1
```

**Option B: Manual ZIP**
1. Navigate to the `singleplayer/` directory
2. Select all files and folders
3. Create a ZIP file named `fortune-trader-itch.zip`
4. Verify file count is under 1000

### Step 3: Upload to Itch.io

1. Go to your itch.io project page
2. Click **"Upload new file"**
3. Select your ZIP file
4. Set file type to **"HTML"** or **"Web"**
5. Mark as **default file** for HTML5 games
6. Publish!

---

## ⚠️ Important: Working on the Online Version

**When making changes to the main (online) version:**

### ❌ DO NOT Modify:
- `/singleplayer/` directory and its contents
- Any files inside the singleplayer folder

### ✅ DO Modify:
- Root directory files (`index.html`, `js/`, `css/`, etc.)
- Firebase configuration
- Online features (leaderboard, cloud sync, etc.)

### Why?
- Singleplayer version is maintained separately
- Prevents accidental breaking of the offline version
- Singleplayer updates will be handled manually when needed

---

## 🔄 Updating Singleplayer Version

When you want to sync new features to singleplayer:

1. **Review changes** in the main version
2. **Manually port** relevant features to `/singleplayer/`
3. **Test** the singleplayer version
4. **Create new ZIP** and upload to itch.io

**Note:** This manual process ensures singleplayer stays stable and doesn't break with online-only features.

---

## 📋 Checklist Before Upload

- [ ] ZIP file is under 1000 files
- [ ] ZIP file size is reasonable (< 50MB recommended)
- [ ] Game works when opening `index.html` directly
- [ ] No console errors
- [ ] All assets load correctly
- [ ] Save/load works (localStorage)

---

## 🐛 Troubleshooting

### "Too many files" error
- ✅ Use the singleplayer version (already optimized)
- ✅ Run `create-itch-zip.ps1` to exclude unnecessary files
- ✅ Check for hidden files (`.git`, `node_modules`, etc.)

### Game doesn't load
- Check browser console for errors
- Verify all file paths are relative (not absolute)
- Test locally before uploading

### Save data not working
- Check browser localStorage is enabled
- Verify `js/state.js` save functions are working
- Test in incognito mode (fresh state)

---

## 📝 File Structure

```
Fortune-trader/
├── index.html              ← Online version (main)
├── js/                     ← Online version JS
├── css/                    ← Shared styles
├── images/                 ← Shared assets
├── audio/                  ← Shared audio
├── singleplayer/          ← Itch.io version
│   ├── index.html         ← Singleplayer entry point
│   ├── js/                ← Singleplayer JS (no Firebase)
│   ├── css/               ← Copied styles
│   ├── images/            ← Copied images
│   ├── audio/             ← Copied audio
│   └── README.md          ← Singleplayer docs
└── create-itch-zip.ps1    ← ZIP creation script
```

---

## 💡 Tips

- **Keep versions separate**: Online and singleplayer are independent
- **Test locally first**: Always test the ZIP contents before uploading
- **Version control**: Consider tagging releases for both versions
- **Documentation**: Update this guide if the process changes

---

**Last Updated:** January 2026

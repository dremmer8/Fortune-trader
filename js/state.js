// Game State Management

// Chart configuration
const CHART_VISIBLE_POINTS = 100; // Always show this many points on chart

// Note: Banking constants (STARTING_BANK_BALANCE, MIN_DEPOSIT, CASH_OUT_FEE_PERCENT) 
// are defined in config.js

const state = {
    // Banking (meta-game layer)
    bankBalance: STARTING_BANK_BALANCE,
    totalEarnings: 0, // Track lifetime earnings for prestige stats
    tradingRounds: 0, // Track number of completed trading rounds
    initialDeposit: 0, // Track initial deposit for current trading round
    lastExpenseDate: null, // Last date expenses were charged (YYYY-MM-DD format)
    ownedItems: [], // Items purchased from shop { id, name, category, icon, price }
    customExpenseAmounts: {}, // Custom expense amounts { expenseId: amount }
    activeLoan: null, // Active loan details
    
    // Trading balance (in-game)
    balance: 0, // Start with 0 until deposit
    displayBalance: 0, // For smooth animation
    
    // Current time frame for chart display
    currentTimeFrame: DEFAULT_TIME_FRAME, // 'LIVE', '1H', '1D', '1W', '1M', '1Y'
    
    // Per-symbol chart persistence (LIVE time frame only, for real-time trading)
    chartHistory: {},      // { symbol: [{value, timestamp}, ...] }
    chartPrices: {},       // { symbol: { currentPrice, displayPrice, targetPrice } }
    chartSimState: {},     // { symbol: { sim state object } }
    
    // Time frame history cache (for non-LIVE frames)
    // Structure: { symbol: { timeFrame: [{value, timestamp}, ...] } }
    timeFrameHistory: {},
    
    // Current active chart state (maps to chartHistory[dataMode])
    _priceHistory: [],     // Internal storage, use priceHistory getter/setter
    currentPrice: 100,
    displayPrice: 100, // For smooth vertical interpolation (always at right edge)
    targetPrice: 100, // Target price to interpolate towards
    cookie: null,
    cookieInventory: [], // Array of purchased but unopened cookies
    deals: [],
    selectedProphecyId: null, // Currently selected prophecy for decoding
    purchasedUpgrades: [], // Array of purchased upgrade IDs
    positions: [],
    // Stock holdings - keyed by stock symbol
    stockHoldings: {}, // { symbol: { shares: number, avgPrice: number, totalInvested: number } }
    dataMode: 'APLS', // Current stock symbol
    lastPriceUpdate: Date.now(),
    priceUpdateInterval: 2000, // ms between price updates (2 seconds)
    animationFrameId: null,
    // Streak and betting system
    betIndex: 0, // Index into BET_AMOUNTS
    streakCount: 0,
    lastBetTime: 0, // Timestamp of last bet (for timing lock)
    
    // Realistic price simulation state (for cached mode)
    sim: {
        // Volatility clustering
        volatility: 1,              // Current volatility multiplier (0.5 to 3)
        volatilityTarget: 1,        // Target volatility (smooth transitions)
        
        // Trend state
        trend: 0,                   // Current trend direction (-1 to 1)
        trendDuration: 0,           // Ticks until trend changes
        
        // Support/Resistance levels
        supports: [],               // Array of support price levels
        resistances: [],            // Array of resistance price levels
        
        // Consolidation/Breakout
        isConsolidating: false,     // Currently in consolidation phase
        consolidationTicks: 0,      // How long in consolidation
        consolidationCenter: 0,     // Center price of consolidation range
        consolidationRange: 0,      // Width of consolidation range
        breakoutDirection: 0,       // Direction of breakout when it happens
        breakoutStrength: 0,        // Remaining breakout momentum
        
        // Candlestick data for current interval
        candle: {
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            ticksInCandle: 0        // Track ticks within candle period
        },
        candleHistory: [],          // Array of completed candles
        
        // Recent price tracking for levels
        recentHigh: 0,
        recentLow: Infinity
    }
};

// Get current stock holding for active symbol
function getCurrentStockHolding() {
    return state.stockHoldings[state.dataMode] || null;
}

// Calculate current P&L for stock holding
function getStockPnL(holding) {
    if (!holding || holding.shares === 0) return { value: 0, percent: 0 };
    const currentValue = holding.shares * state.displayPrice;
    const pnlValue = currentValue - holding.totalInvested;
    const pnlPercent = (pnlValue / holding.totalInvested) * 100;
    return { value: pnlValue, percent: pnlPercent };
}

// Calculate total portfolio value (balance + all stock holdings)
function getTotalPortfolioValue() {
    let totalValue = state.balance;
    
    // Sum up current value of all stock holdings across all symbols
    Object.keys(state.stockHoldings).forEach(symbol => {
        const holding = state.stockHoldings[symbol];
        if (holding && holding.shares > 0) {
            // Get current price for this symbol
            const prices = state.chartPrices[symbol];
            if (prices && prices.displayPrice) {
                totalValue += holding.shares * prices.displayPrice;
            }
        }
    });
    
    return totalValue;
}

// Calculate total portfolio display value (for smooth animation)
function getTotalPortfolioDisplayValue() {
    let totalValue = state.displayBalance;
    
    // Sum up current value of all stock holdings across all symbols
    Object.keys(state.stockHoldings).forEach(symbol => {
        const holding = state.stockHoldings[symbol];
        if (holding && holding.shares > 0) {
            // Get current price for this symbol
            const prices = state.chartPrices[symbol];
            if (prices && prices.displayPrice) {
                totalValue += holding.shares * prices.displayPrice;
            }
        }
    });
    
    return totalValue;
}

// Helper to get/set priceHistory that maps to chartHistory[dataMode]
// For non-LIVE time frames, uses timeFrameHistory instead
Object.defineProperty(state, 'priceHistory', {
    get: function() {
        // For non-LIVE time frames, use cached time frame history
        if (this.currentTimeFrame && this.currentTimeFrame !== 'LIVE') {
            const tfHistory = this.timeFrameHistory[this.dataMode];
            if (tfHistory && tfHistory[this.currentTimeFrame]) {
                return tfHistory[this.currentTimeFrame];
            }
            // Fall back to LIVE if time frame history not available
        }
        
        // LIVE mode uses chartHistory
        if (!this.chartHistory[this.dataMode]) {
            this.chartHistory[this.dataMode] = [];
        }
        return this.chartHistory[this.dataMode];
    },
    set: function(value) {
        this.chartHistory[this.dataMode] = value;
    }
});

// Helper to get prices array for backwards compatibility
Object.defineProperty(state, 'prices', {
    get: function() {
        return this.priceHistory.map(p => p.value);
    }
});

// Save current chart prices for the active symbol
function saveCurrentPrices() {
    const symbol = state.dataMode;
    state.chartPrices[symbol] = {
        currentPrice: state.currentPrice,
        displayPrice: state.displayPrice,
        targetPrice: state.targetPrice
    };
}

// Restore chart prices for the active symbol
function restoreCurrentPrices() {
    const symbol = state.dataMode;
    if (state.chartPrices[symbol]) {
        const prices = state.chartPrices[symbol];
        state.currentPrice = prices.currentPrice;
        state.displayPrice = prices.displayPrice;
        state.targetPrice = prices.targetPrice;
        return true;
    }
    return false;
}

// Save simulation state for the active symbol
function saveSimState() {
    const symbol = state.dataMode;
    state.chartSimState[symbol] = JSON.parse(JSON.stringify(state.sim));
}

// Restore simulation state for the active symbol
function restoreSimState() {
    const symbol = state.dataMode;
    if (state.chartSimState[symbol]) {
        state.sim = JSON.parse(JSON.stringify(state.chartSimState[symbol]));
        return true;
    }
    return false;
}

// Check if chart has existing history for a symbol
function hasChartHistory(symbol) {
    return state.chartHistory[symbol] && state.chartHistory[symbol].length > 0;
}

// Get current bet amount
function getCurrentBet() {
    const betAmounts = typeof getCurrentBetAmounts === 'function' ? getCurrentBetAmounts() : BET_AMOUNTS;
    return betAmounts[state.betIndex] || betAmounts[0];
}

// Check if betting is allowed (2 second lock per tick)
function canPlaceBet() {
    const now = Date.now();
    const timeSinceLastBet = now - state.lastBetTime;
    return timeSinceLastBet >= 2000; // 2 seconds
}

// Get remaining lock time in seconds
function getBetLockRemaining() {
    const now = Date.now();
    const timeSinceLastBet = now - state.lastBetTime;
    const remaining = Math.max(0, 2000 - timeSinceLastBet);
    return Math.ceil(remaining / 1000);
}

// Handle win - increase streak and bet
function handleWin() {
    state.streakCount++;
    const betAmounts = typeof getCurrentBetAmounts === 'function' ? getCurrentBetAmounts() : BET_AMOUNTS;
    if (state.betIndex < betAmounts.length - 1) {
        state.betIndex++;
    }
    updateComboCounter();
}

// Handle loss - reset streak and bet
function handleLoss() {
    state.streakCount = 0;
    state.betIndex = 0;
    updateComboCounter();
}

// Update combo counter display
function updateComboCounter() {
    const streakStat = document.getElementById('streakStat');
    const streakNum = document.getElementById('streakNumber');
    const betAmount = document.getElementById('currentBetAmount');
    const betNext = document.getElementById('betNext');
    
    streakNum.textContent = state.streakCount;
    betAmount.textContent = '$' + getCurrentBet().toLocaleString();
    
    // Update next bet info
    const betAmounts = typeof getCurrentBetAmounts === 'function' ? getCurrentBetAmounts() : BET_AMOUNTS;
    if (state.betIndex < betAmounts.length - 1) {
        betNext.innerHTML = 'Next: <span>$' + betAmounts[state.betIndex + 1].toLocaleString() + '</span>';
    } else {
        betNext.innerHTML = '<span class="bet-max">MAX!</span>';
    }
    
    // Update visual style based on streak
    streakStat.classList.remove('on-streak', 'high-streak');
    if (state.streakCount >= 5) {
        streakStat.classList.add('high-streak');
    } else if (state.streakCount >= 1) {
        streakStat.classList.add('on-streak');
    }
}

// ===========================================
// SAVE/LOAD SYSTEM
// ===========================================
const SAVE_KEY = 'fortuneTrader_save';

// Save game state - Hybrid: localStorage (primary) + Firebase (backup/sync)
async function saveGameState() {
    const saveData = {
        version: 7,
        timestamp: Date.now(),
        // Banking data
        bankBalance: state.bankBalance,
        totalEarnings: state.totalEarnings,
        tradingRounds: state.tradingRounds,
        initialDeposit: state.initialDeposit,
        lastExpenseDate: state.lastExpenseDate,
        ownedItems: state.ownedItems || [],
        customExpenseAmounts: state.customExpenseAmounts || {},
        activeLoan: state.activeLoan || null,
        // Trading data
        balance: state.balance,
        stockHoldings: state.stockHoldings,
        streakCount: state.streakCount,
        betIndex: state.betIndex,
        purchasedUpgrades: state.purchasedUpgrades || [],
        cookieInventory: state.cookieInventory || []
    };
    
    // PRIMARY: Save to localStorage (fast, works offline)
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('Game saved to localStorage');
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
    
    // BACKUP/SYNC: Save to Firebase (for cross-device access)
    // Only sync if logged in and Firebase is available
    if (isLoggedIn && playerId && typeof FirebaseService !== 'undefined') {
        // Fire and forget - don't block on Firebase save
        FirebaseService.saveUserData(playerId, playerName, saveData).catch(err => {
            console.warn('Firebase sync failed (localStorage saved):', err);
        });
    }
}

// Load game state - Hybrid: Check Firebase first (cross-device), then localStorage
async function loadGameState() {
    let saveData = null;
    let source = 'none';
    
    // STEP 1: If logged in, check Firebase first (for cross-device access)
    if (isLoggedIn && playerId && typeof FirebaseService !== 'undefined') {
        try {
            const result = await FirebaseService.loadUserData(playerId, playerName);
            if (result.success && result.data) {
                saveData = result.data;
                source = 'firebase';
                console.log('Loaded game data from Firebase (cloud sync)');
            }
        } catch (error) {
            console.warn('Firebase load failed, trying localStorage:', error);
        }
    }
    
    // STEP 2: If no cloud data, try localStorage (local device)
    if (!saveData) {
        try {
            const savedData = localStorage.getItem(SAVE_KEY);
            if (savedData) {
                saveData = JSON.parse(savedData);
                source = 'localStorage';
                console.log('Loaded game data from localStorage');
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }
    
    // STEP 3: Restore state if we found data
    if (saveData) {
        // Restore banking state
        state.bankBalance = saveData.bankBalance !== undefined ? saveData.bankBalance : STARTING_BANK_BALANCE;
        state.totalEarnings = saveData.totalEarnings || 0;
        state.tradingRounds = saveData.tradingRounds || 0;
        state.initialDeposit = saveData.initialDeposit || 0;
        state.lastExpenseDate = saveData.lastExpenseDate || null;
        state.ownedItems = saveData.ownedItems || [];
        state.customExpenseAmounts = saveData.customExpenseAmounts || {};
        state.activeLoan = saveData.activeLoan || null;
        
        // Restore trading state
        state.balance = saveData.balance !== undefined ? saveData.balance : 0;
        state.displayBalance = state.balance;
        state.stockHoldings = saveData.stockHoldings || {};
        state.streakCount = saveData.streakCount || 0;
        state.betIndex = saveData.betIndex || 0;
        state.purchasedUpgrades = saveData.purchasedUpgrades || [];
        state.cookieInventory = saveData.cookieInventory || [];
        
        // If we loaded from Firebase, also update localStorage (merge)
        if (source === 'firebase') {
            try {
                localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
                console.log('Synced cloud data to localStorage');
            } catch (e) {
                console.warn('Failed to sync to localStorage:', e);
            }
        }
        
        return true;
    }
    
    // No save data found - start fresh
    console.log('No save data found, starting fresh');
    return false;
}

// Clear save data (for reset)
function clearSaveData() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log('Save data cleared');
    } catch (e) {
        console.error('Failed to clear save data:', e);
    }
}

// Reset game to initial state
function resetGameState() {
    // Reset banking
    state.bankBalance = STARTING_BANK_BALANCE;
    state.totalEarnings = 0;
    state.tradingRounds = 0;
    state.initialDeposit = 0;
    state.lastExpenseDate = null;
    state.ownedItems = [];
    state.customExpenseAmounts = {};
    state.activeLoan = null;
    
    // Reset trading
    state.balance = 0;
    state.displayBalance = 0;
    state.stockHoldings = {};
    state.streakCount = 0;
    state.betIndex = 0;
    state.purchasedUpgrades = [];
    state.cookieInventory = [];
    state.deals = [];
    state.positions = [];
    state.cookie = null;
    
    clearSaveData();
}

// ===========================================
// BANKING FUNCTIONS
// ===========================================

// Deposit money from bank to trading account
function depositToTrading(amount) {
    if (amount < MIN_DEPOSIT) {
        return { success: false, message: `Minimum deposit is $${MIN_DEPOSIT}` };
    }
    if (amount > state.bankBalance) {
        return { success: false, message: 'Insufficient bank balance' };
    }
    
    state.bankBalance -= amount;
    state.balance += amount;
    state.displayBalance = state.balance;
    state.initialDeposit += amount; // Track cumulative deposits for this round
    
    saveGameState();
    return { success: true, message: `Deposited $${amount.toLocaleString()} to trading account` };
}

// Prestige: Transfer entire portfolio back to bank
function prestigeToBank() {
    const portfolioValue = getTotalPortfolioValue();
    
    if (portfolioValue <= 0) {
        return { success: false, message: 'No funds to transfer' };
    }
    
    // Calculate cash out fee
    const fee = Math.floor(portfolioValue * CASH_OUT_FEE_PERCENT);
    const amountAfterFee = portfolioValue - fee;
    
    // Calculate net profit for this round (after fee, compared to initial deposit)
    const netProfit = amountAfterFee - state.initialDeposit;
    const initialDeposit = state.initialDeposit; // Store before reset
    
    // Transfer to bank (minus fee)
    state.bankBalance += amountAfterFee;
    state.totalEarnings += Math.max(0, netProfit);
    state.tradingRounds++;
    
    // Reset trading account
    state.balance = 0;
    state.displayBalance = 0;
    state.initialDeposit = 0;
    state.stockHoldings = {};
    state.deals = [];
    state.positions = [];
    state.cookieInventory = [];
    state.streakCount = 0;
    state.betIndex = 0;
    
    saveGameState();
    return { 
        success: true, 
        message: `Transferred $${amountAfterFee.toLocaleString()} to bank!`,
        amount: amountAfterFee,
        fee: fee,
        netProfit: netProfit,
        initialDeposit: initialDeposit
    };
}

// Calculate cash out fee for display
function getCashOutFee(portfolioValue) {
    return Math.floor(portfolioValue * CASH_OUT_FEE_PERCENT);
}

// Check if trading account has funds (can play trader)
function hasTradingFunds() {
    return state.balance > 0 || getTotalPortfolioValue() > 0;
}

// Auto-save on important state changes
function autoSave() {
    // Call async function but don't await (fire and forget)
    saveGameState().catch(err => {
        console.warn('Auto-save failed:', err);
    });
}

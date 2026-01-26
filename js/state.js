// Game State Management

// Chart configuration
const CHART_VISIBLE_POINTS = 100; // Always show this many points on chart

// Note: Banking constants (STARTING_BANK_BALANCE, MIN_DEPOSIT, CASH_OUT_FEE_PERCENT) 
// are defined in config.js

const state = {
    // Banking (meta-game layer)
    bankBalance: STARTING_BANK_BALANCE,
    totalEarnings: 0, // Track lifetime earnings for prestige stats
    lifetimeSpendings: 0, // Track lifetime spendings (expenses, luxury, loan interest)
    tradingRounds: 0, // Track number of completed trading rounds
    initialDeposit: 0, // Track initial deposit for current trading round
    lastExpenseDate: null, // Last date expenses were charged (YYYY-MM-DD format)
    ownedItems: [], // Items purchased from shop { id, name, category, icon, price }
    customExpenseAmounts: {}, // Custom expense amounts { expenseId: amount }
    activeLoan: null, // Active loan details
    spendingHistory: [], // Spend entries { type, label, amount, timestamp }
    earningsHistory: [], // Trading round history entries
    
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
    // Margin trading
    marginPosition: null, // Active margin position { id, direction, amount, entryPrice, startTick, stockSymbol, phase: 'locked' | 'closable' }
    // Auto trading bots
    bots: [], // Array of bot configurations { id, name, enabled, strategy, params, stockSymbol, createdAt, lastTradeTime }
    // Predictions - in-memory only (not saved until resolved to prevent save scumming)
    predictions: [], // Array of active predictions { id, price, intervalMin, intervalMax, amount, startTick, stockSymbol, resolved }
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
// Pending save snapshot key
const PENDING_SAVE_KEY = 'fortuneTrader_pendingSave';

// Helper function to serialize deals for saving (convert Set to Array)
function serializeDeals(deals) {
    if (!deals || !Array.isArray(deals)) return [];
    
    // Only save undecoded prophecies (not resolved, not decoded)
    return deals
        .filter(deal => !deal.resolved && !deal.isDecoded)
        .map(deal => {
            // Create a serializable copy
            const serialized = { ...deal };
            // Convert Set to Array for revealedIndices
            if (deal.revealedIndices instanceof Set) {
                serialized.revealedIndices = Array.from(deal.revealedIndices);
            } else if (Array.isArray(deal.revealedIndices)) {
                serialized.revealedIndices = deal.revealedIndices;
            } else {
                serialized.revealedIndices = [];
            }
            return serialized;
        });
}

// Helper function to deserialize deals when loading (convert Array back to Set)
function deserializeDeals(serializedDeals) {
    if (!serializedDeals || !Array.isArray(serializedDeals)) return [];
    
    return serializedDeals.map(deal => {
        // Convert Array back to Set for revealedIndices
        if (Array.isArray(deal.revealedIndices)) {
            deal.revealedIndices = new Set(deal.revealedIndices);
        } else {
            deal.revealedIndices = new Set();
        }
        
        // Restore computed 'remaining' property if it doesn't exist
        // (This property is defined with Object.defineProperty in createProphecy)
        if (!deal.hasOwnProperty('remaining')) {
            Object.defineProperty(deal, 'remaining', {
                get: function() {
                    if (!this.startTime) return this.duration; // Not decoded yet, show full duration
                    return Math.max(0, this.duration - (Date.now() - this.startTime) / 1000);
                },
                enumerable: true,
                configurable: true
            });
        }
        
        return deal;
    });
}

async function saveGameState() {
    const saveData = {
        version: 9,
        timestamp: Date.now(),
        // Banking data
        bankBalance: state.bankBalance,
        totalEarnings: state.totalEarnings,
        lifetimeSpendings: state.lifetimeSpendings,
        tradingRounds: state.tradingRounds,
        initialDeposit: state.initialDeposit,
        lastExpenseDate: state.lastExpenseDate,
        ownedItems: state.ownedItems || [],
        customExpenseAmounts: state.customExpenseAmounts || {},
        activeLoan: state.activeLoan || null,
        spendingHistory: state.spendingHistory || [],
        earningsHistory: state.earningsHistory || [],
        // Trading data
        balance: state.balance,
        stockHoldings: state.stockHoldings,
        streakCount: state.streakCount,
        betIndex: state.betIndex,
        purchasedUpgrades: state.purchasedUpgrades || [],
        cookieInventory: state.cookieInventory || [],
        deals: serializeDeals(state.deals || []), // Save undecoded prophecies
        marginPosition: state.marginPosition || null
    };

    // PRIMARY: Save to localStorage (fast, works offline)
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('Game saved to localStorage');
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
    
    // Store as pending save snapshot (for boot-time sync) - WITH SIGNATURE
    // This prevents tampering with the pending snapshot in localStorage
    try {
        if (typeof SecurityService !== 'undefined') {
            // Sign the snapshot to prevent tampering
            const signed = await SecurityService.prepareSaveData(saveData);
            localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(signed.payload));
        } else {
            // SECURITY: If SecurityService is unavailable, DO NOT save pending snapshot
            // This prevents attackers from disabling SecurityService to bypass signatures
            console.error('⚠️ SecurityService unavailable - pending save NOT stored (security risk)');
            localStorage.removeItem(PENDING_SAVE_KEY);
        }
    } catch (e) {
        console.warn('Failed to save pending snapshot:', e);
        // On error, remove any existing unsigned snapshot
        localStorage.removeItem(PENDING_SAVE_KEY);
    }
    
    // BACKUP/SYNC: Save to Firebase (for cross-device access)
    // Only sync if logged in and Firebase is available
    if (isLoggedIn && playerId && typeof FirebaseService !== 'undefined') {
        // Check rate limit
        if (typeof SecurityService !== 'undefined') {
            const gate = SecurityService.canSubmitToCloud();
            if (!gate.ok) {
                console.log(`⏳ Firebase sync rate limited (will sync on next boot, ${Math.ceil(gate.retryInMs / 1000)}s remaining)`);
                return; // Keep in pending queue for boot-time sync
            }
        }
        
        // Attempt Firebase sync
        try {
            await FirebaseService.saveUserData(playerId, playerName, saveData);
            // Success - but DON'T clear pending snapshot yet
            // It will be cleared on next boot after we verify Firebase has the data
            // This prevents data loss if user refreshes before Firebase write propagates
            console.log('✅ Firebase synced successfully, pending snapshot kept for verification on next boot');
        } catch (err) {
            console.warn('⚠️ Firebase sync failed (snapshot queued for boot-time sync):', err);
            // Keep in pending queue for next boot
        }
    }
}

// Show/hide sync overlay
function showSyncOverlay(show, status = '') {
    const overlay = document.getElementById('syncOverlay');
    const statusEl = document.getElementById('syncStatus');
    
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
            if (statusEl && status) {
                statusEl.textContent = status;
            }
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Check and sync pending save snapshot from previous session
async function syncPendingSaveSnapshot() {
    if (!isLoggedIn || !playerId || typeof FirebaseService === 'undefined') {
        // Not logged in, clear pending snapshot
        localStorage.removeItem(PENDING_SAVE_KEY);
        return { hadPendingSave: false };
    }
    
    try {
        const pendingSaveData = localStorage.getItem(PENDING_SAVE_KEY);
        if (!pendingSaveData) {
            return { hadPendingSave: false };
        }
        
        const snapshot = JSON.parse(pendingSaveData);
        console.log('⚠️ Found unsaved snapshot from previous session, verifying integrity...');
        
        // Show sync overlay to block UI
        showSyncOverlay(true, 'Verifying saved data...');
        
        // CRITICAL: Verify signature to prevent tampering
        // IMPORTANT: Pending snapshot is ALWAYS more recent than Firebase data
        // We MUST load it locally, but only sync to Firebase if signature is valid
        
        let signatureValid = false;
        let shouldSyncToFirebase = false;
        
        // Check for signature
        if (!snapshot.security?.signature) {
            console.error('🚨 SECURITY BREACH: Pending snapshot has no signature!');
            console.error('This indicates tampering or SecurityService bypass attempt');
            
            if (typeof SecurityService !== 'undefined') {
                SecurityService.addFlag('missing_signature_pending_snapshot', { 
                    reason: 'Snapshot without signature detected - possible bypass attempt',
                    timestamp: Date.now(),
                    snapshotTimestamp: snapshot.timestamp
                });
            }
            
            showSyncOverlay(true, '⚠️ Unsigned data detected - loading locally only');
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            signatureValid = false;
            shouldSyncToFirebase = false;
        } else if (typeof SecurityService !== 'undefined') {
            // Verify the signature
            const verification = await SecurityService.verifyLoadedSave(snapshot);
            
            if (!verification.valid) {
                // Signature invalid - snapshot might be tampered with!
                console.error('🚨 SIGNATURE MISMATCH: Pending snapshot signature invalid!');
                console.error('Reason:', verification.reason);
                SecurityService.addFlag('invalid_signature_pending_snapshot', { 
                    reason: verification.reason,
                    timestamp: Date.now(),
                    snapshotTimestamp: snapshot.timestamp
                });
                
                showSyncOverlay(true, '⚠️ Data integrity issue - loading locally only');
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                signatureValid = false;
                shouldSyncToFirebase = false;
            } else {
                console.log('✅ Signature verified - snapshot is authentic');
                signatureValid = true;
                shouldSyncToFirebase = true;
            }
        } else {
            // SecurityService not available - CRITICAL SECURITY ISSUE
            console.error('🚨 SECURITY ERROR: SecurityService unavailable during verification!');
            showSyncOverlay(true, '⚠️ Security system unavailable - loading locally only');
            await new Promise(resolve => setTimeout(resolve, 1500));
            signatureValid = false;
            shouldSyncToFirebase = false;
        }
        
        // LOAD SNAPSHOT LOCALLY REGARDLESS OF SIGNATURE STATUS
        // This preserves the most recent state (prevents save-scumming via failed verification)
        console.log(`Loading pending snapshot locally (${signatureValid ? 'signed' : 'unsigned/invalid'})`);
        
        // If signature is invalid, we need to RE-SIGN and sync before allowing gameplay
        if (!shouldSyncToFirebase) {
            console.warn('⚠️ Snapshot has invalid/missing signature - will re-sign and sync');
            showSyncOverlay(true, 'Re-signing data...');
            
            // Re-sign the snapshot with a fresh signature
            if (typeof SecurityService !== 'undefined') {
                try {
                    // Strip security field and re-sign
                    const { security, ...dataToSign } = snapshot;
                    const freshSigned = await SecurityService.prepareSaveData(dataToSign);
                    
                    showSyncOverlay(true, 'Syncing re-signed data to cloud...');
                    
                    // Bypass rate limit for boot-time re-sync
                    SecurityService.resetSubmissionTimer();
                    
                    // Sync the RE-SIGNED snapshot to Firebase
                    await FirebaseService.saveUserData(playerId, playerName, freshSigned.payload);
                    
                    console.log('✅ Re-signed snapshot synced to Firebase successfully');
                    showSyncOverlay(true, 'Sync complete!');
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Clear old pending snapshot
                    localStorage.removeItem(PENDING_SAVE_KEY);
                    showSyncOverlay(false);
                    
                    // Return the re-signed data to load
                    return { 
                        hadPendingSave: true, 
                        success: true, 
                        snapshot: freshSigned.payload,
                        loadLocally: true,
                        resignedAndSynced: true
                    };
                } catch (error) {
                    console.error('❌ Failed to re-sign and sync:', error);
                    showSyncOverlay(true, '⚠️ Sync failed - data saved locally only');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    showSyncOverlay(false);
                    
                    // Still load locally, but flag that sync failed
                    return { 
                        hadPendingSave: true, 
                        success: false, 
                        snapshot: snapshot,
                        loadLocally: true,
                        signatureValid: false,
                        syncFailed: true
                    };
                }
            } else {
                console.error('🚨 Cannot re-sign: SecurityService unavailable');
                showSyncOverlay(false);
                return { 
                    hadPendingSave: true, 
                    success: false, 
                    snapshot: snapshot,
                    loadLocally: true,
                    signatureValid: false
                };
            }
        }
        
        showSyncOverlay(true, 'Syncing previous session...');
        
        // Force sync to Firebase (bypass rate limit for boot-time sync)
        if (typeof SecurityService !== 'undefined') {
            SecurityService.resetSubmissionTimer();
        }
        
        // Add small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showSyncOverlay(true, 'Uploading to cloud...');
        await FirebaseService.saveUserData(playerId, playerName, snapshot);
        
        // Success - clear pending snapshot
        localStorage.removeItem(PENDING_SAVE_KEY);
        console.log('✅ Pending snapshot synced to Firebase successfully');
        
        showSyncOverlay(true, 'Sync complete!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide overlay
        showSyncOverlay(false);
        
        // Return snapshot data so it can be loaded immediately (don't wait for Firebase propagation)
        return { 
            hadPendingSave: true, 
            success: true,
            loadLocally: true,
            snapshot: snapshot,
            syncedToFirebase: true
        };
    } catch (error) {
        console.error('❌ Failed to sync pending snapshot:', error);
        
        showSyncOverlay(true, 'Sync failed - proceeding with local data');
        await new Promise(resolve => setTimeout(resolve, 1500));
        showSyncOverlay(false);
        
        // Keep snapshot for next attempt, but also load it locally this time
        // to prevent losing the most recent data
        return { 
            hadPendingSave: true, 
            success: false, 
            error,
            loadLocally: true,
            snapshot: snapshot,
            syncFailed: true
        };
    }
}

// Load game state - Hybrid: Check Firebase first (cross-device), then localStorage
async function loadGameState() {
    let saveData = null;
    let source = 'none';
    
    // STEP 0: Sync pending save snapshot from previous session (CRITICAL!)
    // This prevents save-scumming by ensuring last state is synced before loading
    const pendingSync = await syncPendingSaveSnapshot();
    
    // If pending snapshot exists and was loaded (either synced or re-signed), use it
    if (pendingSync.hadPendingSave && pendingSync.loadLocally && pendingSync.snapshot) {
        if (pendingSync.resignedAndSynced) {
            console.log('✅ Loading re-signed pending snapshot (synced to Firebase)');
        } else if (pendingSync.syncFailed) {
            console.warn('⚠️ Loading pending snapshot locally (sync failed, will retry later)');
        } else {
            console.warn('⚠️ Loading pending snapshot locally (signature was invalid)');
        }
        
        saveData = pendingSync.snapshot;
        source = pendingSync.syncedToFirebase ? 'pendingSnapshot (synced)' : 'pendingSnapshot';
        
        // Clear the pending snapshot since we're loading it (unless sync failed and needs retry)
        if (pendingSync.syncedToFirebase || pendingSync.resignedAndSynced) {
            // Successfully synced to Firebase, can clear the pending snapshot
            localStorage.removeItem(PENDING_SAVE_KEY);
            console.log('✅ Pending snapshot cleared (successfully synced)');
        } else if (pendingSync.syncFailed) {
            // Sync failed, keep snapshot for next attempt
            console.warn('⚠️ Pending snapshot kept for retry (sync failed)');
        } else {
            // Loaded locally but not synced (signature issues, etc.)
            localStorage.removeItem(PENDING_SAVE_KEY);
        }
        
        // Skip Firebase load - use this more recent local state
    } else if (pendingSync.hadPendingSave && pendingSync.success && !pendingSync.loadLocally) {
        // This case should rarely happen now - snapshot was synced but data wasn't returned
        console.log('✅ Pending snapshot synced, will load from Firebase for consistency');
    } else if (pendingSync.hadPendingSave && !pendingSync.success && !pendingSync.loadLocally) {
        console.warn('⚠️ Could not process pending snapshot, continuing with normal load');
    }
    
    // STEP 1: If not already loaded from pending snapshot, check Firebase
    if (!saveData && isLoggedIn && playerId && typeof FirebaseService !== 'undefined') {
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
    
    // STEP 2: If no cloud data and not from pending snapshot, try localStorage
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
        console.log(`📦 Loading game state from: ${source}`);
        if (source === 'pendingSnapshot') {
            console.warn('⚠️ Loaded from pending snapshot - signature was invalid, not synced to cloud');
            console.warn('⚠️ Account flagged for security review');
        }
        // Restore banking state
        state.bankBalance = saveData.bankBalance !== undefined ? saveData.bankBalance : STARTING_BANK_BALANCE;
        state.totalEarnings = saveData.totalEarnings || 0;
        state.lifetimeSpendings = saveData.lifetimeSpendings || 0;
        state.tradingRounds = saveData.tradingRounds || 0;
        state.initialDeposit = saveData.initialDeposit || 0;
        state.lastExpenseDate = saveData.lastExpenseDate || null;
        state.ownedItems = saveData.ownedItems || [];
        state.customExpenseAmounts = saveData.customExpenseAmounts || {};
        state.activeLoan = saveData.activeLoan || null;
        state.spendingHistory = saveData.spendingHistory || [];
        state.earningsHistory = saveData.earningsHistory || [];
        
        // Restore trading state
        state.balance = saveData.balance !== undefined ? saveData.balance : 0;
        state.displayBalance = state.balance;
        state.stockHoldings = saveData.stockHoldings || {};
        state.streakCount = saveData.streakCount || 0;
        state.betIndex = saveData.betIndex || 0;
        state.purchasedUpgrades = saveData.purchasedUpgrades || [];
        state.cookieInventory = saveData.cookieInventory || [];
        // Restore undecoded prophecies (deals) - convert Set back from Array
        state.deals = deserializeDeals(saveData.deals || []);
        state.marginPosition = saveData.marginPosition || null;
        
        // Initialize predictions array (always empty on load - predictions are in-memory only)
        if (!state.predictions) {
            state.predictions = [];
        }

        if (typeof SecurityService !== 'undefined' && saveData?.security?.signature) {
            SecurityService.verifyLoadedSave(saveData).then(result => {
                if (!result.valid) {
                    console.warn('Loaded save failed signature verification:', result.reason);
                }
            });
        }
        
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
        localStorage.removeItem(PENDING_SAVE_KEY);
        console.log('Save data cleared (including pending snapshots)');
    } catch (e) {
        console.error('Failed to clear save data:', e);
    }
}

// Reset game to initial state (synchronous - clears local state and localStorage)
function resetGameState() {
    // Reset banking
    state.bankBalance = STARTING_BANK_BALANCE;
    state.totalEarnings = 0;
    state.lifetimeSpendings = 0;
    state.tradingRounds = 0;
    state.initialDeposit = 0;
    state.lastExpenseDate = null;
    state.ownedItems = [];
    state.customExpenseAmounts = {};
    state.activeLoan = null;
    state.spendingHistory = [];
    state.earningsHistory = [];
    
    // Reset trading
    state.balance = 0;
    state.displayBalance = 0;
    state.stockHoldings = {};
    state.streakCount = 0;
    state.betIndex = 0;
    state.purchasedUpgrades = [];
    state.bots = [];
    state.cookieInventory = [];
    state.deals = [];
    state.positions = [];
    state.marginPosition = null;
    state.cookie = null;
    
    clearSaveData();
}

// Reset game and delete all cloud data (async - use this for user-initiated reset)
async function resetGameStateComplete() {
    // Reset local state first
    resetGameState();
    
    // Delete from Firebase if logged in
    if (isLoggedIn && playerId && typeof FirebaseService !== 'undefined') {
        try {
            console.log('Deleting cloud data for user:', playerId);
            const result = await FirebaseService.deleteUserData(playerId, playerName);
            if (result.success) {
                console.log('✅ Cloud data deleted successfully');
            } else {
                console.warn('⚠️ Cloud data deletion failed:', result.error);
            }
        } catch (error) {
            console.error('Error deleting cloud data:', error);
        }
    }
}

// ===========================================
// BANKING FUNCTIONS
// ===========================================

// Deposit money from bank to trading account
function depositToTrading(amount) {
    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('depositToTrading', {
            amount,
            bankBalance: state.bankBalance
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_deposit', { amount, bankBalance: state.bankBalance });
            return { success: false, message: validation.reason };
        }
        SecurityService.logTransaction('depositToTrading', { amount, bankBalance: state.bankBalance });
    }

    if (amount <= 0) {
        return { success: false, message: 'Deposit amount must be greater than 0' };
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

    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('prestigeToBank', {
            amount: portfolioValue,
            portfolioValue
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_prestige', { portfolioValue });
            return { success: false, message: validation.reason };
        }
        SecurityService.logTransaction('prestigeToBank', { portfolioValue });
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
    const roundNumber = state.tradingRounds;
    
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
        initialDeposit: initialDeposit,
        roundNumber: roundNumber
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

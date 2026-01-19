// Configuration constants for Fortune Trader

// Bet amount tiers - unlocked through shop upgrades
const BET_AMOUNT_TIERS = {
    0: [50, 100, 150, 200],  // Default
    1: [150, 200, 250, 300, 350, 400],  // Tier 1
    2: [300, 350, 400, 450, 500, 550, 600, 650],  // Tier 2
    3: [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000]  // Tier 3
};

// Default bet amounts (for backwards compatibility)
const BET_AMOUNTS = BET_AMOUNT_TIERS[0];

// Starting amount of money for new players
const STARTING_MONEY = 500;

// ===========================================
// BANKING CONFIGURATION
// ===========================================
// Starting bank balance for new players
const STARTING_BANK_BALANCE = 1000;

// Minimum deposit amount
const MIN_DEPOSIT = 100;

// Cash out fee (percentage of portfolio value)
// e.g., 0.05 = 5% fee
const CASH_OUT_FEE_PERCENT = 0.05;

// Loan options (effective weekly rates)
const LOAN_OPTIONS = [
    {
        id: 'small',
        name: 'Small loan',
        amountMin: 1160,
        amountMax: 3480,
        termWeeksMin: 1,
        termWeeksMax: 3,
        rateMin: 0.07,
        rateMax: 0.11,
        description: 'Short-term cash boost'
    },
    {
        id: 'average',
        name: 'Average loan',
        amountMin: 11600,
        amountMax: 23200,
        termWeeksMin: 4,
        termWeeksMax: 6,
        rateMin: 0.06,
        rateMax: 0.1,
        description: 'Mid-term liquidity'
    },
    {
        id: 'big',
        name: 'Big loan',
        amountMin: 34800,
        amountMax: 87000,
        termWeeksMin: 6,
        termWeeksMax: 10,
        rateMin: 0.06,
        rateMax: 0.09,
        description: 'Large capital injection'
    }
];

// ===========================================
// DAILY EXPENSES CONFIGURATION
// ===========================================
// Expenses are deducted from bank balance once per real calendar day
// Calculated on login based on how many days passed while offline

const DAILY_EXPENSES = [
    {
        id: 'rent',
        name: 'Rent',
        icon: '🏠',
        description: 'Monthly apartment rent',
        amount: 30,
        enabled: true,
        canEliminate: true,
        eliminatedBy: 'estate'
    },
    {
        id: 'utilities',
        name: 'Utilities',
        icon: '💡',
        description: 'Electric, water, gas',
        amount: 3,
        enabled: true,
        canEliminate: false
    },
    {
        id: 'groceries',
        name: 'Groceries',
        icon: '🛒',
        description: 'Food and essentials',
        amount: 12,
        enabled: true,
        canEliminate: false
    },
    {
        id: 'transport',
        name: 'Transport',
        icon: '🚗',
        description: 'Gas, transit, parking',
        amount: 3,
        enabled: true,
        canEliminate: true,
        eliminatedBy: 'car'
    },
    {
        id: 'phone',
        name: 'Phone Bill',
        icon: '📱',
        description: 'Mobile service',
        amount: 1,
        enabled: true,
        canEliminate: false
    },
    {
        id: 'internet',
        name: 'Internet',
        icon: '📡',
        description: 'Home internet service',
        amount: 1,
        enabled: true,
        canEliminate: false
    },
    {
        id: 'insurance',
        name: 'Insurance',
        icon: '🛡️',
        description: 'Health & life insurance',
        amount: 10,
        enabled: true,
        canEliminate: false
    },
    {
        id: 'subscriptions',
        name: 'Subscriptions',
        icon: '📺',
        description: 'Streaming, apps, etc.',
        amount: 1,
        enabled: true,
        canEliminate: false
    }
];

// Calculate total daily expenses (considering owned items that eliminate expenses)
function getTotalDailyExpenses(ownedItems = [], customExpenseAmounts = {}) {
    return DAILY_EXPENSES
        .filter(expense => {
            if (!expense.enabled) return false;
            
            // Check if this expense is eliminated by an owned item
            if (expense.canEliminate && expense.eliminatedBy) {
                const hasEliminatingItem = ownedItems.some(item => 
                    item.category === expense.eliminatedBy
                );
                return !hasEliminatingItem;
            }
            
            return true;
        })
        .reduce((sum, expense) => {
            // Use custom amount if set, otherwise use default
            const amount = customExpenseAmounts[expense.id] !== undefined 
                ? customExpenseAmounts[expense.id] 
                : expense.amount;
            return sum + amount;
        }, 0);
}

// Get the amount for a specific expense (respects custom amounts)
function getExpenseAmount(expenseId, customExpenseAmounts = {}) {
    const expense = DAILY_EXPENSES.find(e => e.id === expenseId);
    if (!expense) return 0;
    
    return customExpenseAmounts[expenseId] !== undefined 
        ? customExpenseAmounts[expenseId] 
        : expense.amount;
}

// ===========================================
// SHOPPING CONFIGURATION
// ===========================================

const SHOP_ITEMS = [
    // HOME OWNERSHIP (eliminates rent expense)
    {
      id: 'micro_flat',
      name: 'City Micro-Apartment (Ownership)',
      category: 'estate',
      icon: '🏢',
      price: 220000,
      description: 'Small owned flat in an urban area. Eliminates rent expense.',
      prestigeRequired: 0
    },
    {
      id: 'new_build_flat',
      name: 'New-Build City Apartment',
      category: 'estate',
      icon: '🏙️',
      price: 650000,
      description: 'Modern new-build apartment in a prime district. Eliminates rent expense.',
      prestigeRequired: 6
    },
    {
      id: 'family_house',
      name: 'Detached Family House (Outskirts)',
      category: 'estate',
      icon: '🏡',
      price: 750000,
      description: 'Detached house with garden outside the city core. Eliminates rent expense.',
      prestigeRequired: 12
    },
    {
      id: 'villa_estate',
      name: 'Prestige Villa Estate',
      category: 'estate',
      icon: '🏰',
      price: 3000000,
      description: 'High-end villa with land and privacy. Eliminates rent expense.',
      prestigeRequired: 22
    },
  
    // VEHICLE OWNERSHIP (eliminates transport expense)
    {
      id: 'compact_used',
      name: 'Used Compact Car',
      category: 'car',
      icon: '🚗',
      price: 12000,
      description: 'Basic used car for everyday driving. Eliminates transport expense.',
      prestigeRequired: 0
    },
    {
      id: 'performance_car',
      name: 'Performance Coupe',
      category: 'car',
      icon: '🏎️',
      price: 70000,
      description: 'Quick, loud, and attention-grabbing. Eliminates transport expense.',
      prestigeRequired: 6
    },
    {
      id: 'executive_vehicle',
      name: 'Executive Luxury Vehicle',
      category: 'car',
      icon: '🚙',
      price: 110000,
      description: 'Premium comfort and status. Eliminates transport expense.',
      prestigeRequired: 12
    },
    {
      id: 'exotic_supercar',
      name: 'Exotic Supercar',
      category: 'car',
      icon: '🏁',
      price: 350000,
      description: 'Extreme performance and prestige. Eliminates transport expense.',
      prestigeRequired: 22
    },
  
    // LIFESTYLE / STATUS (no gameplay effect)
    {
      id: 'mechanical_watch',
      name: 'Mechanical Watch',
      category: 'luxury',
      icon: '⌚',
      price: 4000,
      description: 'High-end timepiece. Pure status symbol.',
      prestigeRequired: 0
    },
    {
      id: 'fine_jewelry',
      name: 'Fine Jewelry Set',
      category: 'luxury',
      icon: '💍',
      price: 12000,
      description: 'Precious metals and stones. Flashy but classic.',
      prestigeRequired: 4
    },
    {
      id: 'tailored_wardrobe',
      name: 'Tailored Wardrobe Upgrade',
      category: 'luxury',
      icon: '👔',
      price: 9000,
      description: 'Custom-fit clothing collection. Look like money.',
      prestigeRequired: 6
    },
    {
      id: 'original_art',
      name: 'Original Contemporary Artwork',
      category: 'luxury',
      icon: '🖼️',
      price: 25000,
      description: 'Original piece from a respected artist. Conversation starter.',
      prestigeRequired: 9
    },
    {
      id: 'motor_yacht',
      name: 'Motor Yacht (25m Class)',
      category: 'luxury',
      icon: '🛥️',
      price: 1500000,
      description: 'Private yacht for serious leisure and flex.',
      prestigeRequired: 16
    },
    {
      id: 'private_jet',
      name: 'Private Jet (Light-Class)',
      category: 'luxury',
      icon: '✈️',
      price: 4500000,
      description: 'Private air travel. Ultimate convenience and prestige.',
      prestigeRequired: 26
    }
  ];

// Stock purchase fee (fixed amount per transaction)
// This encourages buying stocks in bulk to save on fees
// Note: Short and Long bets are NOT affected by fees
const STOCK_PURCHASE_FEE = 25;

// ===========================================
// DETERMINISTIC SEEDED RANDOM NUMBER GENERATOR
// ===========================================
// This ensures stock prices are the same for everyone and can't be
// manipulated by refreshing the page. Prices are tied to real-world time.

// Tick interval in milliseconds (how often prices update)
const TICK_INTERVAL_MS = 2000;

// Epoch start for seed calculation (Jan 1, 2024 00:00:00 UTC)
const SEED_EPOCH = new Date('2024-01-01T00:00:00Z').getTime();

// Simulation epoch size - prices reset to base every EPOCH_SIZE ticks (~5.5 hours)
// This limits computation on page load while ensuring determinism within each epoch
const SIM_EPOCH_SIZE = 10000;

// Mulberry32 PRNG - fast, good distribution, 32-bit state
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Create a seed from stock symbol and tick number
function createSeed(symbol, tickNumber) {
    // Hash the symbol to a number
    let symbolHash = 0;
    for (let i = 0; i < symbol.length; i++) {
        const char = symbol.charCodeAt(i);
        symbolHash = ((symbolHash << 5) - symbolHash) + char;
        symbolHash = symbolHash & symbolHash; // Convert to 32-bit integer
    }
    // Combine symbol hash with tick number
    return Math.abs(symbolHash * 31 + tickNumber);
}

// Get the current tick number based on real-world time
function getCurrentTickNumber() {
    return Math.floor((Date.now() - SEED_EPOCH) / TICK_INTERVAL_MS);
}

// Get tick number for a specific timestamp
function getTickNumberForTime(timestamp) {
    return Math.floor((timestamp - SEED_EPOCH) / TICK_INTERVAL_MS);
}

// Get timestamp for a specific tick number
function getTimeForTickNumber(tickNumber) {
    return SEED_EPOCH + (tickNumber * TICK_INTERVAL_MS);
}

// Create a seeded RNG for a specific stock and tick
function createTickRNG(symbol, tickNumber) {
    const seed = createSeed(symbol, tickNumber);
    return mulberry32(seed);
}

// Seeded Gaussian random using Box-Muller transform
function seededGaussian(rng) {
    const u1 = rng();
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ===========================================
// TIME FRAME CONFIGURATION
// ===========================================
// Different chart time frames like real trading platforms
// Each frame shows ~100 data points at different granularities

// Time constants (in base ticks where 1 tick = 2 seconds)
const TICKS_PER_MINUTE = 30;
const TICKS_PER_HOUR = 1800;
const TICKS_PER_DAY = 43200;
const TICKS_PER_WEEK = 302400;
const TICKS_PER_MONTH = 1296000;  // 30 days
const TICKS_PER_YEAR = 15768000;  // 365 days

const TIME_FRAMES = {
    'LIVE': {
        label: 'Live',
        displayPoints: 100,           // Points to show on chart
        totalTicks: 100,              // Total duration in base ticks
        ticksPerPoint: 1,             // 1 tick per point (real-time)
        updateLive: true,             // Updates in real-time
        coarseSimulation: false,      // Use fine-grained simulation
        volatilityScale: 1.0,         // Base volatility
        description: 'Real-time (~3 min)'
    },
    '1H': {
        label: '1H',
        displayPoints: 100,
        totalTicks: TICKS_PER_HOUR,   // 1800 ticks
        ticksPerPoint: 18,            // ~36 seconds per point
        updateLive: true,
        coarseSimulation: false,
        volatilityScale: 1.0,
        description: '1 Hour'
    },
    '1D': {
        label: '1D',
        displayPoints: 100,
        totalTicks: TICKS_PER_DAY,    // 43200 ticks
        ticksPerPoint: 432,           // ~14.4 minutes per point
        updateLive: true,
        coarseSimulation: true,       // Use coarse simulation for performance
        volatilityScale: 1.5,         // Slightly higher vol for daily view
        description: '1 Day'
    },
    '1W': {
        label: '1W',
        displayPoints: 100,
        totalTicks: TICKS_PER_WEEK,   // 302400 ticks
        ticksPerPoint: 3024,          // ~1.68 hours per point
        updateLive: false,            // Too slow to update live
        coarseSimulation: true,
        volatilityScale: 2.5,         // Higher vol for weekly swings
        description: '1 Week'
    },
    '1M': {
        label: '1M',
        displayPoints: 100,
        totalTicks: TICKS_PER_MONTH,  // 1296000 ticks
        ticksPerPoint: 12960,         // ~7.2 hours per point
        updateLive: false,
        coarseSimulation: true,
        volatilityScale: 4.0,         // Monthly volatility
        description: '1 Month'
    },
    '1Y': {
        label: '1Y',
        displayPoints: 100,
        totalTicks: TICKS_PER_YEAR,   // 15768000 ticks
        ticksPerPoint: 157680,        // ~3.65 days per point
        updateLive: false,
        coarseSimulation: true,
        volatilityScale: 8.0,         // Yearly volatility (bigger swings)
        description: '1 Year'
    }
};

// Default time frame
const DEFAULT_TIME_FRAME = 'LIVE';

// Create a seeded RNG for coarse time frame simulation
// Uses a different seed space to avoid conflicts with live simulation
function createCoarseTickRNG(symbol, timeFrame, pointIndex) {
    const tfHash = timeFrame.charCodeAt(0) * 1000;
    const seed = createSeed(symbol + '_' + timeFrame, pointIndex + tfHash);
    return mulberry32(seed);
}

// Get the "anchor tick" for a time frame - the tick that represents "now" for that frame
function getAnchorTickForTimeFrame(timeFrame) {
    const tf = TIME_FRAMES[timeFrame];
    const currentTick = getCurrentTickNumber();
    // Align to time frame boundaries for consistency
    return Math.floor(currentTick / tf.ticksPerPoint) * tf.ticksPerPoint;
}

// ===========================================
// PROPHECY CONFIGURATION - Per-Type Settings
// ===========================================
// Each prophecy type has its own configurable properties
// Adjust these to tune gameplay balance

const PROPHECY_CONFIG = {
    // ---- TREND UP ----
    trendUp: {
        name: 'Trend Up Strength',
        description: 'Upward trend regime detected',
        icon: '📈',
        category: 'trend',
        // Duration (seconds)
        duration: { min: 45, max: 60 },
        // Trend strength (percentage per tick)
        strength: { min: 0.1, max: 0.8 }
    },
    
    // ---- TREND DOWN ----
    trendDown: {
        name: 'Trend Down Strength', 
        description: 'Downward trend regime detected',
        icon: '📉',
        category: 'trend',
        // Duration (seconds)
        duration: { min: 45, max: 60 },
        // Trend strength (percentage per tick)
        strength: { min: 0.1, max: 0.8 }
    },
    
    // ---- LOWER SHORE (Price Floor) ----
    lowerShore: {
        name: 'Lower Shore',
        description: 'Price floor guaranteed',
        icon: '🛡️',
        category: 'shore',
        // Duration (seconds)
        duration: { min: 45, max: 60 },
        // Distance from current price (percentage)
        distance: { min: 0.5, max: 3.0 },
        // Interval width (percentage)
        intervalWidth: { min: 0.3, max: 1.0 }
    },
    
    // ---- UPPER SHORE (Price Ceiling) ----
    upperShore: {
        name: 'Upper Shore',
        description: 'Price ceiling guaranteed',
        icon: '🔒',
        category: 'shore',
        // Duration (seconds)
        duration: { min: 45, max: 60 },
        // Distance from current price (percentage)
        distance: { min: 0.5, max: 3.0 },
        // Interval width (percentage)
        intervalWidth: { min: 0.3, max: 1.0 }
    },
    
    // ---- INEVITABLE ZONE ----
    inevitableZone: {
        name: 'Inevitable Zone',
        description: 'Price will touch this zone',
        icon: '🎯',
        category: 'zone',
        // Duration (seconds)
        duration: { min: 45, max: 60 },
        // Distance from current price (percentage)
        distance: { min: 0.3, max: 0.5 },
        // Interval width (percentage) - wider = easier to hit
        intervalWidth: { min: 0.4, max: 1.2 },
        // Magnetism pull strength multiplier (higher = stronger pull toward zone)
        magnetismStrength: 0.25
    },
    
    // ---- VOLATILITY SPIKE ----
    volatilitySpike: {
        name: 'Volatility Spike',
        description: 'High volatility incoming',
        icon: '⚡',
        category: 'volatility',
        // Duration (seconds) - 3x longer than other prophecies
        duration: { min: 45, max: 90 },
        // Volatility multiplier range
        volatilityMultiplier: { min: 2.0, max: 4.0 },
        // Time window when effect starts (seconds from prophecy start)
        windowStart: { min: 5, max: 15 },
        // Duration of the volatility effect window (seconds)
        windowDuration: { min: 15, max: 45 }
    },
    
    // ---- VOLATILITY CALM ----
    volatilityCalm: {
        name: 'Volatility Calm',
        description: 'Low volatility period',
        icon: '🌊',
        category: 'volatility',
        // Duration (seconds) - 3x longer than other prophecies
        duration: { min: 45, max: 90 },
        // Volatility multiplier range (lower = calmer)
        volatilityMultiplier: { min: 0.2, max: 0.5 },
        // Time window when effect starts (seconds from prophecy start)
        windowStart: { min: 5, max: 15 },
        // Duration of the volatility effect window (seconds)
        windowDuration: { min: 15, max: 45 }
    }
};

// All prophecy type keys for random selection
const PROPHECY_TYPE_KEYS = Object.keys(PROPHECY_CONFIG);

// Pool of classic-style fortune cookie texts for the typing mini-game
const FORTUNE_TEXTS = [
    "A FRESH START WILL PUT YOU ON YOUR WAY",
    "A FRIEND IS NEAR",
    "A GOOD TIME TO FINISH OLD TASKS",
    "A PLEASANT SURPRISE IS WAITING",
    "ALL YOUR HARD WORK WILL SOON PAY OFF",
    "AN EXCITING OPPORTUNITY LIES AHEAD",
    "BE PATIENT GOOD THINGS TAKE TIME",
    "BELIEVE IN YOURSELF",
    "CHANGE CAN HAPPEN IN AN INSTANT",
    "COURAGE WILL LEAD YOU FORWARD",
    "DO NOT FEAR WHAT YOU DO NOT KNOW",
    "EVERY DAY IS A NEW BEGINNING",
    "FOLLOW YOUR HEART",
    "GOOD NEWS WILL COME TO YOU",
    "HAPPINESS IS A CHOICE",
    "HELPING OTHERS WILL BRING YOU JOY",
    "KEEP IT SIMPLE",
    "NEW IDEAS WILL BRING SUCCESS",
    "NOW IS THE TIME TO TRY",
    "PRACTICE MAKES PERFECT",
    "SMALL STEPS BRING BIG RESULTS",
    "SOMEONE IS THINKING OF YOU",
    "SUCCESS BEGINS WITH A SINGLE STEP",
    "THE BEST IS YET TO COME",
    "YOUR KINDNESS WILL RETURN TO YOU"
  ];

// ===========================================
// SHOP UPGRADES CONFIGURATION
// ===========================================
// All shop upgrades with their properties and effects
//
// Properties:
// - name: Display name
// - description: What the upgrade does
// - icon: Emoji icon
// - price: Cost in dollars (upgrades are sorted by price, cheapest first)
// - order: Legacy property (not used for sorting anymore)
// - visible: true/false - whether to show in shop
// - locked: true/false - visual style (locked appearance)
// - effects: Object containing upgrade effects (for implementation)
//
// To hide an upgrade: set visible: false
// Upgrades automatically sort by price (cheapest to most expensive)

const SHOP_UPGRADES = {
    trendStrength: {
        name: 'Trend Up Strength',
        description: 'Increases trend prophecy accuracy',
        icon: '📈',
        price: 500,
        order: 1,           // Display order (lower = shown first)
        visible: false,      // Whether to show in shop
        locked: false,      // Visual style (locked appearance)
        effects: {
            // Placeholder for future implementation
            trendAccuracyBonus: 0.1
        }
    },
    cookieDiscount: {
        name: 'Cookie Discount I',
        description: '10% off fortune cookies',
        icon: '🏷️',
        price: 400,
        order: 2,
        visible: true,
        locked: false,
        effects: {
            cookiePriceMultiplier: 0.9  // 10% discount
        }
    },
    cookieDiscount2: {
        name: 'Cookie Discount II',
        description: '20% off fortune cookies',
        icon: '🎫',
        price: 1200,
        order: 3,
        visible: true,
        locked: false,
        effects: {
            cookiePriceMultiplier: 0.8  // 20% discount
        }
    },
    cookieDiscount3: {
        name: 'Cookie Discount III',
        description: '30% off fortune cookies',
        icon: '💳',
        price: 3000,
        order: 4,
        visible: true,
        locked: false,
        effects: {
            cookiePriceMultiplier: 0.7  // 30% discount
        }
    },
    longerProphecy: {
        name: 'Extended Vision',
        description: 'Prophecies last longer',
        icon: '⏱️',
        price: 1000,
        order: 5,
        visible: false,
        locked: false,
        effects: {
            // Placeholder for future implementation
            prophecyDurationBonus: 1.2  // 20% longer
        }
    },
    betMultiplier: {
        name: 'Bet Multiplier',
        description: 'Higher max bet amounts',
        icon: '💰',
        price: 1500,
        order: 6,
        visible: false,
        locked: false,
        effects: {
            // Placeholder for future implementation
            maxBetMultiplier: 1.5
        }
    },
    luckyCharm: {
        name: 'Lucky Charm',
        description: 'Slightly better prophecy outcomes',
        icon: '🍀',
        price: 2000,
        order: 7,
        visible: false,
        locked: false,
        effects: {
            // Placeholder for future implementation
            luckBonus: 0.05
        }
    },
    autoReveal: {
        name: 'Auto Reveal I',
        description: '1 letter per tick',
        icon: '🔮',
        price: 1200,
        order: 8,
        visible: true,
        locked: false,
        effects: {
            autoRevealEnabled: true,
            autoRevealSpeed: 1  // 1 character per tick
        }
    },
    autoReveal2: {
        name: 'Auto Reveal II',
        description: '2 letters per tick',
        icon: '🔓',
        price: 3000,
        order: 9,
        visible: true,
        locked: false,
        effects: {
            autoRevealEnabled: true,
            autoRevealSpeed: 2  // 2 characters per tick
        }
    },
    autoReveal3: {
        name: 'Auto Reveal III',
        description: '4 letters per tick',
        icon: '🔥',
        price: 8000,
        order: 10,
        visible: true,
        locked: false,
        effects: {
            autoRevealEnabled: true,
            autoRevealSpeed: 4  
        }
    },
    betCombo1: {
        name: 'Bet Combo I',
        description: 'Unlock higher bet amounts',
        icon: '💵',
        price: 2000,
        order: 11,
        visible: true,
        locked: false,
        effects: {
            betTier: 1  // Unlocks tier 1 bets
        }
    },
    betCombo2: {
        name: 'Bet Combo II',
        description: 'Even higher bet amounts',
        icon: '💸',
        price: 6000,
        order: 12,
        visible: true,
        locked: false,
        effects: {
            betTier: 2  // Unlocks tier 2 bets
        }
    },
    betCombo3: {
        name: 'Bet Combo III',
        description: 'Maximum bet amounts',
        icon: '💰',
        price: 15000,
        order: 13,
        visible: true,
        locked: false,
        effects: {
            betTier: 3  // Unlocks tier 3 bets
        }
    },
    goldenCookie: {
        name: 'Golden Cookie',
        description: 'More precise prophecies',
        icon: '🍪',
        price: 1000,
        order: 14,
        visible: true,
        locked: false,  // Special upgrade
        effects: {
            // Unlocks tier 2 cookies (handled by getCurrentCookieTier)
            unlocksT2Cookies: true
        }
    },
    diamondCookie: {
        name: 'Diamond Cookie',
        description: 'Highly precise prophecies',
        icon: '💎',
        price: 5000,
        order: 15,
        visible: true,
        locked: false,
        effects: {
            // Unlocks tier 3 cookies (handled by getCurrentCookieTier)
            unlocksT3Cookies: true
        }
    },
    fortuneMultiplier: {
        name: 'Fortune Multiplier',
        description: 'Double prophecy effects',
        icon: '✨',
        price: 10000,
        order: 16,
        visible: false,
        locked: true,  // Special upgrade
        effects: {
            // Placeholder for future implementation
            prophecyEffectMultiplier: 2.0
        }
    }
};

// Get upgrade config by ID
function getUpgradeConfig(upgradeId) {
    return SHOP_UPGRADES[upgradeId] || null;
}

// Get all visible upgrade IDs sorted by price (cheapest to most expensive)
function getVisibleUpgradeIds() {
    return Object.entries(SHOP_UPGRADES)
        .filter(([id, upgrade]) => upgrade.visible !== false)
        .sort((a, b) => (a[1].price || 0) - (b[1].price || 0))
        .map(([id, upgrade]) => id);
}

// Get all upgrade IDs (regardless of visibility)
function getAllUpgradeIds() {
    return Object.keys(SHOP_UPGRADES);
}

// ===========================================
// FORTUNE COOKIE TIERS
// ===========================================
// Each tier has different prices and prophecy quality modifiers
// Higher tiers produce more accurate/useful prophecies

const FORTUNE_COOKIE_TIERS = {
    1: {
        name: 'Fortune Cookie',
        description: 'Basic prophecy',
        icon: '🥠',
        price: 100,
        // Prophecy quality modifiers (1.0 = base values from PROPHECY_CONFIG)
        modifiers: {
            durationMultiplier: 1.0,      // Prophecy duration multiplier
            intervalTightness: 1.0,       // Lower = tighter intervals (more precise)
            strengthBonus: 0,             // Added to strength values (percentage points)
        }
    },
    2: {
        name: 'Golden Cookie',
        description: 'Enhanced prophecy',
        icon: '🍪',
        price: 350,
        // Better quality prophecies
        modifiers: {
            durationMultiplier: 1.3,      // 30% longer prophecies
            intervalTightness: 0.7,       // 30% tighter intervals (more precise)
            strengthBonus: 0.15,          // +0.15% stronger trend effects
        }
    },
    3: {
        name: 'Diamond Cookie',
        description: 'Premium prophecy',
        icon: '💎',
        price: 800,
        // Premium quality prophecies
        modifiers: {
            durationMultiplier: 1.6,      // 60% longer prophecies
            intervalTightness: 0.5,       // 50% tighter intervals (very precise)
            strengthBonus: 0.3,           // +0.3% stronger trend effects
        }
    }
};

// Get cookie tier config by tier number
function getCookieTierConfig(tier) {
    return FORTUNE_COOKIE_TIERS[tier] || FORTUNE_COOKIE_TIERS[1];
}

// Get the current cookie discount multiplier based on purchased upgrades
function getCookieDiscountMultiplier() {
    if (!state.purchasedUpgrades) return 1.0;
    
    // Check from highest to lowest discount tier
    if (state.purchasedUpgrades.includes('cookieDiscount3')) {
        return 0.7;  // 30% discount
    }
    if (state.purchasedUpgrades.includes('cookieDiscount2')) {
        return 0.8;  // 20% discount
    }
    if (state.purchasedUpgrades.includes('cookieDiscount')) {
        return 0.9;  // 10% discount
    }
    return 1.0;  // No discount
}

// Get the effective cookie price for a tier (with discount applied)
function getEffectiveCookiePrice(tier) {
    const tierConfig = getCookieTierConfig(tier);
    const discount = getCookieDiscountMultiplier();
    return Math.floor(tierConfig.price * discount);
}

// Get the current auto reveal speed based on purchased upgrades
function getAutoRevealSpeed() {
    if (!state.purchasedUpgrades) return 0;
    
    // Check from highest to lowest tier (fastest to slowest)
    if (state.purchasedUpgrades.includes('autoReveal3')) {
        return 999;  // Instant
    }
    if (state.purchasedUpgrades.includes('autoReveal2')) {
        return 2;  // 2 characters per tick
    }
    if (state.purchasedUpgrades.includes('autoReveal')) {
        return 1;  // 1 character per tick
    }
    return 0;  // No auto reveal
}

// Check if any auto reveal upgrade is purchased
function hasAutoReveal() {
    if (!state.purchasedUpgrades) return false;
    return state.purchasedUpgrades.includes('autoReveal') || 
           state.purchasedUpgrades.includes('autoReveal2') || 
           state.purchasedUpgrades.includes('autoReveal3');
}

// Get the current bet tier based on purchased upgrades
function getCurrentBetTier() {
    if (!state.purchasedUpgrades) return 0;
    
    // Check from highest to lowest tier
    if (state.purchasedUpgrades.includes('betCombo3')) {
        return 3;
    }
    if (state.purchasedUpgrades.includes('betCombo2')) {
        return 2;
    }
    if (state.purchasedUpgrades.includes('betCombo1')) {
        return 1;
    }
    return 0;  // Default tier
}

// Get the current bet amounts array based on purchased upgrades
function getCurrentBetAmounts() {
    const tier = getCurrentBetTier();
    return BET_AMOUNT_TIERS[tier] || BET_AMOUNT_TIERS[0];
}

// Legacy compatibility - individual config references
// These are derived from PROPHECY_CONFIG for backwards compatibility
const PROPHECY_TYPES = PROPHECY_CONFIG;
const COOKIE_PRICE = FORTUNE_COOKIE_TIERS[1].price; // Legacy: use tier 1 price

// Helper function to get prophecy duration
function getProphecyDuration(type) {
    const config = PROPHECY_CONFIG[type];
    if (config && config.duration) {
        return config.duration;
    }
    return { min: 15, max: 30 }; // Default fallback
}

// Legacy constants (deprecated - use PROPHECY_CONFIG instead)
const PROPHECY_DURATION = { min: 15, max: 30 };
const TREND_STRENGTH = { min: 0.1, max: 0.8 };
const SHORE_DISTANCE = { min: 0.5, max: 3.0 };
const SHORE_INTERVAL_WIDTH = { min: 0.3, max: 1.0 };
const ZONE_DISTANCE = { min: 0.2, max: 0.8 };
const ZONE_INTERVAL_WIDTH = { min: 0.4, max: 1.2 };
const VOLATILITY_SPIKE = { min: 2.0, max: 4.0 };
const VOLATILITY_CALM = { min: 0.2, max: 0.5 };
const VOLATILITY_WINDOW_START = { min: 5, max: 15 };
const VOLATILITY_WINDOW_DURATION = { min: 15, max: 45 };

// ===========================================
// SIMULATION BEHAVIOR CONFIGS
// ===========================================
// These configs control the price simulation weights
// Each weight ranges from 0 (disabled) to 1+ (full/amplified effect)

// CACHE mode: Full simulation when market is closed
const simConfigCache = {
    // Base volatility (percentage of price per tick)
    baseVolatility: 0.005,          // 0.5% base volatility
    
    // Volatility clustering weights
    volatilityClusteringEnabled: true,
    volatilityChangeChance: 0.08,   // 8% chance to change regime
    volatilityHighEventChance: 0.25, // 25% chance of high vol event
    volatilityHighMin: 2.5,         // High vol multiplier min
    volatilityHighMax: 4.5,         // High vol multiplier max
    volatilityNormalMin: 0.8,       // Normal vol multiplier min
    volatilityNormalMax: 2.0,       // Normal vol multiplier max
    volatilitySmoothing: 0.1,       // How fast vol transitions (0-1)
    
    // Trend weights
    trendWeight: 0.6,               // How much trend affects price
    trendStrengthChance: 0.2,       // Chance of strong trend
    trendStrengthMultiplier: 1.5,   // Strong trend multiplier
    trendDurationMin: 5,            // Min ticks per trend
    trendDurationMax: 20,           // Max ticks per trend
    
    // Support/Resistance weights
    srWeight: 1.0,                  // S/R bounce strength
    srThreshold: 0.005,             // 0.5% from S/R to trigger
    srDecay: 0.005,                 // How fast S/R levels decay toward price
    
    // Round number magnetism
    roundMagnetismWeight: 0.02,     // Pull toward round numbers
    
    // Consolidation/Breakout
    consolidationChance: 0.02,      // Chance to enter consolidation
    consolidationRange: 0.003,      // 0.3% range during consolidation
    breakoutMinTicks: 4,            // Min ticks before breakout possible
    breakoutChancePerTick: 0.015,   // Breakout chance increase per tick
    breakoutDurationMin: 8,         // Min breakout duration
    breakoutDurationMax: 18,        // Max breakout duration
    breakoutStrength: 0.006,        // Breakout move strength (% per tick)
    breakoutVolatilitySpike: 3.5,   // Volatility during breakout
    
    // Mean reversion
    meanReversionWeight: 0.001,     // Pull back to base price
    
    // Fat tails (rare big moves)
    fatTailChance: 0.02,            // 2% chance of big move
    fatTailStrength: 0.015,         // 1.5% move size
    
    // Prophecy effect multiplier
    prophecyWeight: 0.002,          // How much prophecies affect price
    
    // Noise distribution
    useGaussianNoise: true,         // Use gaussian vs uniform noise
    noiseWeight: 0.5                // Noise multiplier
};

// ===========================================
// STOCK DATA CONFIGURATION
// ===========================================
// name: display name shown in UI
// tag: company tag/description
// basePrice: starting price for simulation
const stockConfig = {
    'APLS': { name: 'APLS', tag: 'Apples Corp.', basePrice: 180 },
    'LOOGL': { name: 'LOOGL', tag: 'Loogle Inc.', basePrice: 140 },
    'MASFT': { name: 'MASFT', tag: 'Macrosoft Corp.', basePrice: 380 },
    'OZN': { name: 'OZN', tag: 'Ozon Inc.', basePrice: 175 },
    'NWTN': { name: 'NWTN', tag: 'Newton Inc.', basePrice: 250 }
};

// News System - Tied to actual chart trends

// News templates for different types
const NEWS_TEMPLATES = {
    trendUp: [
        "{stock} shows strong upward momentum as investors show confidence",
        "Analysts detect bullish signals in {stock} trading patterns",
        "{stock} gains traction with positive market sentiment",
        "Breaking: {stock} experiencing significant price appreciation",
        "Investors flock to {stock} amid positive market outlook"
    ],
    trendDown: [
        "{stock} faces selling pressure as market sentiment shifts",
        "Analysts note bearish indicators in {stock} performance",
        "{stock} declines amid market uncertainty",
        "Breaking: {stock} experiencing downward price movement",
        "Investors show caution as {stock} trends lower"
    ],
    volatility: [
        "High volatility detected in {stock} trading session",
        "{stock} experiences increased market volatility",
        "Market uncertainty drives {stock} price fluctuations",
        "Traders brace for volatility as {stock} shows erratic movement",
        "{stock} sees heightened trading activity and price swings"
    ],
    general: [
        "Market analysts release new report on {stock}",
        "{stock} trading volume increases significantly",
        "Breaking: Major development affects {stock} market position",
        "{stock} shows interesting price action today",
        "Market watchers keep close eye on {stock} performance"
    ]
};

// Initialize news articles in state if not exists
// Note: newsArticles is not saved/loaded - it's generated for display only
if (typeof state !== 'undefined' && !state.newsArticles) {
    state.newsArticles = [];
}

// Track previous trend states to detect changes
const newsTrendTracker = {};

// Initialize trend tracker for a symbol
function initTrendTracker(symbol) {
    if (!newsTrendTracker[symbol]) {
        newsTrendTracker[symbol] = {
            lastTrend: 0,
            lastTrendDuration: 0,
            lastVolatility: 1,
            lastPriceCheck: null,
            newsCooldown: {} // Track when we last fired news for each type
        };
    }
}

// Generate news article based on detected event
function generateNewsForEvent(symbol, newsType, reason = '') {
    const stockName = stockConfig[symbol].name;
    
    // Get random template for this news type
    const templates = NEWS_TEMPLATES[newsType];
    if (!templates || templates.length === 0) return null;
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    const headline = template.replace('{stock}', stockName);
    
    // Determine if this article should be visible based on current visibility level
    const visibilityLevel = getNewsVisibilityLevel();
    const isVisible = Math.random() < visibilityLevel;
    
    // Create news article
    const news = {
        id: Date.now(),
        timestamp: Date.now(),
        symbol: symbol,
        stockName: stockName,
        headline: headline,
        type: newsType,
        visible: isVisible  // Each article has a chance to be visible, stays that way
    };
    
    // Add to news array (keep last 50)
    state.newsArticles.push(news);
    if (state.newsArticles.length > 50) {
        state.newsArticles.shift();
    }
    
    // Render news
    renderNews();
    
    return news;
}

// Check for news events based on chart state
function checkForNewsEvents(symbol) {
    if (!state.chartSimState[symbol]) return;
    
    initTrendTracker(symbol);
    const tracker = newsTrendTracker[symbol];
    const simState = state.chartSimState[symbol];
    const now = Date.now();
    const COOLDOWN_MS = 30000; // 30 seconds cooldown per news type per symbol
    
    // Check if enough time has passed since last news of each type
    const canFireNews = (type) => {
        const lastFired = tracker.newsCooldown[type] || 0;
        return (now - lastFired) >= COOLDOWN_MS;
    };
    
    const markNewsFired = (type) => {
        tracker.newsCooldown[type] = now;
    };
    
    // 1. Check for NEW TREND START
    // A new trend starts when trendDuration resets from 0 to a new value (5-19)
    // After reset, trendDuration decrements each tick, so we detect when it jumps from 0-1 to 4-18
    const currentTrendDuration = simState.trendDuration || 0;
    const currentTrend = simState.trend || 0;
    
    // Detect when a new trend just started
    // New trend: trendDuration was 0-1 (trend ended) and now is 4-18 (new trend just started)
    // OR trend value changed significantly while duration is still high
    const trendJustStarted = (tracker.lastTrendDuration <= 1 && currentTrendDuration >= 4 && currentTrendDuration <= 18);
    const trendChanged = (Math.abs(currentTrend - tracker.lastTrend) > 0.4 && currentTrendDuration >= 10);
    
    if ((trendJustStarted || trendChanged) && canFireNews('trend')) {
        if (currentTrend > 0.3) {
            // Strong upward trend
            generateNewsForEvent(symbol, 'trendUp', 'new trend start');
            markNewsFired('trend');
        } else if (currentTrend < -0.3) {
            // Strong downward trend
            generateNewsForEvent(symbol, 'trendDown', 'new trend start');
            markNewsFired('trend');
        }
    }
    
    // 2. Check for STRONG TREND (when trend crosses into strong territory)
    if (Math.abs(currentTrend) > 0.5 && canFireNews('strongTrend')) {
        if (currentTrend > 0.5 && tracker.lastTrend <= 0.5) {
            // Just crossed into strong upward trend
            generateNewsForEvent(symbol, 'trendUp', 'strong trend');
            markNewsFired('strongTrend');
        } else if (currentTrend < -0.5 && tracker.lastTrend >= -0.5) {
            // Just crossed into strong downward trend
            generateNewsForEvent(symbol, 'trendDown', 'strong trend');
            markNewsFired('strongTrend');
        }
    }
    
    // 3. Check for VOLATILITY SPIKE
    const currentVolatility = simState.volatility || 1;
    if (currentVolatility > 1.5 && tracker.lastVolatility <= 1.5 && canFireNews('volatility')) {
        generateNewsForEvent(symbol, 'volatility', 'volatility spike');
        markNewsFired('volatility');
    }
    
    // 4. Check for SIGNIFICANT PRICE MOVEMENT (analyze recent history)
    const history = state.chartHistory[symbol];
    if (history && history.length >= 10) {
        const recentPrices = history.slice(-10);
        const oldestPrice = recentPrices[0].value;
        const newestPrice = recentPrices[recentPrices.length - 1].value;
        const priceChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
        
        // If price moved more than 2% in last 10 ticks
        if (Math.abs(priceChange) > 2 && canFireNews('priceMove')) {
            if (priceChange > 2) {
                generateNewsForEvent(symbol, 'trendUp', 'significant price rise');
                markNewsFired('priceMove');
            } else if (priceChange < -2) {
                generateNewsForEvent(symbol, 'trendDown', 'significant price fall');
                markNewsFired('priceMove');
            }
        }
    }
    
    // Update tracker
    tracker.lastTrend = currentTrend;
    tracker.lastTrendDuration = currentTrendDuration;
    tracker.lastVolatility = currentVolatility;
}

// Get current news visibility level (0.0 to 1.0)
function getNewsVisibilityLevel() {
    if (!state.purchasedUpgrades) return 0.1; // Default: 10% visible (90% blurred)
    
    // Check for highest tier upgrade
    if (state.purchasedUpgrades.includes('newsAccess3')) {
        return 1.0; // 100% visible
    }
    if (state.purchasedUpgrades.includes('newsAccess2')) {
        return 0.5; // 50% visible
    }
    if (state.purchasedUpgrades.includes('newsAccess1')) {
        return 0.25; // 25% visible
    }
    
    return 0.1; // Default: 10% visible (90% blurred)
}

// Render news list
function renderNews() {
    const container = document.getElementById('newsList');
    const countEl = document.getElementById('newsCount');
    
    if (!container) return;
    
    const news = state.newsArticles || [];
    const count = news.length;
    const visibilityLevel = getNewsVisibilityLevel();
    
    if (countEl) {
        countEl.textContent = typeof t === 'function' ? t('news.articlesCount', { count: count }) : count + ' article' + (count !== 1 ? 's' : '');
    }
    
    if (count === 0) {
        container.innerHTML = '<div class="news-empty">' + (typeof t === 'function' ? t('news.empty') : 'No news yet. Market updates will appear here.') + '</div>';
        return;
    }
    
    // Check if there are blurred articles (need subscription)
    const hasBlurredArticles = news.some(article => !article.visible);
    const hasAllUpgrades = state.purchasedUpgrades && 
        state.purchasedUpgrades.includes('newsAccess3');
    
    // Show most recent first
    const sortedNews = [...news].reverse();
    
    // Build subscription hint HTML if needed (at top)
    let hintHtml = '';
    if (hasBlurredArticles && !hasAllUpgrades) {
        hintHtml = `
            <div class="news-subscription-hint">
                <div class="news-hint-icon">🔒</div>
                <div class="news-hint-content">
                    <div class="news-hint-title">Unlock More Insights</div>
                    <div class="news-hint-text">Purchase News Access upgrades in Cookie Shop to reveal more market insights</div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = hintHtml + sortedNews.map((article) => {
        const date = new Date(article.timestamp);
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const typeIcon = {
            'trendUp': '📈',
            'trendDown': '📉',
            'volatility': '⚡',
            'general': '📰'
        }[article.type] || '📰';
        
        // Use the article's visibility property (set when created)
        // If article doesn't have visible property (legacy), default to blurred
        const isVisible = article.visible === true;
        const blurClass = isVisible ? '' : 'news-blurred';
        
        return `
            <div class="news-item ${blurClass}" data-type="${article.type}">
                <div class="news-item-icon">${typeIcon}</div>
                <div class="news-item-content">
                    <div class="news-item-header">
                        <div class="news-item-headline">${article.headline}</div>
                    </div>
                    <div class="news-item-time">${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Switch between Cookie Shop, News, and Bots tabs
function switchRightPanelTab(tab) {
    const cookieTab = document.querySelector('.panel-tab[data-tab="cookie"]');
    const newsTab = document.querySelector('.panel-tab[data-tab="news"]');
    const botsTab = document.querySelector('.panel-tab[data-tab="bots"]');
    const cookieContent = document.getElementById('cookieShopContent');
    const newsContent = document.getElementById('newsContent');
    const botsContent = document.getElementById('botsContent');
    
    // Check unlock status
    const newsUnlocked = typeof isNewsTabUnlocked === 'function' ? isNewsTabUnlocked() : false;
    const consoleUnlocked = typeof isConsoleTabUnlocked === 'function' ? isConsoleTabUnlocked() : false;
    
    // Check if trying to access locked tabs
    if (tab === 'news' && !newsUnlocked) {
        showNotification(typeof t === 'function' ? t('news.tabUnlockRequired') : 'Purchase "News Tab Unlock" upgrade to access news', 'error');
        AudioManager.playError();
        return;
    }
    
    if (tab === 'bots' && !consoleUnlocked) {
        showNotification(typeof t === 'function' ? t('news.consoleUnlockRequired') : 'Purchase "Console Tab Unlock" upgrade to access console', 'error');
        AudioManager.playError();
        return;
    }
    
    // Remove active class from all tabs
    cookieTab.classList.remove('active');
    newsTab.classList.remove('active');
    botsTab.classList.remove('active');
    
    // Hide all content
    cookieContent.classList.add('hidden');
    newsContent.classList.add('hidden');
    botsContent.classList.add('hidden');
    
    if (tab === 'cookie') {
        cookieTab.classList.add('active');
        cookieContent.classList.remove('hidden');
    } else if (tab === 'news') {
        newsTab.classList.add('active');
        newsContent.classList.remove('hidden');
        
        // Render news when switching to news tab
        renderNews();
    } else if (tab === 'bots') {
        botsTab.classList.add('active');
        botsContent.classList.remove('hidden');
        
        // Initialize bots panel when switching to bots tab
        if (typeof initBotsPanel === 'function') {
            initBotsPanel();
        }
        
        // Focus console input
        setTimeout(() => {
            const consoleInput = document.getElementById('consoleInput');
            if (consoleInput) {
                consoleInput.focus();
            }
        }, 100);
    } else {
        // Stop console updates when switching away from bots tab
        if (typeof stopConsoleBotUpdates === 'function') {
            stopConsoleBotUpdates();
        }
        if (typeof stopBotReasoningUpdates === 'function') {
            stopBotReasoningUpdates();
        }
    }
}

// Update tab lock states (call this after upgrade purchase or on game load)
function updateTabLockStates() {
    const newsTab = document.querySelector('.panel-tab[data-tab="news"]');
    const botsTab = document.querySelector('.panel-tab[data-tab="bots"]');
    
    const newsUnlocked = typeof isNewsTabUnlocked === 'function' ? isNewsTabUnlocked() : false;
    const consoleUnlocked = typeof isConsoleTabUnlocked === 'function' ? isConsoleTabUnlocked() : false;
    
    if (newsTab) {
        if (newsUnlocked) {
            newsTab.classList.remove('locked');
            newsTab.classList.remove('hidden');
            newsTab.title = '';
        } else {
            newsTab.classList.add('locked');
            newsTab.classList.add('hidden');
            newsTab.title = 'Purchase "News Tab Unlock" upgrade to unlock';
        }
    }
    
    if (botsTab) {
        if (consoleUnlocked) {
            botsTab.classList.remove('locked');
            botsTab.classList.remove('hidden');
            botsTab.title = '';
        } else {
            botsTab.classList.add('locked');
            botsTab.classList.add('hidden');
            botsTab.title = 'Purchase "Console Tab Unlock" upgrade to unlock';
        }
    }
}

// Initialize news system - checks for events during chart updates
function initNewsSystem() {
    // Initialize trackers for all symbols
    Object.keys(stockConfig).forEach(symbol => {
        initTrendTracker(symbol);
    });
    
    // News events are checked in updateAllCharts() hook
    console.log('News system initialized - will fire based on actual chart trends');
}

// Clean up news system when needed
function stopNewsSystem() {
    // Clear trackers
    Object.keys(newsTrendTracker).forEach(symbol => {
        delete newsTrendTracker[symbol];
    });
}

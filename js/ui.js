// UI updates, notifications, and display functions

// Shop state
let shopOpen = false;

// Toggle shop panel - switches between shop and cookie stash/reveal
function toggleShop() {
    shopOpen = !shopOpen;
    const shopPanel = document.getElementById('shopPanel');
    const cookieContent = document.getElementById('cookieContent');
    const shopBtn = document.getElementById('shopToggleBtn');
    
    if (shopPanel) {
        shopPanel.classList.toggle('open', shopOpen);
    }
    if (cookieContent) {
        cookieContent.classList.toggle('hidden', shopOpen);
    }
    if (shopBtn) {
        shopBtn.classList.toggle('active', shopOpen);
    }
}

// Purchase upgrade
function purchaseUpgrade(upgradeId) {
    // Get upgrade config from config.js
    const upgrade = getUpgradeConfig(upgradeId);
    if (!upgrade) {
        showNotification('Unknown upgrade', 'error');
        return;
    }
    
    // Check if already purchased
    if (state.purchasedUpgrades && state.purchasedUpgrades.includes(upgradeId)) {
        showNotification('Already purchased!', 'info');
        return;
    }
    
    // Check upgrade dependencies
    // Cookie Discount tiers
    if (upgradeId === 'cookieDiscount2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('cookieDiscount')) {
            showNotification('Purchase "Cookie Discount I" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'cookieDiscount3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('cookieDiscount2')) {
            showNotification('Purchase "Cookie Discount II" upgrade first', 'error');
            return;
        }
    }
    
    // Auto Reveal tiers
    if (upgradeId === 'autoReveal2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('autoReveal')) {
            showNotification('Purchase "Auto Reveal I" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'autoReveal3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('autoReveal2')) {
            showNotification('Purchase "Auto Reveal II" upgrade first', 'error');
            return;
        }
    }
    
    // Bet Combo tiers
    if (upgradeId === 'betCombo2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('betCombo1')) {
            showNotification('Purchase "Bet Combo I" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'betCombo3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('betCombo2')) {
            showNotification('Purchase "Bet Combo II" upgrade first', 'error');
            return;
        }
    }
    
    // Cookie tiers
    if (upgradeId === 'diamondCookie') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('goldenCookie')) {
            showNotification('Purchase "Golden Cookie" upgrade first', 'error');
            return;
        }
    }
    
    // News Access tiers - require news tab unlock and previous tiers
    if (upgradeId === 'newsAccess1' || upgradeId === 'newsAccess2' || upgradeId === 'newsAccess3') {
        const newsTabUnlocked = typeof isNewsTabUnlocked === 'function' ? isNewsTabUnlocked() : false;
        if (!newsTabUnlocked) {
            showNotification('Purchase "News Tab Unlock" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'newsAccess2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('newsAccess1')) {
            showNotification('Purchase "News Access I" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'newsAccess3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('newsAccess2')) {
            showNotification('Purchase "News Access II" upgrade first', 'error');
            return;
        }
    }
    
    // Bot Bet tiers - all require console unlock
    if (upgradeId === 'botBetTier1' || upgradeId === 'botBetTier2' || upgradeId === 'botBetTier3') {
        const consoleTabUnlocked = typeof isConsoleTabUnlocked === 'function' ? isConsoleTabUnlocked() : false;
        if (!consoleTabUnlocked) {
            showNotification('Purchase "Console Tab Unlock" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'botBetTier2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('botBetTier1')) {
            showNotification('Purchase "Bot Bet Tier I" upgrade first', 'error');
            return;
        }
    }
    if (upgradeId === 'botBetTier3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('botBetTier2')) {
            showNotification('Purchase "Bot Bet Tier II" upgrade first', 'error');
            return;
        }
    }
    
    // Margin multiplier upgrades - require unlock first
    if ((upgradeId === 'marginMultiplier1' || upgradeId === 'marginMultiplier2' || upgradeId === 'marginMultiplier3')) {
        if (typeof isMarginTradingUnlocked === 'function' && !isMarginTradingUnlocked()) {
            showNotification('Purchase "Margin Trading Unlock" upgrade first', 'error');
            return;
        }
    }
    
    // Margin multiplier 2 requires tier 1
    if (upgradeId === 'marginMultiplier2') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('marginMultiplier1')) {
            showNotification('Purchase "Margin Multiplier I" upgrade first', 'error');
            return;
        }
    }
    
    // Margin multiplier 3 requires tier 2
    if (upgradeId === 'marginMultiplier3') {
        if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('marginMultiplier2')) {
            showNotification('Purchase "Margin Multiplier II" upgrade first', 'error');
            return;
        }
    }
    
    // Check funds
    if (state.balance < upgrade.price) {
        showNotification('Insufficient funds', 'error');
        return;
    }
    
    // Purchase
    state.balance -= upgrade.price;
    updateBalance();
    
    // Play upgrade purchased sound
    AudioManager.playUpgradePurchased();
    
    // Track purchased upgrades
    if (!state.purchasedUpgrades) {
        state.purchasedUpgrades = [];
    }
    state.purchasedUpgrades.push(upgradeId);
    
    // Special handling for Auto Reveal upgrades (any tier)
    if (upgradeId === 'autoReveal' || upgradeId === 'autoReveal2' || upgradeId === 'autoReveal3') {
        // Auto-decode all existing prophecies
        if (typeof autoDecodeExistingProphecies === 'function') {
            autoDecodeExistingProphecies();
        }
    }
    
    // Special handling for Bet Combo upgrades
    if (upgradeId === 'betCombo1' || upgradeId === 'betCombo2' || upgradeId === 'betCombo3') {
        // Update combo counter to show new bet amounts
        if (typeof updateComboCounter === 'function') {
            updateComboCounter();
        }
    }
    
    // Special handling for News Access upgrades
    if (upgradeId === 'newsAccess1' || upgradeId === 'newsAccess2' || upgradeId === 'newsAccess3') {
        // Re-render news to show updated visibility
        if (typeof renderNews === 'function') {
            renderNews();
        }
    }
    
    // Special handling for unlock upgrades
    if (upgradeId === 'stockTradingUnlock') {
        // Update stock trading button states
        updateBetLockButtons();
        showNotification('Stock trading unlocked! You can now buy and sell stocks.', 'success');
    }
    
    if (upgradeId === 'marginTradingUnlock') {
        // Update margin trading button states
        updateBetLockButtons();
        showNotification('Margin trading unlocked! You can now trade with leverage.', 'success');
    }
    
    // Special handling for margin multiplier upgrades
    if (upgradeId === 'marginMultiplier1' || upgradeId === 'marginMultiplier2' || upgradeId === 'marginMultiplier3') {
        const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : 25;
        updateBetLockButtons();
        showNotification(`Margin multiplier increased to x${multiplier}!`, 'success');
    }
    
    if (upgradeId === 'newsTabUnlock') {
        // Update tab lock states
        if (typeof updateTabLockStates === 'function') {
            updateTabLockStates();
        }
        showNotification('News tab unlocked!', 'success');
    }
    
    if (upgradeId === 'consoleTabUnlock') {
        // Update tab lock states
        if (typeof updateTabLockStates === 'function') {
            updateTabLockStates();
        }
        showNotification('Console tab unlocked!', 'success');
    }
    
    // Special handling for bot bet tier upgrades
    if (upgradeId === 'botBetTier1' || upgradeId === 'botBetTier2' || upgradeId === 'botBetTier3') {
        const botBetPercentage = typeof getBotBetPercentage === 'function' ? getBotBetPercentage() : 0.1;
        const percentageDisplay = Math.round(botBetPercentage * 100);
        showNotification(`Bot bet percentage increased to ${percentageDisplay}%!`, 'success');
        // Update bot displays if visible
        if (typeof renderActiveBots === 'function') {
            renderActiveBots();
        }
    }
    
    // Update UI to show purchased state and refresh shop items
    updateShopItemStates();
    
    // Update tab and button states
    if (typeof updateTabLockStates === 'function') {
        updateTabLockStates();
    }
    updateBetLockButtons();
    
    autoSave(); // Save after upgrade purchase
    
    if (upgradeId !== 'stockTradingUnlock' && upgradeId !== 'marginTradingUnlock' && upgradeId !== 'newsTabUnlock' && upgradeId !== 'consoleTabUnlock' && upgradeId !== 'marginMultiplier1' && upgradeId !== 'marginMultiplier2' && upgradeId !== 'marginMultiplier3') {
        showNotification(`${upgrade.name} purchased!`, 'success');
    }
}

// Update shop item visual states
function updateShopItemStates() {
    // Re-render shop items to reflect current state
    renderShopItems();
    
    // Render purchased upgrades in navbar
    renderPurchasedUpgrades();
    
    // Also update cookie tier prices
    updateCookieTierPrices();
}

// Update cookie buy button based on current unlocked tier
function updateCookieTierPrices() {
    if (typeof FORTUNE_COOKIE_TIERS === 'undefined' || typeof getCurrentCookieTier === 'undefined') return;
    
    const tier = getCurrentCookieTier();
    const tierConfig = FORTUNE_COOKIE_TIERS[tier];
    
    // Update the cookie buy button
    const buyBtn = document.getElementById('cookieBuyBtn');
    const iconEl = document.getElementById('cookieBuyIcon');
    const nameEl = document.getElementById('cookieBuyName');
    const descEl = document.getElementById('cookieBuyDesc');
    const priceEl = document.getElementById('cookieBuyPrice');
    
    if (iconEl) iconEl.textContent = tierConfig.icon;
    if (nameEl) nameEl.textContent = tierConfig.name;
    if (descEl) descEl.textContent = tierConfig.description;
    
    // Apply discount to price display
    const effectivePrice = typeof getEffectiveCookiePrice !== 'undefined' 
        ? getEffectiveCookiePrice(tier) 
        : tierConfig.price;
    const discount = typeof getCookieDiscountMultiplier !== 'undefined' 
        ? getCookieDiscountMultiplier() 
        : 1.0;
    
    if (priceEl) {
        if (discount < 1.0) {
            // Show original price crossed out and discounted price
            const discountPercent = Math.round((1 - discount) * 100);
            priceEl.innerHTML = `<span style="text-decoration: line-through; opacity: 0.5; font-size: 12px;">$${tierConfig.price}</span> $${effectivePrice} <span style="color: #10b981; font-size: 11px;">-${discountPercent}%</span>`;
        } else {
            priceEl.textContent = '$' + effectivePrice;
        }
    }
    
    // Add/remove tier styling
    if (buyBtn && iconEl) {
        // Remove all tier classes first
        buyBtn.classList.remove('cookie-tier-2', 'cookie-tier-3');
        iconEl.classList.remove('golden', 'diamond');
        
        // Add appropriate tier styling
        if (tier === 3) {
            buyBtn.classList.add('cookie-tier-3');
            iconEl.classList.add('diamond');
        } else if (tier === 2) {
            buyBtn.classList.add('cookie-tier-2');
            iconEl.classList.add('golden');
        }
    }
}

// Render purchased upgrades as icons in navbar
function renderPurchasedUpgrades() {
    if (typeof SHOP_UPGRADES === 'undefined') return;
    
    const container = document.getElementById('purchasedUpgradesDisplay');
    if (!container) return;
    
    // Get purchased upgrades
    if (!state.purchasedUpgrades || state.purchasedUpgrades.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Generate HTML for each purchased upgrade
    const html = state.purchasedUpgrades.map(upgradeId => {
        const upgrade = SHOP_UPGRADES[upgradeId];
        if (!upgrade) return '';
        
        return `
            <div class="purchased-upgrade-icon" 
                 data-name="${upgrade.name}" 
                 title="${upgrade.name}: ${upgrade.description}">
                ${upgrade.icon}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Render shop items dynamically from config
function renderShopItems() {
    if (typeof SHOP_UPGRADES === 'undefined' || typeof getVisibleUpgradeIds === 'undefined') return;
    
    const container = document.getElementById('shopItemsContainer');
    if (!container) return;
    
    // Get visible upgrades in order
    const upgradeIds = getVisibleUpgradeIds();
    
    // Generate HTML for each upgrade
    const html = upgradeIds.map(upgradeId => {
        const upgrade = SHOP_UPGRADES[upgradeId];
        const purchasedClass = (state.purchasedUpgrades && state.purchasedUpgrades.includes(upgradeId)) ? 'purchased' : '';
        
        // Check if upgrade should be locked based on dependencies
        let isLocked = upgrade.locked || false;
        
        // Cookie Discount tiers
        if (upgradeId === 'cookieDiscount2') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('cookieDiscount')) {
                isLocked = true;
            }
        }
        if (upgradeId === 'cookieDiscount3') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('cookieDiscount2')) {
                isLocked = true;
            }
        }
        
        // Auto Reveal tiers
        if (upgradeId === 'autoReveal2') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('autoReveal')) {
                isLocked = true;
            }
        }
        if (upgradeId === 'autoReveal3') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('autoReveal2')) {
                isLocked = true;
            }
        }
        
        // Bet Combo tiers
        if (upgradeId === 'betCombo2') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('betCombo1')) {
                isLocked = true;
            }
        }
        if (upgradeId === 'betCombo3') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('betCombo2')) {
                isLocked = true;
            }
        }
        
        // Cookie tiers
        if (upgradeId === 'diamondCookie') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('goldenCookie')) {
                isLocked = true;
            }
        }
        
        // News Access tiers - require news tab unlock and previous tiers
        if (upgradeId === 'newsAccess1' || upgradeId === 'newsAccess2' || upgradeId === 'newsAccess3') {
            const newsTabUnlocked = typeof isNewsTabUnlocked === 'function' ? isNewsTabUnlocked() : false;
            if (!newsTabUnlocked) {
                isLocked = true;
            }
        }
        if (upgradeId === 'newsAccess2') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('newsAccess1')) {
                isLocked = true;
            }
        }
        if (upgradeId === 'newsAccess3') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('newsAccess2')) {
                isLocked = true;
            }
        }
        
        // Bot Bet tiers - all require console unlock
        if (upgradeId === 'botBetTier1' || upgradeId === 'botBetTier2' || upgradeId === 'botBetTier3') {
            const consoleTabUnlocked = typeof isConsoleTabUnlocked === 'function' ? isConsoleTabUnlocked() : false;
            if (!consoleTabUnlocked) {
                isLocked = true;
            }
        }
        if (upgradeId === 'botBetTier2') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('botBetTier1')) {
                isLocked = true;
            }
        }
        if (upgradeId === 'botBetTier3') {
            if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('botBetTier2')) {
                isLocked = true;
            }
        }
        
        // Margin multiplier upgrades
        if (upgradeId === 'marginMultiplier1' || upgradeId === 'marginMultiplier2' || upgradeId === 'marginMultiplier3') {
            const marginUnlocked = typeof isMarginTradingUnlocked === 'function' ? isMarginTradingUnlocked() : false;
            if (!marginUnlocked) {
                isLocked = true;
            } else if (upgradeId === 'marginMultiplier2') {
                if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('marginMultiplier1')) {
                    isLocked = true;
                }
            } else if (upgradeId === 'marginMultiplier3') {
                if (!state.purchasedUpgrades || !state.purchasedUpgrades.includes('marginMultiplier2')) {
                    isLocked = true;
                }
            }
        }
        
        const lockedClass = isLocked ? 'locked' : '';
        
        return `
            <div class="shop-item ${lockedClass} ${purchasedClass}" data-tooltip="${upgrade.description}" onclick="purchaseUpgrade('${upgradeId}')">
                <div class="shop-item-icon">${upgrade.icon}</div>
                <div class="shop-item-info">
                    <span class="shop-item-name">${upgrade.name}</span>
                </div>
                <span class="shop-item-price">$${upgrade.price.toLocaleString()}</span>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Update shop item prices from config (legacy - now handled by renderShopItems)
function updateShopPricesFromConfig() {
    if (typeof SHOP_UPGRADES === 'undefined') return;
    
    const items = document.querySelectorAll('.shop-item');
    items.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/purchaseUpgrade\('([^']+)'\)/);
            if (match) {
                const upgradeId = match[1];
                const upgrade = SHOP_UPGRADES[upgradeId];
                if (upgrade) {
                    const priceEl = item.querySelector('.shop-item-price');
                    if (priceEl) {
                        priceEl.textContent = '$' + upgrade.price.toLocaleString();
                    }
                }
            }
        }
    });
}

function updateBalance() {
    // Trigger visual feedback for balance change
    const balanceEl = document.getElementById('balance');
    const isIncreasing = state.balance > state.displayBalance;
    
    balanceEl.classList.remove('increasing', 'decreasing');
    void balanceEl.offsetWidth; // Force reflow
    balanceEl.classList.add(isIncreasing ? 'increasing' : 'decreasing');
    
    // Remove class after animation
    setTimeout(() => {
        balanceEl.classList.remove('increasing', 'decreasing');
    }, 500);
}

function updateBalanceDisplay() {
    // Display cash balance only (stock holdings shown in portfolio overlay)
    const formatted = state.displayBalance.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById('balance').textContent = formatted;
}

function showNotification(message, type = '') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = 'notification ' + type + ' show';
    
    // Play appropriate sound based on notification type
    if (type === 'error') {
        AudioManager.playError();
    }
    
    setTimeout(() => notif.classList.remove('show'), 3000);
}

// Update timer bars with continuous countdown
function updateTimerDisplays(now) {
    // Update prophecy timers
    state.deals.forEach(prophecy => {
        if (prophecy.resolved) return;
        const card = document.querySelector(`.prophecy-card[data-id="${prophecy.id}"]`);
        if (card) {
            const elapsed = (now - prophecy.startTime) / 1000;
            const remaining = Math.max(0, prophecy.duration - elapsed);
            const progress = remaining / prophecy.duration;
            
            const timerLabel = card.querySelector('.timer-label');
            const timerFill = card.querySelector('.timer-fill');
            
            if (timerLabel) timerLabel.textContent = Math.ceil(remaining) + 's';
            if (timerFill) timerFill.style.width = (progress * 100) + '%';
        }
    });
    
    // Update position timers
    state.positions.forEach(pos => {
        const chip = document.querySelector(`.position-chip[data-id="${pos.id}"]`);
        if (chip) {
            const elapsed = (now - pos.startTime) / 1000;
            const remaining = Math.max(0, pos.duration - elapsed);
            
            const timerEl = chip.querySelector('.position-timer');
            if (timerEl) timerEl.textContent = Math.ceil(remaining) + 's';
        }
    });
    
    // Update bet lock button states
    updateBetLockButtons();
}

// Update Long/Short button states based on bet lock
function updateBetLockButtons() {
    const longBtn = document.querySelector('.trade-btn.long');
    const shortBtn = document.querySelector('.trade-btn.short');
    const stockBuyBtn = document.querySelector('.trade-btn.stock-buy');
    const stockSellBtn = document.querySelector('.trade-btn.stock-sell');
    const marginLongBtn = document.querySelector('.trade-btn.margin-long');
    const marginShortBtn = document.querySelector('.trade-btn.margin-short');
    const canBet = canPlaceBet();
    const amount = getCurrentBet();
    const hasFunds = amount <= state.balance;
    const hasMarginPosition = state.marginPosition !== null;
    // Stock purchase requires amount + fee
    const fee = typeof STOCK_PURCHASE_FEE !== 'undefined' ? STOCK_PURCHASE_FEE : 0;
    const hasFundsForStock = (amount + fee) <= state.balance;
    
    // Check if stock trading is unlocked
    const stockTradingUnlocked = typeof isStockTradingUnlocked === 'function' ? isStockTradingUnlocked() : false;
    
    if (longBtn) {
        longBtn.disabled = !canBet || !hasFunds;
        if (!canBet) {
            const remaining = getBetLockRemaining();
            longBtn.title = `Please wait ${remaining}s before betting again`;
        } else if (!hasFunds) {
            longBtn.title = 'Insufficient funds';
        } else {
            longBtn.title = '';
        }
    }
    
    if (shortBtn) {
        shortBtn.disabled = !canBet || !hasFunds;
        if (!canBet) {
            const remaining = getBetLockRemaining();
            shortBtn.title = `Please wait ${remaining}s before betting again`;
        } else if (!hasFunds) {
            shortBtn.title = 'Insufficient funds';
        } else {
            shortBtn.title = '';
        }
    }
    
    if (stockBuyBtn) {
        if (!stockTradingUnlocked) {
            stockBuyBtn.disabled = true;
            stockBuyBtn.title = 'Purchase "Stock Trading Unlock" upgrade to unlock';
            stockBuyBtn.classList.add('locked');
            stockBuyBtn.classList.add('hidden');
        } else {
            stockBuyBtn.classList.remove('locked');
            stockBuyBtn.classList.remove('hidden');
            stockBuyBtn.disabled = !canBet || !hasFundsForStock;
            if (!canBet) {
                const remaining = getBetLockRemaining();
                stockBuyBtn.title = `Please wait ${remaining}s before buying again`;
            } else if (!hasFundsForStock) {
                stockBuyBtn.title = `Insufficient funds (need $${amount + fee} including $${fee} fee)`;
            } else {
                stockBuyBtn.title = `Buy stock ($${fee} transaction fee)`;
            }
        }
    }
    
    if (stockSellBtn) {
        if (!stockTradingUnlocked) {
            stockSellBtn.disabled = true;
            stockSellBtn.title = 'Purchase "Stock Trading Unlock" upgrade to unlock';
            stockSellBtn.classList.add('locked');
            stockSellBtn.classList.add('hidden');
        } else {
            stockSellBtn.classList.remove('locked');
            stockSellBtn.classList.remove('hidden');
            // Sell button is enabled if there are stocks to sell
            const holding = typeof getCurrentStockHolding === 'function' ? getCurrentStockHolding() : null;
            stockSellBtn.disabled = !holding || holding.shares === 0;
            if (!holding || holding.shares === 0) {
                stockSellBtn.title = 'No stocks to sell';
            } else {
                stockSellBtn.title = 'Sell all stocks';
            }
        }
    }
    
    // Hide the stock-trade-buttons container when stock trading is locked
    const stockTradeButtonsContainer = document.querySelector('.stock-trade-buttons');
    if (stockTradeButtonsContainer) {
        if (!stockTradingUnlocked) {
            stockTradeButtonsContainer.classList.add('hidden');
        } else {
            stockTradeButtonsContainer.classList.remove('hidden');
        }
    }
    
    // Check if margin trading is unlocked
    const marginTradingUnlocked = typeof isMarginTradingUnlocked === 'function' ? isMarginTradingUnlocked() : false;
    const marginMultiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : 25;
    
    // Update margin button states
    if (marginLongBtn) {
        if (!marginTradingUnlocked) {
            marginLongBtn.disabled = true;
            marginLongBtn.title = 'Purchase "Margin Trading Unlock" upgrade to unlock';
            marginLongBtn.classList.add('locked');
            marginLongBtn.classList.add('hidden');
        } else {
            marginLongBtn.classList.remove('locked');
            marginLongBtn.classList.remove('hidden');
            marginLongBtn.disabled = !canBet || !hasFunds || hasMarginPosition;
            if (hasMarginPosition) {
                marginLongBtn.title = 'Close your current margin position first';
            } else if (!canBet) {
                const remaining = getBetLockRemaining();
                marginLongBtn.title = `Please wait ${remaining}s before trading again`;
            } else if (!hasFunds) {
                marginLongBtn.title = 'Insufficient funds';
            } else {
                marginLongBtn.title = `Open long margin position (x${marginMultiplier} multiplier)`;
            }
        }
    }
    
    if (marginShortBtn) {
        if (!marginTradingUnlocked) {
            marginShortBtn.disabled = true;
            marginShortBtn.title = 'Purchase "Margin Trading Unlock" upgrade to unlock';
            marginShortBtn.classList.add('locked');
            marginShortBtn.classList.add('hidden');
        } else {
            marginShortBtn.classList.remove('locked');
            marginShortBtn.classList.remove('hidden');
            marginShortBtn.disabled = !canBet || !hasFunds || hasMarginPosition;
            if (hasMarginPosition) {
                marginShortBtn.title = 'Close your current margin position first';
            } else if (!canBet) {
                const remaining = getBetLockRemaining();
                marginShortBtn.title = `Please wait ${remaining}s before trading again`;
            } else if (!hasFunds) {
                marginShortBtn.title = 'Insufficient funds';
            } else {
                marginShortBtn.title = `Open short margin position (x${marginMultiplier} multiplier)`;
            }
        }
    }
    
    // Hide the margin-trade-buttons container when margin trading is locked
    const marginTradeButtonsContainer = document.querySelector('.margin-trade-buttons');
    if (marginTradeButtonsContainer) {
        if (!marginTradingUnlocked) {
            marginTradeButtonsContainer.classList.add('hidden');
        } else {
            marginTradeButtonsContainer.classList.remove('hidden');
        }
    }
}

// Update all PnL displays smoothly
function updatePnLDisplays() {
    // Prophecies are info-only, no delta updates needed
    
    // Update position PnLs (if we have chips)
    state.positions.forEach(pos => {
        const chip = document.querySelector(`.position-chip[data-id="${pos.id}"]`);
        if (chip) {
            const delta = ((state.displayPrice - pos.entryPrice) / pos.entryPrice) * 100;
            const deltaDisplay = (delta >= 0 ? '+' : '') + delta.toFixed(2) + '%';
            const deltaClass = delta >= 0 ? 'positive' : 'negative';
            const pnlEl = chip.querySelector('.position-pnl');
            if (pnlEl) {
                pnlEl.textContent = deltaDisplay;
                pnlEl.className = 'position-pnl ' + deltaClass;
            }
        }
    });
    
    // Update stock holding display
    if (typeof updateStockHoldingDisplay === 'function') {
        updateStockHoldingDisplay();
    }
}

// ===========================================
// PORTFOLIO OVERLAY
// ===========================================
let portfolioOverlayOpen = false;

function togglePortfolioOverlay() {
    portfolioOverlayOpen = !portfolioOverlayOpen;
    const overlay = document.getElementById('portfolioOverlay');
    const backdrop = document.getElementById('portfolioBackdrop');
    
    if (portfolioOverlayOpen) {
        renderPortfolioOverlay();
        overlay.classList.add('open');
        backdrop.classList.add('open');
    } else {
        overlay.classList.remove('open');
        backdrop.classList.remove('open');
    }
}

function renderPortfolioOverlay() {
    const summaryEl = document.getElementById('portfolioSummary');
    const actionsEl = document.getElementById('portfolioActions');
    const holdingsEl = document.getElementById('portfolioHoldings');
    
    // Calculate totals
    let totalStockValue = 0;
    let totalInvested = 0;
    const holdings = [];
    
    Object.keys(state.stockHoldings).forEach(symbol => {
        const holding = state.stockHoldings[symbol];
        if (holding && holding.shares > 0) {
            const config = stockConfig[symbol];
            const prices = state.chartPrices[symbol];
            const currentPrice = prices ? prices.displayPrice : (config ? config.basePrice : 0);
            const currentValue = holding.shares * currentPrice;
            const pnl = currentValue - holding.totalInvested;
            const pnlPercent = holding.totalInvested > 0 ? (pnl / holding.totalInvested) * 100 : 0;
            
            totalStockValue += currentValue;
            totalInvested += holding.totalInvested;
            
            holdings.push({
                symbol,
                name: config ? config.name : symbol,
                tag: config ? config.tag : '',
                shares: holding.shares,
                avgPrice: holding.avgPrice,
                currentPrice,
                currentValue,
                totalInvested: holding.totalInvested,
                pnl,
                pnlPercent
            });
        }
    });
    
    const totalPnl = totalStockValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    const totalPortfolio = state.balance + totalStockValue;
    
    // Render summary
    summaryEl.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Cash</span>
            <span class="summary-value" id="portfolioCash">$${state.balance.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Stock Holdings</span>
            <span class="summary-value" id="portfolioStockHoldings">$${totalStockValue.toFixed(2)}</span>
        </div>
        <div class="summary-row highlight">
            <span class="summary-label">Total Portfolio</span>
            <span class="summary-value" id="portfolioTotal">$${totalPortfolio.toFixed(2)}</span>
        </div>
        ${totalInvested > 0 ? `
        <div class="summary-row ${totalPnl >= 0 ? 'positive' : 'negative'}" id="portfolioTotalPnLRow">
            <span class="summary-label">Total P&L</span>
            <span class="summary-value" id="portfolioTotalPnL">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} (${totalPnl >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)</span>
        </div>
        ` : ''}
    `;
    
    // Render action buttons (only if there are holdings)
    if (holdings.length > 0) {
        const profitableCount = holdings.filter(h => h.pnl > 0).length;
        actionsEl.innerHTML = `
            <div class="portfolio-actions-buttons">
                <button class="portfolio-action-btn portfolio-action-btn-all" onclick="sellAllStocks()">
                    Send All Stock
                </button>
                <button class="portfolio-action-btn portfolio-action-btn-profitable" onclick="sellAllProfitableStocks()" ${profitableCount === 0 ? 'disabled' : ''}>
                    Send All Profitable Stock${profitableCount > 0 ? ` (${profitableCount})` : ''}
                </button>
            </div>
        `;
    } else {
        actionsEl.innerHTML = '';
    }
    
    // Render holdings
    if (holdings.length === 0) {
        holdingsEl.innerHTML = `
            <div class="holdings-empty">
                <div class="empty-icon">📈</div>
                <div class="empty-text">No stocks owned yet</div>
                <div class="empty-hint">Buy stocks to see them here</div>
            </div>
        `;
    } else {
        holdingsEl.innerHTML = `
            <div class="holdings-header">
                <span>Stock</span>
                <span>Shares</span>
                <span>Avg Price</span>
                <span>Current</span>
                <span>Value</span>
                <span>P&L</span>
            </div>
            ${holdings.map(h => `
                <div class="holding-row ${state.dataMode === h.symbol ? 'active' : ''}" data-symbol="${h.symbol}">
                    <div class="holding-stock">
                        <span class="holding-symbol">${h.name}</span>
                        <span class="holding-tag">${h.tag}</span>
                    </div>
                    <span class="holding-shares">${h.shares.toFixed(4)}</span>
                    <span class="holding-avg">$${h.avgPrice.toFixed(2)}</span>
                    <span class="holding-current" data-symbol="${h.symbol}">$${h.currentPrice.toFixed(2)}</span>
                    <span class="holding-value" data-symbol="${h.symbol}">$${h.currentValue.toFixed(2)}</span>
                    <span class="holding-pnl ${h.pnl >= 0 ? 'positive' : 'negative'}" data-symbol="${h.symbol}">
                        ${h.pnl >= 0 ? '+' : ''}$${h.pnl.toFixed(2)}
                        <br><small>(${h.pnl >= 0 ? '+' : ''}${h.pnlPercent.toFixed(2)}%)</small>
                    </span>
                </div>
            `).join('')}
        `;
    }
}

// Update portfolio overlay values in real-time (lightweight update, no full re-render)
function updatePortfolioOverlay() {
    // Only update if portfolio overlay is open
    if (!portfolioOverlayOpen) return;
    
    // Calculate totals
    let totalStockValue = 0;
    let totalInvested = 0;
    
    Object.keys(state.stockHoldings).forEach(symbol => {
        const holding = state.stockHoldings[symbol];
        if (holding && holding.shares > 0) {
            const config = stockConfig[symbol];
            const prices = state.chartPrices[symbol];
            const currentPrice = prices ? prices.displayPrice : (config ? config.basePrice : 0);
            const currentValue = holding.shares * currentPrice;
            const pnl = currentValue - holding.totalInvested;
            const pnlPercent = holding.totalInvested > 0 ? (pnl / holding.totalInvested) * 100 : 0;
            
            totalStockValue += currentValue;
            totalInvested += holding.totalInvested;
            
            // Update individual holding row values
            const currentEl = document.querySelector(`.holding-current[data-symbol="${symbol}"]`);
            const valueEl = document.querySelector(`.holding-value[data-symbol="${symbol}"]`);
            const pnlEl = document.querySelector(`.holding-pnl[data-symbol="${symbol}"]`);
            const rowEl = document.querySelector(`.holding-row[data-symbol="${symbol}"]`);
            
            if (currentEl) {
                currentEl.textContent = `$${currentPrice.toFixed(2)}`;
            }
            if (valueEl) {
                valueEl.textContent = `$${currentValue.toFixed(2)}`;
            }
            if (pnlEl) {
                const pnlClass = pnl >= 0 ? 'positive' : 'negative';
                pnlEl.className = `holding-pnl ${pnlClass}`;
                pnlEl.innerHTML = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}<br><small>(${pnl >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)</small>`;
            }
            if (rowEl) {
                // Update active class if this is the current stock
                rowEl.classList.toggle('active', state.dataMode === symbol);
            }
        }
    });
    
    const totalPnl = totalStockValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    const totalPortfolio = state.balance + totalStockValue;
    
    // Update summary values
    const cashEl = document.getElementById('portfolioCash');
    const stockHoldingsEl = document.getElementById('portfolioStockHoldings');
    const totalEl = document.getElementById('portfolioTotal');
    const totalPnLEl = document.getElementById('portfolioTotalPnL');
    const totalPnLRowEl = document.getElementById('portfolioTotalPnLRow');
    
    if (cashEl) {
        cashEl.textContent = `$${state.balance.toFixed(2)}`;
    }
    if (stockHoldingsEl) {
        stockHoldingsEl.textContent = `$${totalStockValue.toFixed(2)}`;
    }
    if (totalEl) {
        totalEl.textContent = `$${totalPortfolio.toFixed(2)}`;
    }
    if (totalPnLEl && totalPnLRowEl) {
        const pnlClass = totalPnl >= 0 ? 'positive' : 'negative';
        totalPnLRowEl.className = `summary-row ${pnlClass}`;
        totalPnLEl.textContent = `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} (${totalPnl >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)`;
    }
    
    // Update profitable count for action button
    if (totalInvested > 0) {
        const holdings = [];
        Object.keys(state.stockHoldings).forEach(symbol => {
            const holding = state.stockHoldings[symbol];
            if (holding && holding.shares > 0) {
                const prices = state.chartPrices[symbol];
                const config = stockConfig[symbol];
                const currentPrice = prices ? prices.displayPrice : (config ? config.basePrice : 0);
                const currentValue = holding.shares * currentPrice;
                const pnl = currentValue - holding.totalInvested;
                if (pnl > 0) {
                    holdings.push(symbol);
                }
            }
        });
        const profitableBtn = document.querySelector('.portfolio-action-btn-profitable');
        if (profitableBtn) {
            const profitableCount = holdings.length;
            profitableBtn.disabled = profitableCount === 0;
            profitableBtn.textContent = `Send All Profitable Stock${profitableCount > 0 ? ` (${profitableCount})` : ''}`;
        }
    }
}

// ===========================================
// RESET GAME
// ===========================================
let resetModalOpen = false;

function confirmResetGame() {
    resetModalOpen = true;
    
    // Close settings app if open
    if (typeof closeSettingsApp === 'function') {
        closeSettingsApp();
    }
    
    const modal = document.getElementById('resetModal');
    const backdrop = document.getElementById('resetBackdrop');
    modal.classList.add('open');
    backdrop.classList.add('open');
}

function cancelResetGame() {
    resetModalOpen = false;
    const modal = document.getElementById('resetModal');
    const backdrop = document.getElementById('resetBackdrop');
    modal.classList.remove('open');
    backdrop.classList.remove('open');
}

async function executeResetGame() {
    // Show loading state
    showNotification('Resetting game and deleting all data...', 'info');
    
    // Close all overlays first
    if (typeof closePhoneOverlays === 'function') {
        closePhoneOverlays();
    }
    
    // Reset game state and delete all cloud data
    if (typeof resetGameStateComplete === 'function') {
        await resetGameStateComplete();
    } else {
        // Fallback to local reset only
        resetGameState();
    }
    
    // Clear saved credentials
    if (typeof clearCredentials === 'function') {
        clearCredentials();
    }
    
    // Close modal
    cancelResetGame();
    
    // Update all game UI elements
    updateBalanceDisplay();
    updateComboCounter();
    renderCookieInventory();
    renderDeals();
    renderPositions();
    renderStockHolding();
    
    // Update shop item states
    updateShopItemStates();
    
    // Update all banking/phone displays
    if (typeof updateTraderLockState === 'function') {
        updateTraderLockState();
    }
    if (typeof updateBankerDisplay === 'function') {
        updateBankerDisplay();
    }
    if (typeof updateExpensesDisplay === 'function') {
        updateExpensesDisplay();
    }
    if (typeof updateLuxuryShopDisplay === 'function') {
        updateLuxuryShopDisplay();
    }
    
    // Return to phone hub
    if (typeof togglePhone === 'function') {
        togglePhone();
    }
    
    // Show login card again
    if (typeof showLoginCard === 'function') {
        showLoginCard();
    }
    
    showNotification('Game reset complete! All data deleted.', 'success');
}

// (Streamer window jitter now handled purely via CSS animation on .streamer-video)

// ===========================================
// STREAMER EMOTION CONTROLLER (Fake webcam)
// Full spectrum 20 (worst loss) .. 50 (neutral) .. 80 (best win)
// ===========================================
const STREAMER_EMOTION_LEVELS = {
    NEUTRAL: 50,
    MIN: 20,
    MAX: 80
};

// All streamer faces: lower = more loss/sad, higher = more win/happy
const STREAMER_EMOTION_IMAGES = {
    20: 'fc_20.jpg',
    25: 'fc_25.jpg',
    30: 'fc_30.jpg',
    35: 'fc_35.jpg',
    40: 'fc_40.jpg',
    50: 'fc_50.jpg',
    55: 'fc_55.jpg',
    60: 'fc_60.jpg',
    65: 'fc_65.jpg',
    70: 'fc_70.jpg',
    75: 'fc_75.jpg',
    80: 'fc_80.jpg'
};

const streamerEmotionState = {
    currentLevel: STREAMER_EMOTION_LEVELS.NEUTRAL,
    relaxTimeoutId: null
};

const STREAMER_VIEWER_NEUTRAL = 0;
const STREAMER_VIEWER_EXTREME_MIN = 20;
const STREAMER_VIEWER_EXTREME_MAX = 100;

function getStreamerImageElement() {
    const windowEl = document.getElementById('streamerWindow');
    if (!windowEl) return null;
    return windowEl.querySelector('.streamer-video');
}

// Derive a baseline mood from overall trading progress (portfolio vs initial deposit).
// Maps ratio to full face spectrum 20..80 so all faces can appear when relaxing.
function getStreamerBaselineEmotionLevel() {
    if (typeof getTotalPortfolioValue !== 'function') {
        return STREAMER_EMOTION_LEVELS.NEUTRAL;
    }

    const initial = state.initialDeposit || 0;
    const portfolio = getTotalPortfolioValue();

    if (!initial || portfolio <= 0) {
        return STREAMER_EMOTION_LEVELS.NEUTRAL;
    }

    const ratio = portfolio / initial;

    // Map ratio to face level (20 = worst, 50 = neutral, 80 = best)
    if (ratio <= 0.25) return 20;
    if (ratio <= 0.35) return 25;
    if (ratio <= 0.45) return 30;
    if (ratio <= 0.55) return 35;
    if (ratio <= 0.75) return 40;
    if (ratio <= 1.10) return 50;
    if (ratio <= 1.25) return 55;
    if (ratio <= 1.45) return 60;
    if (ratio <= 1.70) return 65;
    if (ratio <= 2.00) return 70;
    if (ratio <= 2.50) return 75;
    return 80;
}

function setStreamerEmotionLevel(level, relaxDelayMs) {
    const img = getStreamerImageElement();
    if (!img) return;

    // Clamp to nearest valid face level if unknown
    if (!STREAMER_EMOTION_IMAGES[level]) {
        const valid = [20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80];
        level = valid.reduce((prev, curr) => Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev);
    }

    if (streamerEmotionState.currentLevel === level) {
        updateStreamerViewerCount(level);
        // Still refresh relax timer if requested
        if (relaxDelayMs && relaxDelayMs > 0) {
            if (streamerEmotionState.relaxTimeoutId) {
                clearTimeout(streamerEmotionState.relaxTimeoutId);
            }
            streamerEmotionState.relaxTimeoutId = setTimeout(() => {
                const baseline = getStreamerBaselineEmotionLevel();
                if (baseline !== streamerEmotionState.currentLevel) {
                    setStreamerEmotionLevel(baseline, 0);
                }
            }, relaxDelayMs);
        }
        return;
    }

    streamerEmotionState.currentLevel = level;

    const file = STREAMER_EMOTION_IMAGES[level] || STREAMER_EMOTION_IMAGES[STREAMER_EMOTION_LEVELS.NEUTRAL];
    img.src = `images/streamer/${file}`;

    updateStreamerViewerCount(level);

    // Schedule discrete snap back towards baseline after some calm time
    if (streamerEmotionState.relaxTimeoutId) {
        clearTimeout(streamerEmotionState.relaxTimeoutId);
    }
    if (relaxDelayMs && relaxDelayMs > 0) {
        streamerEmotionState.relaxTimeoutId = setTimeout(() => {
            const baseline = getStreamerBaselineEmotionLevel();
            if (baseline !== streamerEmotionState.currentLevel) {
                setStreamerEmotionLevel(baseline, 0);
            }
        }, relaxDelayMs);
    }
}

// Valid streamer levels per direction (never go opposite: win = happy, loss = sad).
const STREAMER_WIN_LEVELS = [55, 60, 65, 70, 75, 80];
const STREAMER_LOSS_LEVELS = [20, 25, 30, 35, 40];

function pickRandomStreamerLevel(levels) {
    return levels[Math.floor(Math.random() * levels.length)];
}

// Map intensity (|pnl|/stake) to a random face level in the correct direction.
// Win: random within positive band; loss: random within negative band.
function intensityToFaceLevel(isWin, intensity) {
    if (isWin) {
        if (intensity >= 2.5) return pickRandomStreamerLevel([75, 80]);
        if (intensity >= 1.9) return pickRandomStreamerLevel([70, 75, 80]);
        if (intensity >= 1.4) return pickRandomStreamerLevel([65, 70, 75]);
        if (intensity >= 1.0) return pickRandomStreamerLevel([60, 65, 70]);
        if (intensity >= 0.5) return pickRandomStreamerLevel([55, 60, 65]);
        return pickRandomStreamerLevel([55, 60]);
    } else {
        if (intensity >= 2.5) return pickRandomStreamerLevel([20, 25]);
        if (intensity >= 1.9) return pickRandomStreamerLevel([20, 25, 30]);
        if (intensity >= 1.4) return pickRandomStreamerLevel([25, 30, 35]);
        if (intensity >= 1.0) return pickRandomStreamerLevel([30, 35, 40]);
        if (intensity >= 0.5) return pickRandomStreamerLevel([35, 40]);
        return pickRandomStreamerLevel([35, 40]);
    }
}

// Public helper used from trading logic.
// - isWin: true for win/profit, false for loss
// - profitAmount: signed PnL (positive for win, negative for loss)
// - stakeAmount: size of the bet / position / at-risk amount
function updateStreamerMoodOnTrade(isWin, profitAmount, stakeAmount) {
    const img = getStreamerImageElement();
    if (!img) return;

    const stake = Math.max(0, Number(stakeAmount) || 0);
    const pnl = Number(profitAmount) || 0;

    if (!stake || !pnl) {
        setStreamerEmotionLevel(getStreamerBaselineEmotionLevel(), 4000);
        return;
    }

    const intensity = Math.abs(pnl) / stake;
    const targetLevel = intensityToFaceLevel(isWin, intensity);

    // Relax back towards baseline after 4–6s so you see mid-spectrum faces
    const relaxDelay = intensity >= 2.0 ? 6000 : intensity >= 0.8 ? 5000 : 4000;

    setStreamerEmotionLevel(targetLevel, relaxDelay);
}

// Viewer count: neutral (50) → 0, extreme win/loss (20 or 80) → 20–100.
function getStreamerViewerCountForLevel(level) {
    const deviation = Math.abs(level - STREAMER_EMOTION_LEVELS.NEUTRAL);
    const maxDeviation = 30; // 20 or 80 vs 50
    if (deviation <= 5) return STREAMER_VIEWER_NEUTRAL; // close to neutral = 0 watching
    const t = Math.min(1, deviation / maxDeviation);
    const range = STREAMER_VIEWER_EXTREME_MAX - STREAMER_VIEWER_EXTREME_MIN;
    return Math.round(STREAMER_VIEWER_EXTREME_MIN + Math.random() * range * t);
}

function updateStreamerViewerCount(level) {
    const el = document.getElementById('streamerViewerCount');
    if (!el) return;
    const n = getStreamerViewerCountForLevel(level);
    el.textContent = n === 0 ? '0 watching' : `${n.toLocaleString()} watching`;
}

function toggleStreamerWindow() {
    const win = document.getElementById('streamerWindow');
    const btn = document.getElementById('streamerToggle');
    if (!win || !btn) return;
    const isHidden = win.classList.toggle('streamer-window-hidden');
    try {
        localStorage.setItem('streamerWindowHidden', isHidden ? '1' : '0');
    } catch (e) {}
    const icon = btn.querySelector('.streamer-toggle-icon');
    if (icon) icon.textContent = isHidden ? '▶' : '−';
    btn.title = isHidden ? 'Show stream' : 'Hide stream';
    btn.setAttribute('aria-label', isHidden ? 'Show streamer window' : 'Hide streamer window');
}

function initStreamerToggle() {
    const btn = document.getElementById('streamerToggle');
    const win = document.getElementById('streamerWindow');
    if (!btn || !win) return;
    try {
        // Default to hidden; only show if explicitly set to '0' in localStorage
        const shown = localStorage.getItem('streamerWindowHidden') === '0';
        if (!shown) {
            win.classList.add('streamer-window-hidden');
            const icon = btn.querySelector('.streamer-toggle-icon');
            if (icon) icon.textContent = '▶';
            btn.title = 'Show stream';
            btn.setAttribute('aria-label', 'Show streamer window');
        }
    } catch (e) {
        // If localStorage fails, default to hidden
        win.classList.add('streamer-window-hidden');
        const icon = btn.querySelector('.streamer-toggle-icon');
        if (icon) icon.textContent = '▶';
        btn.title = 'Show stream';
        btn.setAttribute('aria-label', 'Show streamer window');
    }
    btn.addEventListener('click', toggleStreamerWindow);
}

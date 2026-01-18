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
    
    // Check funds
    if (state.balance < upgrade.price) {
        showNotification('Insufficient funds', 'error');
        return;
    }
    
    // Play click sound for purchase
    AudioManager.playClick();
    
    // Purchase
    state.balance -= upgrade.price;
    updateBalance();
    
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
    
    // Update UI to show purchased state and refresh shop items
    updateShopItemStates();
    
    autoSave(); // Save after upgrade purchase
    
    showNotification(`${upgrade.name} purchased!`, 'success');
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
        const lockedClass = upgrade.locked ? 'locked' : '';
        const purchasedClass = (state.purchasedUpgrades && state.purchasedUpgrades.includes(upgradeId)) ? 'purchased' : '';
        
        return `
            <div class="shop-item ${lockedClass} ${purchasedClass}" onclick="purchaseUpgrade('${upgradeId}')">
                <div class="shop-item-icon">${upgrade.icon}</div>
                <div class="shop-item-info">
                    <span class="shop-item-name">${upgrade.name}</span>
                    <span class="shop-item-desc">${upgrade.description}</span>
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
    const canBet = canPlaceBet();
    const amount = getCurrentBet();
    const hasFunds = amount <= state.balance;
    // Stock purchase requires amount + fee
    const fee = typeof STOCK_PURCHASE_FEE !== 'undefined' ? STOCK_PURCHASE_FEE : 0;
    const hasFundsForStock = (amount + fee) <= state.balance;
    
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
            <span class="summary-value">$${state.balance.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Stock Holdings</span>
            <span class="summary-value">$${totalStockValue.toFixed(2)}</span>
        </div>
        <div class="summary-row highlight">
            <span class="summary-label">Total Portfolio</span>
            <span class="summary-value">$${totalPortfolio.toFixed(2)}</span>
        </div>
        ${totalInvested > 0 ? `
        <div class="summary-row ${totalPnl >= 0 ? 'positive' : 'negative'}">
            <span class="summary-label">Total P&L</span>
            <span class="summary-value">${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} (${totalPnl >= 0 ? '+' : ''}${totalPnlPercent.toFixed(2)}%)</span>
        </div>
        ` : ''}
    `;
    
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
                <div class="holding-row ${state.dataMode === h.symbol ? 'active' : ''}">
                    <div class="holding-stock">
                        <span class="holding-symbol">${h.name}</span>
                        <span class="holding-tag">${h.tag}</span>
                    </div>
                    <span class="holding-shares">${h.shares.toFixed(4)}</span>
                    <span class="holding-avg">$${h.avgPrice.toFixed(2)}</span>
                    <span class="holding-current">$${h.currentPrice.toFixed(2)}</span>
                    <span class="holding-value">$${h.currentValue.toFixed(2)}</span>
                    <span class="holding-pnl ${h.pnl >= 0 ? 'positive' : 'negative'}">
                        ${h.pnl >= 0 ? '+' : ''}$${h.pnl.toFixed(2)}
                        <br><small>(${h.pnl >= 0 ? '+' : ''}${h.pnlPercent.toFixed(2)}%)</small>
                    </span>
                </div>
            `).join('')}
        `;
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

function executeResetGame() {
    // Reset game state
    resetGameState();
    
    // Clear saved credentials
    if (typeof clearCredentials === 'function') {
        clearCredentials();
    }
    
    // Close modal
    cancelResetGame();
    
    // Update UI
    updateBalanceDisplay();
    updateComboCounter();
    renderCookieInventory();
    renderDeals();
    renderPositions();
    renderStockHolding();
    
    // Update shop item states
    updateShopItemStates();
    
    // Update banking displays and return to phone
    if (typeof updateTraderLockState === 'function') {
        updateTraderLockState();
    }
    if (typeof updateBankerDisplay === 'function') {
        updateBankerDisplay();
    }
    if (typeof togglePhone === 'function') {
        togglePhone(); // Return to phone hub
    }
    
    // Show login card again
    if (typeof showLoginCard === 'function') {
        showLoginCard();
    }
    
    showNotification('Game has been reset!', 'info');
}

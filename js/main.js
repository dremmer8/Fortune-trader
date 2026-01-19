// Main initialization and game loop

// ===========================================
// HUB / PHONE INTERFACE
// ===========================================

let gameStarted = false;
let isLoggedIn = false;
let playerName = '';
let playerId = '';

// ===========================================
// VERSION STAMP
// ===========================================

function formatVersionStamp(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `v${year}${month}${day}-${hour}${minute}`;
}

function updateVersionStamp() {
    const versionText = formatVersionStamp();
    const stamp = document.getElementById('versionStamp');
    if (stamp) {
        stamp.textContent = versionText;
    }

    const settingsVersion = document.getElementById('settingsVersionValue');
    if (settingsVersion) {
        settingsVersion.textContent = `Version ${versionText}`;
    }
}

function initVersionStamp() {
    updateVersionStamp();
    setInterval(updateVersionStamp, 60000);
}

function initAudioControls() {
    const slider = document.getElementById('audioVolumeSlider');
    const valueLabel = document.getElementById('audioVolumeValue');
    if (!slider || !valueLabel || typeof AudioManager === 'undefined') return;

    const updateLabel = (value) => {
        valueLabel.textContent = `${value}%`;
    };

    const initialValue = Math.round((AudioManager.masterVolume ?? 0.8) * 100);
    slider.value = String(initialValue);
    updateLabel(initialValue);

    slider.addEventListener('input', (event) => {
        const value = Number(event.target.value);
        AudioManager.setMasterVolume(value / 100);
        updateLabel(value);
    });
}

// ===========================================
// LOGIN CARD INTERFACE
// ===========================================

// Initialize login card events
function initLoginCard() {
    const nameInput = document.getElementById('cardHolderInput');
    const cvvInput = document.getElementById('cardCvvInput');
    const nextBtn = document.getElementById('cardNextBtn');
    const loginBtn = document.getElementById('cardLoginBtn');
    
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (nextBtn) {
                nextBtn.classList.toggle('active', value.length >= 2);
            }
        });
        
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim().length >= 2) {
                flipCardToBack();
            }
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            if (loginBtn) {
                loginBtn.classList.toggle('active', value.length >= 3);
            }
        });
        
        cvvInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim().length >= 3) {
                attemptLogin();
            }
        });
    }
}

// Flip card to back (after entering name)
function flipCardToBack() {
    const nameInput = document.getElementById('cardHolderInput');
    const cardWrapper = document.getElementById('cardWrapper');
    const signatureDisplay = document.getElementById('signatureDisplay');
    
    if (!nameInput || nameInput.value.trim().length < 2) return;
    
    // Play click sound
    AudioManager.playClick();
    
    playerName = nameInput.value.trim();
    
    // Update signature on back
    if (signatureDisplay) {
        signatureDisplay.textContent = playerName;
    }
    
    // Flip card
    if (cardWrapper) {
        cardWrapper.classList.add('flipped');
    }
    
    // Focus CVV input after flip
    setTimeout(() => {
        const cvvInput = document.getElementById('cardCvvInput');
        if (cvvInput) cvvInput.focus();
    }, 600);
}

// Flip card back to front
function flipCardToFront() {
    const cardWrapper = document.getElementById('cardWrapper');
    if (cardWrapper) {
        cardWrapper.classList.remove('flipped');
    }
    
    // Focus name input after flip
    setTimeout(() => {
        const nameInput = document.getElementById('cardHolderInput');
        if (nameInput) nameInput.focus();
    }, 600);
}

// Attempt to login
async function attemptLogin() {
    const cvvInput = document.getElementById('cardCvvInput');
    
    if (!cvvInput || cvvInput.value.trim().length < 3) {
        shakeLogin();
        AudioManager.playError();
        return;
    }

    const password = cvvInput.value.trim();
    playerId = await deriveUserId(playerName, password);
    isLoggedIn = true;
    
    // Play success sound
    AudioManager.playClick();
    
    // Save credentials to localStorage
    saveCredentials();
    
    // Update login time in Firebase (for statistics)
    if (typeof FirebaseService !== 'undefined') {
        await FirebaseService.updateLoginTime(playerId, playerName);
    }
    
    // Load game state (will check Firebase first, then localStorage)
    await loadGameState();
    
    // Hide login card
    const loginContainer = document.getElementById('loginCardContainer');
    if (loginContainer) {
        loginContainer.classList.add('hidden');
    }
    
    // Start expense system after login
    initExpenseSystem();
    
    // Update any displays that show player name
    updatePlayerDisplay();
    
    console.log(`Logged in as: ${playerName}`);
}

// Save credentials to localStorage
function saveCredentials() {
    try {
        const credentials = {
            playerName: playerName,
            playerId: playerId
        };
        localStorage.setItem('fortuneTraderCredentials', JSON.stringify(credentials));
    } catch (e) {
        console.error('Failed to save credentials:', e);
    }
}

// Load credentials from localStorage
function loadCredentials() {
    try {
        const saved = localStorage.getItem('fortuneTraderCredentials');
        if (saved) {
            const credentials = JSON.parse(saved);
            if (credentials.playerName) {
                return credentials;
            }
        }
    } catch (e) {
        console.error('Failed to load credentials:', e);
    }
    return null;
}

// Clear saved credentials
function clearCredentials() {
    try {
        localStorage.removeItem('fortuneTraderCredentials');
    } catch (e) {
        console.error('Failed to clear credentials:', e);
    }
}

// Shake login card on error
function shakeLogin() {
    const container = document.getElementById('loginCardContainer');
    if (container) {
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 400);
    }
}

// Update displays with player name
function updatePlayerDisplay() {
    // Could add player name display in banker app header, etc.
}

// Show login card (on fresh start or reset)
function showLoginCard() {
    isLoggedIn = false;
    playerName = '';
    playerId = '';
    
    const loginContainer = document.getElementById('loginCardContainer');
    const cardWrapper = document.getElementById('cardWrapper');
    const nameInput = document.getElementById('cardHolderInput');
    const cvvInput = document.getElementById('cardCvvInput');
    const nextBtn = document.getElementById('cardNextBtn');
    const loginBtn = document.getElementById('cardLoginBtn');
    
    // Reset card state
    if (cardWrapper) cardWrapper.classList.remove('flipped');
    if (nameInput) nameInput.value = '';
    if (cvvInput) cvvInput.value = '';
    if (nextBtn) nextBtn.classList.remove('active');
    if (loginBtn) loginBtn.classList.remove('active');
    
    // Show login
    if (loginContainer) {
        loginContainer.classList.remove('hidden');
    }
    
    // Focus name input
    setTimeout(() => {
        if (nameInput) nameInput.focus();
    }, 300);
}

// Update phone time display
function updatePhoneTime() {
    const phoneTimeEl = document.getElementById('phoneTime');
    if (phoneTimeEl) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        phoneTimeEl.textContent = `${hours}:${minutes}`;
    }
}

// Launch an app from the phone
function launchApp(appName) {
    // Must be logged in first (except for settings)
    if (!isLoggedIn && appName !== 'settings' && appName !== 'expenses' && appName !== 'leaderboard') {
        showLoginCard();
        return;
    }
    
    // Expenses app shows different view when not logged in
    if (appName === 'expenses' && !isLoggedIn) {
        showLoginCard();
        return;
    }
    
    if (appName === 'trader') {
        // Check if user has trading funds
        if (!hasTradingFunds()) {
            // Show locked overlay
            const lockedOverlay = document.getElementById('traderLockedOverlay');
            if (lockedOverlay) {
                lockedOverlay.classList.add('visible');
            }
            AudioManager.playError();
            return;
        }
        
        // Play trader app open sound
        AudioManager.playOpenTrader();
        
        // Add launch animation
        const traderApp = document.querySelector('.phone-app:first-child');
        if (traderApp) {
            traderApp.classList.add('launching');
        }
        
        // Delay game start for animation
        setTimeout(() => {
            startGame();
        }, 400);
    } else if (appName === 'banker') {
        AudioManager.playOpenApp();
        openBankerApp();
    } else if (appName === 'shop') {
        AudioManager.playOpenApp();
        openShopApp();
    } else if (appName === 'expenses') {
        AudioManager.playOpenApp();
        openExpensesApp();
    } else if (appName === 'leaderboard') {
        AudioManager.playOpenApp();
        openLeaderboardApp();
    } else if (appName === 'settings') {
        AudioManager.playOpenApp();
        openSettingsApp();
    }
}

// Open banker app
function openBankerApp() {
    const overlay = document.getElementById('bankerAppOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        updateBankerDisplay();
    }
}

// Close banker app
function closeBankerApp() {
    const overlay = document.getElementById('bankerAppOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
    updateTraderLockState();
}

// Open settings app
function openSettingsApp() {
    const overlay = document.getElementById('settingsAppOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        updateSettingsDisplay();
    }
}

// Close settings app
function closeSettingsApp() {
    const overlay = document.getElementById('settingsAppOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

function formatCompactNumber(value) {
    const number = Number(value) || 0;
    const absValue = Math.abs(number);
    if (absValue >= 1_000_000_000) {
        return `${(number / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    }
    if (absValue >= 1_000_000) {
        return `${(number / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (absValue >= 1_000) {
        return `${(number / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return number.toLocaleString();
}

// Update settings display
function updateSettingsDisplay() {
    const userNameEl = document.getElementById('settingsUserName');
    if (userNameEl) {
        userNameEl.textContent = playerName || 'Not logged in';
    }
}

// ===========================================
// LEADERBOARD APP
// ===========================================

async function openLeaderboardApp() {
    const overlay = document.getElementById('leaderboardAppOverlay');
    if (overlay) {
        overlay.classList.add('visible');
    }
    await loadLeaderboard();
}

function closeLeaderboardApp() {
    const overlay = document.getElementById('leaderboardAppOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

async function loadLeaderboard() {
    const statusEl = document.getElementById('leaderboardStatus');
    const listEl = document.getElementById('leaderboardList');
    const updatedEl = document.getElementById('leaderboardUpdated');

    if (statusEl) {
        statusEl.textContent = 'Loading leaderboard...';
    }
    if (listEl) {
        listEl.innerHTML = '';
    }
    if (updatedEl) {
        updatedEl.textContent = '';
    }

    if (typeof FirebaseService === 'undefined' || !FirebaseService.isAvailable()) {
        if (statusEl) {
            statusEl.textContent = 'Leaderboard unavailable (offline).';
        }
        return;
    }

    try {
        const result = await FirebaseService.getAllUserStats();
        if (!result.success) {
            if (statusEl) {
                statusEl.textContent = `Unable to load leaderboard: ${result.error || 'Unknown error'}`;
            }
            return;
        }

        const stats = result.stats || [];
        if (stats.length === 0) {
            if (statusEl) {
                statusEl.textContent = 'No players on the leaderboard yet.';
            }
            return;
        }

        const sortedStats = [...stats].sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));
        const topStats = sortedStats.slice(0, 10);
        if (statusEl) {
            statusEl.textContent = `Showing top ${topStats.length} of ${stats.length} players.`;
        }

        if (listEl) {
            const now = Date.now();
            listEl.innerHTML = topStats.map((player, index) => {
                const safeName = escapeHtml(player.playerName || 'Unknown');
                const rankNumber = index + 1;
                const rankEmoji = rankNumber === 1 ? '🥇' : rankNumber === 2 ? '🥈' : rankNumber === 3 ? '🥉' : '';

                return `
                    <div class="leaderboard-card">
                        <div class="leaderboard-rank">
                            <span class="leaderboard-rank-emoji">${rankEmoji}</span>
                            <span class="leaderboard-rank-number">#${rankNumber}</span>
                        </div>
                        <div class="leaderboard-player">
                            <div class="leaderboard-player-name">${safeName}</div>
                            <div class="leaderboard-player-stats">
                                <div class="leaderboard-stat">Balance <strong>$${formatCompactNumber(player.bankBalance)}</strong></div>
                                <div class="leaderboard-stat">Earnings <strong>$${formatCompactNumber(player.totalEarnings)}</strong></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (updatedEl) {
            updatedEl.textContent = `Updated ${new Date().toLocaleString()}`;
        }
    } catch (error) {
        if (statusEl) {
            statusEl.textContent = `Failed to load leaderboard: ${error.message}`;
        }
    }
}

// Derive a stable user ID from name + password without storing the password
async function deriveUserId(name, password) {
    const base = `${name}:${password}`;
    if (window.crypto && window.crypto.subtle) {
        const data = new TextEncoder().encode(base);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
    return btoa(unescape(encodeURIComponent(base))).replace(/=+$/, '');
}

// Switch to banker from locked overlay
function switchToBanker() {
    const lockedOverlay = document.getElementById('traderLockedOverlay');
    if (lockedOverlay) {
        lockedOverlay.classList.remove('visible');
    }
    openBankerApp();
}

// Close trader locked overlay
function closeTraderLocked() {
    const overlay = document.getElementById('traderLockedOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

// Update banker display
function updateBankerDisplay() {
    const bankBalanceEl = document.getElementById('bankBalanceDisplay');
    const lifetimeEl = document.getElementById('lifetimeEarnings');
    const roundsEl = document.getElementById('tradingRounds');
    const tradingBalanceEl = document.getElementById('tradingAccountBalance');
    const userNameEl = document.getElementById('bankerUserName');
    
    if (bankBalanceEl) bankBalanceEl.textContent = '$' + state.bankBalance.toLocaleString();
    if (lifetimeEl) lifetimeEl.textContent = '$' + state.totalEarnings.toLocaleString();
    if (roundsEl) roundsEl.textContent = state.tradingRounds.toString();
    if (tradingBalanceEl) {
        const portfolioValue = getTotalPortfolioValue();
        tradingBalanceEl.textContent = '$' + Math.floor(portfolioValue).toLocaleString();
    }
    if (userNameEl && playerName) {
        userNameEl.textContent = playerName;
    }
}

// Set deposit amount from preset
function setDepositAmount(amount) {
    const input = document.getElementById('depositAmountInput');
    if (input) {
        input.value = amount;
    }
}

// Deposit all bank balance
function depositAll() {
    const input = document.getElementById('depositAmountInput');
    if (input) {
        input.value = state.bankBalance;
    }
}

// Execute deposit
function executeDeposit() {
    const input = document.getElementById('depositAmountInput');
    if (!input) return;
    
    const amount = parseInt(input.value) || 0;
    const result = depositToTrading(amount);
    
    if (result.success) {
        AudioManager.playClick();
        showNotification(result.message, 'success');
        updateBankerDisplay();
        updateTraderLockState();
        input.value = '';
    } else {
        showNotification(result.message, 'error');
    }
}

// Update trader app lock state
function updateTraderLockState() {
    const traderApp = document.getElementById('traderAppIcon');
    if (traderApp) {
        if (hasTradingFunds()) {
            traderApp.classList.remove('locked');
        } else {
            traderApp.classList.add('locked');
        }
    }
}

// Close any phone overlays
function closePhoneOverlays() {
    closeBankerApp();
    closeTraderLocked();
    closeShopApp();
    closeExpensesApp();
    closeLeaderboardApp();
    closeSettingsApp();
}

// ===========================================
// SHOP APP
// ===========================================

let currentShopCategory = 'estate';

// Open shop app (luxury shop)
function openShopApp() {
    const overlay = document.getElementById('shopAppOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        updateLuxuryShopDisplay();
        renderLuxuryShopItems();
    }
}

// Close shop app
function closeShopApp() {
    const overlay = document.getElementById('shopAppOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

// Filter shop by category
function filterShopCategory(category) {
    currentShopCategory = category;
    
    // Update tab active state
    document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    
    renderLuxuryShopItems();
}

// Update luxury shop display
function updateLuxuryShopDisplay() {
    const balanceEl = document.getElementById('shopBalanceAmount');
    if (balanceEl) {
        balanceEl.textContent = Math.floor(state.bankBalance).toLocaleString();
    }
    
    renderOwnedLuxuryItems();
}

// Render owned luxury items
function renderOwnedLuxuryItems() {
    const container = document.getElementById('shopOwnedList');
    const section = document.getElementById('shopOwnedSection');
    
    if (!container || !section) return;
    
    if (state.ownedItems.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = state.ownedItems.map(item => `
        <div class="shop-owned-item">
            <div class="shop-owned-item-icon">${item.icon}</div>
            <div class="shop-owned-item-info">
                <div class="shop-owned-item-name">${item.name}</div>
                <div class="shop-owned-item-desc">${item.description}</div>
            </div>
            <div class="shop-owned-badge">OWNED</div>
        </div>
    `).join('');
}

// Render luxury shop items
function renderLuxuryShopItems() {
    const container = document.getElementById('shopItemsList');
    if (!container) return;
    
    const filteredItems = SHOP_ITEMS.filter(item => item.category === currentShopCategory);
    
    container.innerHTML = filteredItems.map(item => {
        const owned = state.ownedItems.some(ownedItem => ownedItem.id === item.id);
        const locked = state.tradingRounds < item.prestigeRequired;
        const canAfford = state.bankBalance >= item.price;
        
        let statusClass = '';
        let buttonText = 'Buy';
        let buttonDisabled = false;
        
        if (owned) {
            statusClass = 'owned';
            buttonText = 'Owned';
            buttonDisabled = true;
        } else if (locked) {
            statusClass = 'locked';
            buttonText = 'Locked';
            buttonDisabled = true;
        } else if (!canAfford) {
            buttonDisabled = true;
            buttonText = 'Buy';
        }
        
        return `
            <div class="shop-item ${statusClass}">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-desc">${item.description}</div>
                </div>
                <div class="shop-item-price">
                    <div class="shop-item-price-value">$${item.price.toLocaleString()}</div>
                    ${item.prestigeRequired > 0 ? `<div class="shop-item-req">${item.prestigeRequired} rounds</div>` : ''}
                </div>
                <button class="shop-buy-btn" ${buttonDisabled ? 'disabled' : ''} onclick="buyShopItem('${item.id}')">${buttonText}</button>
            </div>
        `;
    }).join('');
}

// Buy shop item
function buyShopItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    // Check if already owned
    if (state.ownedItems.some(ownedItem => ownedItem.id === itemId)) {
        return;
    }
    
    // Check prestige requirement
    if (state.tradingRounds < item.prestigeRequired) {
        showNotification(`Requires ${item.prestigeRequired} prestige rounds!`, 'error');
        return;
    }
    
    // Check if can afford
    if (state.bankBalance < item.price) {
        showNotification('Insufficient funds!', 'error');
        return;
    }
    
    // Play click sound for purchase
    AudioManager.playClick();
    
    // Deduct price from bank balance
    state.bankBalance -= item.price;
    
    // Add to owned items
    state.ownedItems.push({
        id: item.id,
        name: item.name,
        category: item.category,
        icon: item.icon,
        price: item.price,
        description: item.description
    });
    
    // Save game state
    saveGameState();
    
    // Update displays
    updateLuxuryShopDisplay();
    updateBankerDisplay();
    updateExpensesDisplay();
    renderExpensesList();
    renderLuxuryShopItems();
    
    // Show notification
    let message = `Purchased ${item.name} for $${item.price.toLocaleString()}!`;
    if (item.category === 'estate') {
        message += ' Rent expense eliminated!';
    } else if (item.category === 'car') {
        message += ' Transport expense eliminated!';
    }
    
    showNotification(message, 'success');
}

// ===========================================
// EXPENSES APP
// ===========================================

let midnightCheckInterval = null;

// Get current date as YYYY-MM-DD string
function getTodayDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Calculate days between two date strings (YYYY-MM-DD)
function getDaysBetween(dateStr1, dateStr2) {
    if (!dateStr1 || !dateStr2) return 0;
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    const diffTime = Math.abs(date2 - date1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Open expenses app
function openExpensesApp() {
    const overlay = document.getElementById('expensesAppOverlay');
    if (overlay) {
        overlay.classList.add('visible');
        renderExpensesList();
        updateExpensesDisplay();
    }
}

// Close expenses app
function closeExpensesApp() {
    const overlay = document.getElementById('expensesAppOverlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

// Render expenses list
function renderExpensesList() {
    const container = document.getElementById('expensesList');
    if (!container) return;
    
    container.innerHTML = DAILY_EXPENSES.map(expense => {
        // Check if this expense is eliminated by an owned item
        let isEliminated = false;
        if (expense.canEliminate && expense.eliminatedBy) {
            isEliminated = state.ownedItems.some(item => 
                item.category === expense.eliminatedBy
            );
        }
        
        const classNames = [];
        if (!expense.enabled) classNames.push('disabled');
        if (isEliminated) classNames.push('disabled');
        
        // Get current amount (custom or default)
        const currentAmount = state.customExpenseAmounts[expense.id] !== undefined 
            ? state.customExpenseAmounts[expense.id] 
            : expense.amount;
        
        return `
            <div class="expense-item ${classNames.join(' ')}">
                <div class="expense-icon">${expense.icon}</div>
                <div class="expense-info">
                    <div class="expense-name">${expense.name}</div>
                    <div class="expense-desc">${isEliminated ? '✅ Eliminated!' : expense.description}</div>
                </div>
                ${isEliminated ? 
                    '<div class="expense-amount">FREE</div>' : 
                    `<div class="expense-amount-controls">
                        <button class="expense-adjust-btn" onclick="adjustExpense('${expense.id}', -1)">-</button>
                        <input type="number" 
                               class="expense-amount-input" 
                               value="${currentAmount}" 
                               min="${expense.amount}"
                               max="999"
                               onchange="setExpenseAmount('${expense.id}', this.value)"
                               onclick="event.stopPropagation()">
                        <button class="expense-adjust-btn" onclick="adjustExpense('${expense.id}', 1)">+</button>
                    </div>`
                }
            </div>
        `;
    }).join('');
}

// Adjust expense amount
function adjustExpense(expenseId, delta) {
    const expense = DAILY_EXPENSES.find(e => e.id === expenseId);
    if (!expense) return;
    
    const currentAmount = state.customExpenseAmounts[expenseId] !== undefined 
        ? state.customExpenseAmounts[expenseId] 
        : expense.amount;
    
    const newAmount = Math.max(expense.amount, Math.min(999, currentAmount + delta));
    
    if (newAmount !== currentAmount) {
        state.customExpenseAmounts[expenseId] = newAmount;
        saveGameState();
        renderExpensesList();
        updateExpensesDisplay();
    }
}

// Set expense amount directly
function setExpenseAmount(expenseId, value) {
    const expense = DAILY_EXPENSES.find(e => e.id === expenseId);
    if (!expense) return;
    
    const amount = parseInt(value) || expense.amount;
    const clampedAmount = Math.max(expense.amount, Math.min(999, amount));
    
    state.customExpenseAmounts[expenseId] = clampedAmount;
    saveGameState();
    renderExpensesList();
    updateExpensesDisplay();
}

// Update expenses display
function updateExpensesDisplay() {
    const totalEl = document.getElementById('expensesTotalAmount');
    const countdownEl = document.getElementById('expensesCountdown');
    const lastPaidEl = document.getElementById('expensesLastPaid');
    
    if (totalEl) {
        const total = getTotalDailyExpenses(state.ownedItems, state.customExpenseAmounts);
        totalEl.textContent = '-$' + total;
    }
    
    if (countdownEl) {
        // Calculate time until midnight
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight - now;
        const hoursLeft = Math.floor(msUntilMidnight / (1000 * 60 * 60));
        const minsLeft = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
        countdownEl.textContent = `${hoursLeft}h ${minsLeft}m`;
    }
}

// Initialize expense system on login
function initExpenseSystem() {
    const today = getTodayDateString();
    const lastExpenseDate = state.lastExpenseDate;
    
    // If no previous expense date, set to today (first login)
    if (!lastExpenseDate) {
        state.lastExpenseDate = today;
        saveGameState();
        console.log('First login - expense tracking started');
        return;
    }
    
    // Calculate days since last expense charge
    const daysMissed = getDaysBetween(lastExpenseDate, today);
    
    if (daysMissed > 0) {
        const totalExpenses = getTotalDailyExpenses(state.ownedItems, state.customExpenseAmounts);
        const missedAmount = daysMissed * totalExpenses;
        
        if (missedAmount > 0) {
            state.bankBalance -= missedAmount;
            state.lastExpenseDate = today;
            saveGameState();
            updateBankerDisplay();
            
            console.log(`Charged ${daysMissed} days of expenses: -$${missedAmount}`);
            
            // Show notification for missed expenses
            setTimeout(() => {
                showExpenseNotification(missedAmount, daysMissed);
            }, 1000);
        }
    }
    
    // Start midnight check to charge at day change
    startMidnightCheck();
}

// Start checking for midnight (day change)
function startMidnightCheck() {
    if (midnightCheckInterval) {
        clearInterval(midnightCheckInterval);
    }
    
    // Check every minute for day change
    midnightCheckInterval = setInterval(() => {
        checkForDayChange();
    }, 60000); // Check every minute
}

// Check if day has changed and charge expenses
function checkForDayChange() {
    if (!isLoggedIn) return;
    
    const today = getTodayDateString();
    
    if (state.lastExpenseDate !== today) {
        chargeExpenses();
    }
}

// Charge expenses for a new day
function chargeExpenses() {
    if (!isLoggedIn) return;
    
    const totalExpenses = getTotalDailyExpenses(state.ownedItems, state.customExpenseAmounts);
    if (totalExpenses <= 0) return;
    
    const today = getTodayDateString();
    
    // Deduct from bank balance
    state.bankBalance -= totalExpenses;
    
    // Update last expense date
    state.lastExpenseDate = today;
    
    // Save state
    saveGameState();
    
    // Update displays
    updateBankerDisplay();
    updateExpensesDisplay();
    
    // Show notification
    showExpenseNotification(totalExpenses, 1);
    
    // Check if bankrupt
    if (state.bankBalance < 0) {
        console.log('Bank balance is negative! Debt: $' + Math.abs(state.bankBalance));
    }
}

// Show expense deduction notification
function showExpenseNotification(amount, days = 1) {
    // Create notification element if it doesn't exist
    let notif = document.getElementById('expenseNotification');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'expenseNotification';
        notif.className = 'expense-notification';
        document.body.appendChild(notif);
    }
    
    if (days > 1) {
        notif.textContent = `${days} days expenses: -$${amount}`;
    } else {
        notif.textContent = `Daily expenses: -$${amount}`;
    }
    notif.classList.add('show');
    
    setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}

// Start the game (hide hub, show game)
function startGame() {
    const hubScreen = document.getElementById('hubScreen');
    const appContainer = document.getElementById('appContainer');
    const phoneToggleBtn = document.getElementById('phoneToggleBtn');
    
    if (hubScreen) {
        hubScreen.classList.add('hidden');
    }
    if (appContainer) {
        appContainer.classList.remove('hidden');
    }
    if (phoneToggleBtn) {
        // Show the toggle button after a short delay
        setTimeout(() => {
            phoneToggleBtn.classList.add('visible');
        }, 500);
    }
    
    if (!gameStarted) {
        gameStarted = true;
        // Initialize the actual game
        initGameSystems();
    }
}

// Toggle phone visibility during gameplay
function togglePhone() {
    const hubScreen = document.getElementById('hubScreen');
    const appContainer = document.getElementById('appContainer');
    const phoneToggleBtn = document.getElementById('phoneToggleBtn');
    const phoneHint = document.getElementById('phoneHint');
    
    if (!hubScreen) return;
    
    const isHubVisible = !hubScreen.classList.contains('hidden');
    
    if (isHubVisible && gameStarted) {
        // Hide phone, return to game
        hubScreen.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');
        if (phoneToggleBtn) phoneToggleBtn.classList.add('visible');
    } else if (gameStarted) {
        // Show phone
        hubScreen.classList.remove('hidden');
        if (appContainer) appContainer.classList.add('hidden');
        if (phoneToggleBtn) phoneToggleBtn.classList.remove('visible');
        
        // Show the hint now that game has started
        if (phoneHint) phoneHint.classList.add('visible');
        
        // Reset any launching animations
        const launchingApps = document.querySelectorAll('.phone-app.launching');
        launchingApps.forEach(app => app.classList.remove('launching'));
        
        // Close any open overlays and update state
        closePhoneOverlays();
        updateTraderLockState();
        updateBankerDisplay();
    }
}

// ===========================================
// PRESTIGE SYSTEM
// ===========================================

// Show prestige confirmation
function confirmPrestige() {
    const portfolioValue = getTotalPortfolioValue();
    
    if (portfolioValue <= 0) {
        showNotification('No funds to cash out', 'error');
        return;
    }
    
    // Calculate fee and amount after fee
    const fee = getCashOutFee(portfolioValue);
    const amountAfterFee = portfolioValue - fee;
    const netProfit = amountAfterFee - state.initialDeposit;
    
    // Update modal display
    const portfolioEl = document.getElementById('prestigePortfolioValue');
    const feeEl = document.getElementById('prestigeFee');
    const netProfitEl = document.getElementById('prestigeNetProfit');
    const receiveEl = document.getElementById('prestigeReceive');
    const profitRow = document.getElementById('prestigeProfitRow');
    
    if (portfolioEl) portfolioEl.textContent = '$' + Math.floor(portfolioValue).toLocaleString();
    if (feeEl) feeEl.textContent = '-$' + Math.floor(fee).toLocaleString();
    if (netProfitEl) {
        const profitPrefix = netProfit >= 0 ? '+$' : '-$';
        netProfitEl.textContent = profitPrefix + Math.abs(Math.floor(netProfit)).toLocaleString();
    }
    if (receiveEl) receiveEl.textContent = '$' + Math.floor(amountAfterFee).toLocaleString();
    
    // Update profit row styling
    if (profitRow) {
        profitRow.classList.remove('positive', 'negative');
        profitRow.classList.add(netProfit >= 0 ? 'positive' : 'negative');
    }
    
    // Show modal
    document.getElementById('prestigeBackdrop')?.classList.add('open');
    document.getElementById('prestigeModal')?.classList.add('open');
}

// Cancel prestige
function cancelPrestige() {
    document.getElementById('prestigeBackdrop')?.classList.remove('open');
    document.getElementById('prestigeModal')?.classList.remove('open');
}

// Execute prestige
function executePrestige() {
    const result = prestigeToBank();
    
    if (result.success) {
        AudioManager.playClick();
        cancelPrestige();
        
        // Show success notification
        showNotification(result.message, 'success');
        
        // Update UI
        updateBalanceDisplay();
        renderDeals();
        renderPositions();
        renderStockHolding();
        renderCookieInventory();
        updateComboCounter();
        
        // Return to phone
        togglePhone();
    } else {
        showNotification(result.message, 'error');
    }
}

// Initialize hub screen
async function initHub() {
    // Start phone time update
    updatePhoneTime();
    setInterval(updatePhoneTime, 1000);
    
    // Hide app container initially
    const appContainer = document.getElementById('appContainer');
    if (appContainer) {
        appContainer.classList.add('hidden');
    }
    
    // Initialize login card
    initLoginCard();
    
    // Check for saved credentials
    const savedCredentials = loadCredentials();
    if (savedCredentials) {
        // Auto-login with saved credentials
        playerName = savedCredentials.playerName;
        if (savedCredentials.playerId) {
            playerId = savedCredentials.playerId;
            isLoggedIn = true;
        } else if (savedCredentials.playerPassword) {
            playerId = await deriveUserId(playerName, savedCredentials.playerPassword);
            isLoggedIn = true;
            saveCredentials();
        }
    }

    if (isLoggedIn) {
        // Update login time in Firebase
        if (typeof FirebaseService !== 'undefined') {
            await FirebaseService.updateLoginTime(playerId, playerName);
        }
        
        // Load game state (checks Firebase first, then localStorage)
        await loadGameState();
        
        // Hide login card
        const loginContainer = document.getElementById('loginCardContainer');
        if (loginContainer) {
            loginContainer.classList.add('hidden');
        }
        
        // Start expense system
        initExpenseSystem();
        updatePlayerDisplay();
        
        console.log(`Auto-logged in as: ${playerName}`);
    } else {
        // Show login card on first load
        showLoginCard();
    }
    
    // Update trader lock state based on current funds
    updateTraderLockState();
    updateBankerDisplay();
    
    // Add keyboard shortcut to toggle phone (Escape key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameStarted) {
                togglePhone();
            } else {
                // Close any open overlays in phone
                closePhoneOverlays();
            }
        }
    });
}

// Show/hide chart loading overlay
function showChartLoading(show) {
    const overlay = document.getElementById('chartLoadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Data source change handler
// Charts are already running in background - this just switches which one is displayed
function changeDataSource(source) {
    const status = document.getElementById('sourceStatus');
    const assetName = document.getElementById('assetName');
    const assetTag = document.getElementById('assetTag');
    const config = stockConfig[source];
    
    state.dataMode = source;
    assetName.textContent = config.name;
    assetTag.textContent = config.tag;
    
    // Clear time frame cache for this symbol (will regenerate on demand)
    clearTimeFrameCache(source);
    
    // Reset to LIVE time frame when switching stocks
    state.currentTimeFrame = 'LIVE';
    
    // Update time frame button UI
    document.querySelectorAll('.time-frame-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.frame === 'LIVE') {
            btn.classList.add('active');
        }
    });
    
    // Charts are pre-initialized and running in background
    // Just sync the active state to global state
    if (state.chartPrices[source]) {
        const prices = state.chartPrices[source];
        state.currentPrice = prices.currentPrice;
        state.targetPrice = prices.targetPrice;
        // Set displayPrice to currentPrice to avoid interpolation jump on switch
        // (displayPrice was stale from when we last viewed this chart)
        state.displayPrice = prices.currentPrice;
        // Also update stored displayPrice
        prices.displayPrice = prices.currentPrice;
    }
    
    if (state.chartSimState[source]) {
        state.sim = state.chartSimState[source];
    }
    
    // Show LIVE status
    status.textContent = 'LIVE';
    status.classList.add('live');
    
    showChartLoading(false);
    
    // Re-render deals and positions to show only current stock
    renderDeals();
    renderPositions();
    renderStockHolding();
}

// Smooth animation loop using requestAnimationFrame
let lastPnlUpdate = 0;
let lastTimerUpdate = 0;

function smoothAnimationLoop() {
    const now = Date.now();
    
    // Smooth price interpolation (vertical movement only, stays at right edge)
    state.displayPrice = state.displayPrice + (state.targetPrice - state.displayPrice) * 0.12;
    
    // Smooth balance interpolation
    const balanceDiff = state.balance - state.displayBalance;
    if (Math.abs(balanceDiff) > 0.01) {
        state.displayBalance += balanceDiff * 0.1;
    }
    
    // Always update portfolio display (includes stock holdings that change with price)
    updateBalanceDisplay();
    
    // Update price display smoothly
    const priceEl = document.getElementById('currentPrice');
    priceEl.textContent = '$' + state.displayPrice.toFixed(2);
    
    // Update timer bars smoothly (every frame for continuous countdown)
    // Also updates bet lock button states
    updateTimerDisplays(now);
    
    // Update PnL displays every 100ms for smooth transitions
    if (now - lastPnlUpdate > 100) {
        updatePnLDisplays();
        lastPnlUpdate = now;
    }
    
    // Redraw chart with interpolated values
    drawChartSmooth();
    
    state.animationFrameId = requestAnimationFrame(smoothAnimationLoop);
}

// Reset simulation state for fresh start
function resetSimulationState() {
    state.sim = createFreshSimState();
}

// Create a fresh simulation state object
function createFreshSimState() {
    return {
        volatility: 1,
        volatilityTarget: 1,
        trend: 0,
        trendDuration: 0,
        supports: [],
        resistances: [],
        isConsolidating: false,
        consolidationTicks: 0,
        consolidationCenter: 0,
        consolidationRange: 0,
        breakoutDirection: 0,
        breakoutStrength: 0,
        candle: {
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            ticksInCandle: 0
        },
        candleHistory: [],
        recentHigh: 0,
        recentLow: Infinity
    };
}

// Generate simulated historical prices for a symbol using deterministic seeded RNG
// Returns { history: [{value, timestamp}], simState: {...}, lastPrice: number }
// This ensures the same prices are generated regardless of when/where the page is loaded
// by always simulating from tick 0
function generateSimulatedHistory(symbol, pointCount = CHART_VISIBLE_POINTS) {
    const config = stockConfig[symbol];
    const basePrice = config ? config.basePrice : 100;
    const currentTick = getCurrentTickNumber();
    const history = [];
    
    // Start from the oldest tick we need to display
    const displayStartTick = currentTick - pointCount + 1;
    
    // CRITICAL: Always simulate from epoch start to ensure deterministic results
    // This ensures the same accumulated state regardless of when page is loaded
    // Epochs reset every SIM_EPOCH_SIZE ticks (~5.5 hours) to limit computation
    const currentEpoch = Math.floor(currentTick / SIM_EPOCH_SIZE);
    const epochStartTick = currentEpoch * SIM_EPOCH_SIZE;
    
    // Create simulation state
    const tempSim = createFreshSimState();
    let currentPrice = basePrice;
    
    // Initialize candle
    tempSim.candle.open = currentPrice;
    tempSim.candle.high = currentPrice;
    tempSim.candle.low = currentPrice;
    tempSim.candle.close = currentPrice;
    tempSim.recentHigh = currentPrice;
    tempSim.recentLow = currentPrice;
    
    // Simulate from epoch start to current tick
    // This ensures deterministic state by always starting from the same point
    for (let tick = epochStartTick; tick <= currentTick; tick++) {
        // Create seeded RNG for this specific tick
        const rng = createTickRNG(symbol, tick);
        const cfg = simConfigCache;
        
        // Volatility clustering (deterministic)
        if (rng() < cfg.volatilityChangeChance) {
            if (rng() < cfg.volatilityHighEventChance) {
                tempSim.volatilityTarget = cfg.volatilityHighMin + rng() * (cfg.volatilityHighMax - cfg.volatilityHighMin);
            } else {
                tempSim.volatilityTarget = cfg.volatilityNormalMin + rng() * (cfg.volatilityNormalMax - cfg.volatilityNormalMin);
            }
        }
        tempSim.volatility = tempSim.volatility * 0.9 + tempSim.volatilityTarget * 0.1;
        
        // Trend (deterministic)
        if (tempSim.trendDuration <= 0) {
            tempSim.trend = (rng() - 0.5) * 2;
            tempSim.trendDuration = Math.floor(rng() * 15) + 5;
        }
        tempSim.trendDuration--;
        
        // Calculate price change
        const baseVolatility = currentPrice * cfg.baseVolatility;
        const volatility = baseVolatility * tempSim.volatility;
        
        // Seeded Gaussian noise
        const gaussian = seededGaussian(rng);
        const noise = gaussian * volatility * cfg.noiseWeight;
        
        // Trend effect
        const trendEffect = tempSim.trend * volatility * cfg.trendWeight;
        
        // Mean reversion
        const deviation = (currentPrice - basePrice) / basePrice;
        const meanReversion = -deviation * currentPrice * cfg.meanReversionWeight;
        
        // Apply changes
        currentPrice = currentPrice + noise + trendEffect + meanReversion;
        currentPrice = Math.max(basePrice * 0.7, Math.min(basePrice * 1.3, currentPrice));
        
        // Only store points for the visible chart range
        if (tick >= displayStartTick) {
            const timestamp = getTimeForTickNumber(tick);
            history.push({
                value: currentPrice,
                timestamp: timestamp
            });
        }
    }
    
    // Return history AND the final simulation state
    return {
        history: history,
        simState: tempSim,
        lastPrice: currentPrice
    };
}

// ===========================================
// TIME FRAME CHART GENERATION
// ===========================================
// Generate history for different time frames (1H, 1D, 1W, 1M, 1Y)
// Uses coarse simulation for performance - simulates at point granularity not tick granularity
// Smoothly transitions to current live price at the end

function generateTimeFrameHistory(symbol, timeFrame, targetPrice = null) {
    const tf = TIME_FRAMES[timeFrame];
    const config = stockConfig[symbol];
    const basePrice = config ? config.basePrice : 100;
    const rawHistory = [];
    
    // Get current live price to transition to
    const livePrice = targetPrice || (state.chartPrices[symbol] ? state.chartPrices[symbol].currentPrice : basePrice);
    
    // Get the anchor tick (current time aligned to time frame boundary)
    const currentTick = getCurrentTickNumber();
    const anchorTick = Math.floor(currentTick / tf.ticksPerPoint) * tf.ticksPerPoint;
    
    // Calculate start tick for this time frame
    const startTick = anchorTick - (tf.displayPoints * tf.ticksPerPoint);
    
    // Create simulation state for this time frame
    const tempSim = createFreshSimState();
    let price = basePrice;
    
    // Use scaled volatility for this time frame
    const volatilityScale = tf.volatilityScale || 1.0;
    const cfg = simConfigCache;
    
    // Simulate each point in the time frame
    for (let i = 0; i < tf.displayPoints; i++) {
        const pointTick = startTick + (i * tf.ticksPerPoint);
        
        // Create a seeded RNG for this specific time frame point
        // Use a different seed space to avoid conflicts with live simulation
        const rng = createCoarseTickRNG(symbol, timeFrame, i);
        
        // Volatility clustering
        if (rng() < cfg.volatilityChangeChance) {
            if (rng() < cfg.volatilityHighEventChance) {
                tempSim.volatilityTarget = cfg.volatilityHighMin + rng() * (cfg.volatilityHighMax - cfg.volatilityHighMin);
            } else {
                tempSim.volatilityTarget = cfg.volatilityNormalMin + rng() * (cfg.volatilityNormalMax - cfg.volatilityNormalMin);
            }
        }
        tempSim.volatility = tempSim.volatility * 0.9 + tempSim.volatilityTarget * 0.1;
        
        // Trend
        if (tempSim.trendDuration <= 0) {
            tempSim.trend = (rng() - 0.5) * 2;
            tempSim.trendDuration = Math.floor(rng() * 15) + 5;
        }
        tempSim.trendDuration--;
        
        // Calculate price change with scaled volatility for time frame
        const effectiveVolatility = cfg.baseVolatility * volatilityScale;
        const baseVol = price * effectiveVolatility;
        const volatility = baseVol * tempSim.volatility;
        
        // Seeded Gaussian noise
        const gaussian = seededGaussian(rng);
        const noise = gaussian * volatility * cfg.noiseWeight;
        
        // Trend effect
        const trendEffect = tempSim.trend * volatility * cfg.trendWeight;
        
        // Mean reversion (stronger for longer time frames to keep prices realistic)
        const meanReversionScale = Math.min(1 + (volatilityScale * 0.3), 3);
        const deviation = (price - basePrice) / basePrice;
        const meanReversion = -deviation * price * cfg.meanReversionWeight * meanReversionScale;
        
        // Apply changes
        price = price + noise + trendEffect + meanReversion;
        
        // Clamp to range (wider for longer time frames)
        const clampRange = Math.min(0.3 + (volatilityScale * 0.05), 0.5);
        price = Math.max(basePrice * (1 - clampRange), Math.min(basePrice * (1 + clampRange), price));
        
        // Add to raw history
        const timestamp = getTimeForTickNumber(pointTick);
        rawHistory.push({
            value: price,
            timestamp: timestamp
        });
    }
    
    // Natural transition to current live price
    // Instead of smooth blending, apply a drift correction with realistic noise
    const transitionPoints = Math.floor(tf.displayPoints * 0.25); // Last 25%
    const simulatedEndPrice = rawHistory[rawHistory.length - 1].value;
    const priceGap = livePrice - simulatedEndPrice;
    
    // If the gap is small, don't adjust
    if (Math.abs(priceGap / livePrice) < 0.005) {
        return rawHistory;
    }
    
    // Create seeded RNG for transition noise (deterministic)
    const transitionRng = createCoarseTickRNG(symbol, timeFrame + '_transition', 0);
    
    // Apply drift correction with noise across the transition zone
    const history = rawHistory.map((point, i) => {
        const distanceFromEnd = rawHistory.length - 1 - i;
        
        if (distanceFromEnd < transitionPoints) {
            // Progress through transition (0 at start, 1 at end)
            const progress = 1 - (distanceFromEnd / transitionPoints);
            
            // Cumulative drift - gradual shift toward target
            // Use quadratic for slightly accelerating drift (natural momentum)
            const driftFactor = progress * progress;
            const baseDrift = priceGap * driftFactor;
            
            // Add realistic noise that diminishes toward the end
            // This keeps volatility but ensures we hit the target
            const noiseScale = (1 - progress) * 0.4; // Noise decreases as we approach end
            const volatility = point.value * cfg.baseVolatility * volatilityScale;
            
            // Use deterministic noise based on point index
            const noiseRng = createCoarseTickRNG(symbol, timeFrame + '_noise', i);
            const noise1 = noiseRng();
            const noise2 = noiseRng();
            // Box-Muller for Gaussian
            const gaussian = Math.sqrt(-2 * Math.log(noise1 + 0.0001)) * Math.cos(2 * Math.PI * noise2);
            const priceNoise = gaussian * volatility * noiseScale;
            
            const adjustedPrice = point.value + baseDrift + priceNoise;
            return { value: adjustedPrice, timestamp: point.timestamp };
        }
        
        return point;
    });
    
    // Ensure the very last point is exactly the live price
    if (history.length > 0) {
        history[history.length - 1].value = livePrice;
    }
    
    return history;
}

// Get or generate time frame history for a symbol
function getTimeFrameHistory(symbol, timeFrame) {
    // LIVE frame uses the real-time chartHistory
    if (timeFrame === 'LIVE') {
        return state.chartHistory[symbol] || [];
    }
    
    // Get current live price for smooth transition
    const livePrice = state.chartPrices[symbol] ? state.chartPrices[symbol].currentPrice : null;
    
    // Initialize cache structure if needed
    if (!state.timeFrameHistory[symbol]) {
        state.timeFrameHistory[symbol] = {};
    }
    
    // Check if we need to regenerate (cache miss or price changed significantly)
    const cached = state.timeFrameHistory[symbol][timeFrame];
    const needsRegeneration = !cached || 
        (livePrice && cached.length > 0 && 
         Math.abs(cached[cached.length - 1].value - livePrice) / livePrice > 0.001); // >0.1% change
    
    if (needsRegeneration) {
        state.timeFrameHistory[symbol][timeFrame] = generateTimeFrameHistory(symbol, timeFrame, livePrice);
    }
    
    return state.timeFrameHistory[symbol][timeFrame];
}

// Clear time frame cache for a symbol (call when switching symbols or on refresh)
function clearTimeFrameCache(symbol) {
    if (symbol) {
        delete state.timeFrameHistory[symbol];
    } else {
        state.timeFrameHistory = {};
    }
}

// Change the active time frame
function changeTimeFrame(timeFrame) {
    if (!TIME_FRAMES[timeFrame]) {
        console.error('Invalid time frame:', timeFrame);
        return;
    }
    
    const previousFrame = state.currentTimeFrame;
    state.currentTimeFrame = timeFrame;
    
    // Update UI buttons
    document.querySelectorAll('.time-frame-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.frame === timeFrame) {
            btn.classList.add('active');
        }
    });
    
    // Update the status indicator
    const status = document.getElementById('sourceStatus');
    const tf = TIME_FRAMES[timeFrame];
    
    if (timeFrame === 'LIVE') {
        status.textContent = 'LIVE';
        status.classList.add('live');
    } else {
        status.textContent = tf.label;
        status.classList.remove('live');
    }
    
    // Get history for this time frame
    const symbol = state.dataMode;
    const history = getTimeFrameHistory(symbol, timeFrame);
    
    // For non-LIVE frames, we show historical data
    // The current price and display price stay the same (from LIVE)
    // but the chart shows the time frame history
    
    // Update the chart to render with new time frame data
    // The chart will use getActiveHistory() which checks currentTimeFrame
    
    console.log(`Switched to ${timeFrame} for ${symbol}, ${history.length} points`);
}

// Get the active history based on current time frame
function getActiveHistory() {
    return getTimeFrameHistory(state.dataMode, state.currentTimeFrame);
}

// Track last processed tick per symbol to prevent duplicate processing
const lastProcessedTick = {};

// Initialize a chart for a symbol with simulated history
function initializeChart(symbol) {
    const config = stockConfig[symbol];
    const basePrice = config ? config.basePrice : 100;
    
    // Generate simulated history (uses deterministic seeded RNG)
    // This returns the history AND the final simulation state for continuity
    const result = generateSimulatedHistory(symbol, CHART_VISIBLE_POINTS);
    
    // Store in chartHistory
    state.chartHistory[symbol] = result.history;
    
    // Store prices
    const lastPrice = result.lastPrice;
    state.chartPrices[symbol] = {
        currentPrice: lastPrice,
        displayPrice: lastPrice,
        targetPrice: lastPrice
    };
    
    // Use the simulation state from history generation for continuity
    // This ensures future ticks continue from the correct state
    state.chartSimState[symbol] = result.simState;
    
    // Mark the current tick as processed so we don't immediately reprocess
    lastProcessedTick[symbol] = getCurrentTickNumber();
}

// Update price for a specific symbol (background update)
// IMPORTANT: This processes ALL missed ticks to maintain determinism
function updateSymbolPrice(symbol) {
    const config = stockConfig[symbol];
    if (!config) return;
    
    const currentTick = getCurrentTickNumber();
    const lastTick = lastProcessedTick[symbol];
    
    // Skip if we already processed this tick for this symbol
    if (lastTick === currentTick) {
        return null; // No update needed
    }
    
    // Get or create chart state for this symbol
    // Also re-initialize if lastTick is somehow undefined
    if (!state.chartPrices[symbol] || lastTick === undefined) {
        initializeChart(symbol);
        return null; // initializeChart already set up everything
    }
    
    const prices = state.chartPrices[symbol];
    const history = state.chartHistory[symbol] || [];
    let simState = state.chartSimState[symbol];
    
    if (!simState) {
        simState = createFreshSimState();
        state.chartSimState[symbol] = simState;
    }
    
    const previousPrice = prices.currentPrice;
    
    // CRITICAL: Process ALL missed ticks to maintain determinism
    // If timer skipped ticks due to browser throttling, we need to catch up
    const startTick = lastTick + 1;
    let currentPrice = prices.currentPrice;
    
    for (let tick = startTick; tick <= currentTick; tick++) {
        // Simulate this tick with its specific RNG
        currentPrice = simulatePriceForTick(symbol, simState, currentPrice, config.basePrice, tick);
        
        // Add to history
        const tickTimestamp = getTimeForTickNumber(tick);
        history.push({ value: currentPrice, timestamp: tickTimestamp });
    }
    
    // Trim history if too long
    while (history.length > 200) {
        history.shift();
    }
    
    // Mark current tick as processed
    lastProcessedTick[symbol] = currentTick;
    
    // Update prices
    prices.currentPrice = currentPrice;
    prices.targetPrice = currentPrice;
    prices.displayPrice = currentPrice;
    
    state.chartHistory[symbol] = history;
    
    return { previousPrice, newPrice: currentPrice };
}

// Simulate a single tick for a symbol - used for catching up missed ticks
// This MUST match the logic in generateSimulatedHistory exactly
function simulatePriceForTick(symbol, simState, currentPrice, basePrice, tick) {
    const cfg = simConfigCache;
    const sim = simState;
    const rng = createTickRNG(symbol, tick);
    
    // Volatility clustering - MUST match history generation exactly
    if (rng() < cfg.volatilityChangeChance) {
        if (rng() < cfg.volatilityHighEventChance) {
            sim.volatilityTarget = cfg.volatilityHighMin + rng() * (cfg.volatilityHighMax - cfg.volatilityHighMin);
        } else {
            sim.volatilityTarget = cfg.volatilityNormalMin + rng() * (cfg.volatilityNormalMax - cfg.volatilityNormalMin);
        }
    }
    sim.volatility = sim.volatility * 0.9 + sim.volatilityTarget * 0.1;
    
    // Trend - MUST match history generation exactly
    if (sim.trendDuration <= 0) {
        sim.trend = (rng() - 0.5) * 2;
        sim.trendDuration = Math.floor(rng() * 15) + 5;
    }
    sim.trendDuration--;
    
    // Calculate price change
    const baseVolatility = currentPrice * cfg.baseVolatility;
    const volatility = baseVolatility * sim.volatility;
    
    // Seeded Gaussian noise
    const gaussian = seededGaussian(rng);
    const noise = gaussian * volatility * cfg.noiseWeight;
    
    // Trend effect
    const trendEffect = sim.trend * volatility * cfg.trendWeight;
    
    // Mean reversion
    const deviation = (currentPrice - basePrice) / basePrice;
    const meanReversion = -deviation * currentPrice * cfg.meanReversionWeight;
    
    // Calculate new price
    let newPrice = currentPrice + noise + trendEffect + meanReversion;
    
    // Clamp to range - MUST match history generation
    newPrice = Math.max(basePrice * 0.7, Math.min(basePrice * 1.3, newPrice));
    
    return newPrice;
}

// Update ALL charts in background, only render active one
function updateAllCharts() {
    const now = Date.now();
    
    // Update all symbols
    Object.keys(stockConfig).forEach(symbol => {
        updateSymbolPrice(symbol);
    });
    
    // Sync active chart state to global state
    const activeSymbol = state.dataMode;
    if (state.chartPrices[activeSymbol]) {
        const prices = state.chartPrices[activeSymbol];
        const previousPrice = state.currentPrice;
        
        state.currentPrice = prices.currentPrice;
        state.targetPrice = prices.targetPrice;
        state.lastPriceUpdate = now;
        
        // Sync sim state
        if (state.chartSimState[activeSymbol]) {
            state.sim = state.chartSimState[activeSymbol];
        }
        
        // Add tick animation class for active chart only
        const priceEl = document.getElementById('currentPrice');
        if (priceEl) {
            const tickClass = state.currentPrice > previousPrice ? 'tick-up' : 'tick-down';
            priceEl.classList.remove('tick-up', 'tick-down');
            void priceEl.offsetWidth;
            priceEl.classList.add(tickClass);
            setTimeout(() => priceEl.classList.remove(tickClass), 150);
        }
        
        // Play chart tick sound (subtle)
        AudioManager.playTickOfChart();
        
        // Update price change percentage for active chart
        const chartPrices = state.prices;
        const changePercent = chartPrices.length > 1 
            ? ((state.currentPrice / chartPrices[chartPrices.length - 2] - 1) * 100)
            : 0;
        const changeEl = document.getElementById('priceChange');
        if (changeEl) {
            changeEl.textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
            changeEl.className = 'price-change ' + (changePercent >= 0 ? 'up' : 'down');
        }
    }
}

// Get prophecy effects (volatility multiplier + trend bias) for a specific symbol
// This is used during price simulation for each chart
function getProphecyEffectsForSymbol(symbol) {
    const now = Date.now();
    let volatilityMultiplier = 1;
    let trendBias = 0;
    let hasSpike = false;
    let hasCalm = false;
    let spikeValue = 1;
    let calmValue = 1;
    let prophecyCount = 0;
    
    if (!state.deals) return { volatilityMultiplier, trendBias };
    
    state.deals.forEach(prophecy => {
        if (prophecy.resolved || prophecy.targetStock !== symbol) return;
        
        const elapsed = (now - prophecy.startTime) / 1000;
        const remaining = Math.max(0, prophecy.duration - elapsed);
        if (remaining <= 0) return;
        
        const timeWeight = remaining / prophecy.duration;
        
        // Trend prophecies
        if (prophecy.prophecyType === 'trendUp') {
            const avgStrength = (prophecy.strengthMin + prophecy.strengthMax) / 2 / 100;
            trendBias += avgStrength * timeWeight;
            prophecyCount++;
        } else if (prophecy.prophecyType === 'trendDown') {
            const avgStrength = (prophecy.strengthMin + prophecy.strengthMax) / 2 / 100;
            trendBias -= avgStrength * timeWeight;
            prophecyCount++;
        }
        // Volatility prophecies - check if in time window
        else if (prophecy.prophecyType === 'volatilitySpike') {
            if (elapsed >= prophecy.windowStart && elapsed <= prophecy.windowEnd) {
                hasSpike = true;
                spikeValue = Math.max(spikeValue, prophecy.trueVolatility);
            }
        } else if (prophecy.prophecyType === 'volatilityCalm') {
            if (elapsed >= prophecy.windowStart && elapsed <= prophecy.windowEnd) {
                hasCalm = true;
                calmValue = Math.min(calmValue, prophecy.trueVolatility);
            }
        }
    });
    
    // Normalize trend bias
    if (prophecyCount > 0) {
        trendBias = trendBias / prophecyCount;
    }
    
    // Apply volatility multipliers - spike takes priority over calm
    if (hasSpike) {
        volatilityMultiplier = spikeValue;
    } else if (hasCalm) {
        volatilityMultiplier = calmValue;
    }
    
    return { volatilityMultiplier, trendBias };
}

// Legacy wrapper for volatility only
function getVolatilityMultiplierForSymbol(symbol) {
    return getProphecyEffectsForSymbol(symbol).volatilityMultiplier;
}

// Calculate all prophecy effects for current stock
function calculateProphecyEffects() {
    const now = Date.now();
    const effects = {
        trendBias: 0,
        lowerShore: null,
        upperShore: null,
        inevitableZones: [],
        volatilityMultiplier: 1,
        activeProphecyCount: 0
    };
    
    state.deals.forEach(prophecy => {
        if (prophecy.resolved || prophecy.targetStock !== state.dataMode) return;
        
        const elapsed = (now - prophecy.startTime) / 1000;
        const remaining = Math.max(0, prophecy.duration - elapsed);
        if (remaining <= 0) return;
        
        effects.activeProphecyCount++;
        const timeWeight = remaining / prophecy.duration;
        
        switch (prophecy.prophecyType) {
            case 'trendUp': {
                const avgStrength = (prophecy.strengthMin + prophecy.strengthMax) / 2 / 100;
                effects.trendBias += avgStrength * timeWeight;
                break;
            }
            case 'trendDown': {
                const avgStrength = (prophecy.strengthMin + prophecy.strengthMax) / 2 / 100;
                effects.trendBias -= avgStrength * timeWeight;
                break;
            }
            case 'lowerShore': {
                // Use the true floor value
                if (!effects.lowerShore || prophecy.trueValue > effects.lowerShore) {
                    effects.lowerShore = prophecy.trueValue;
                }
                break;
            }
            case 'upperShore': {
                // Use the true ceiling value
                if (!effects.upperShore || prophecy.trueValue < effects.upperShore) {
                    effects.upperShore = prophecy.trueValue;
                }
                break;
            }
            case 'inevitableZone': {
                effects.inevitableZones.push({
                    target: prophecy.trueValue,
                    remaining: remaining,
                    duration: prophecy.duration,
                    prophecy: prophecy
                });
                break;
            }
            case 'volatilitySpike': {
                // Check if we're in the time window
                if (elapsed >= prophecy.windowStart && elapsed <= prophecy.windowEnd) {
                    effects.volatilityMultiplier = Math.max(effects.volatilityMultiplier, prophecy.trueVolatility);
                }
                break;
            }
            case 'volatilityCalm': {
                // Check if we're in the time window
                if (elapsed >= prophecy.windowStart && elapsed <= prophecy.windowEnd) {
                    effects.volatilityMultiplier = Math.min(effects.volatilityMultiplier, prophecy.trueVolatility);
                }
                break;
            }
        }
    });
    
    // Normalize trend bias if multiple prophecies
    if (effects.activeProphecyCount > 0) {
        effects.trendBias = effects.trendBias / Math.max(1, effects.activeProphecyCount);
    }
    
    return effects;
}

// Price simulation - generates new target price
// Main price update function - updates ALL charts in background
function updatePrice() {
    // Update all charts in background
    updateAllCharts();
    
    // Apply prophecy effects to active chart only
    applyProphecyEffectsToActiveChart();
}

// Apply prophecy effects (shores, zones) to the currently active chart
function applyProphecyEffectsToActiveChart() {
    const prophecyEffects = calculateProphecyEffects();
    const activeSymbol = state.dataMode;
    
    if (!state.chartPrices[activeSymbol]) return;
    
    let currentPrice = state.chartPrices[activeSymbol].currentPrice;
    let modified = false;
    
    // Apply shore constraints (enforce floor/ceiling)
    // Use seeded RNG for determinism
    const currentTick = getCurrentTickNumber();
    const rng = createTickRNG(activeSymbol + '_prophecy', currentTick);
    
    if (prophecyEffects.lowerShore !== null && currentPrice < prophecyEffects.lowerShore) {
        currentPrice = prophecyEffects.lowerShore + rng() * currentPrice * 0.001;
        modified = true;
    }
    if (prophecyEffects.upperShore !== null && currentPrice > prophecyEffects.upperShore) {
        currentPrice = prophecyEffects.upperShore - rng() * currentPrice * 0.001;
        modified = true;
    }
    
    // Apply inevitable zone magnetism
    prophecyEffects.inevitableZones.forEach(zone => {
        if (!zone.prophecy.touched) {
            const distanceToZone = zone.target - currentPrice;
            const urgency = 1 - (zone.remaining / zone.duration);
            // Use magnetism strength from prophecy config (default 0.25)
            const magnetismStrength = zone.prophecy.magnetismStrength || 0.25;
            // Stronger pull that increases with urgency
            const pullStrength = urgency * urgency * magnetismStrength;
            currentPrice += distanceToZone * pullStrength;
            modified = true;
            
            // Check if price is within the actual interval bounds
            const intervalMin = zone.prophecy.intervalMin;
            const intervalMax = zone.prophecy.intervalMax;
            if (currentPrice >= intervalMin && currentPrice <= intervalMax) {
                zone.prophecy.touched = true;
            }
        }
    });
    
    // Update if modified
    if (modified) {
        state.chartPrices[activeSymbol].currentPrice = currentPrice;
        state.chartPrices[activeSymbol].targetPrice = currentPrice;
        state.currentPrice = currentPrice;
        state.targetPrice = currentPrice;
        
        // Update last history point
        const history = state.chartHistory[activeSymbol];
        if (history && history.length > 0) {
            history[history.length - 1].value = currentPrice;
        }
    }
}

// Initialize game systems (called when Fortune Trader app is launched)
function initGameSystems() {
    // Game state already loaded in initHub
    const hasLoadedSave = state.balance > 0 || state.purchasedUpgrades.length > 0;
    
    // Populate stock selector dropdown from config
    const sourceSelect = document.getElementById('sourceSelect');
    sourceSelect.innerHTML = '';
    
    const initialSymbol = Object.keys(stockConfig)[0]; // First stock in config
    
    Object.keys(stockConfig).forEach(key => {
        const config = stockConfig[key];
        const option = document.createElement('option');
        option.value = key;
        option.textContent = config.name;
        if (key === initialSymbol) {
            option.selected = true;
        }
        sourceSelect.appendChild(option);
    });
    
    // Setup canvas
    initChart();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize ALL charts with simulated history
    console.log('Initializing all charts with simulated history...');
    Object.keys(stockConfig).forEach(symbol => {
        initializeChart(symbol);
        console.log(`Initialized chart for ${symbol}`);
    });
    
    // Ensure chart data is properly loaded for initial symbol
    if (!state.chartHistory[initialSymbol] || state.chartHistory[initialSymbol].length === 0) {
        console.warn(`No chart history for ${initialSymbol}, re-initializing...`);
        initializeChart(initialSymbol);
    }
    
    state.displayBalance = state.balance;
    
    // Start game loops - updatePrice now updates ALL charts
    setInterval(updatePrice, 2000); // Update all charts every 2 seconds
    setInterval(updateDeals, 1000);
    setInterval(updatePositions, 1000);
    
    // Auto-save every 30 seconds
    setInterval(autoSave, 30000);
    
    // Use changeDataSource to properly set up the initial stock display
    // This ensures all state is synced correctly and chart is rendered
    changeDataSource(initialSymbol);
    
    // Start smooth animation loop (only renders active chart)
    smoothAnimationLoop();
    updateBalanceDisplay();
    updateComboCounter();
    
    // Initialize cookie inventory display
    renderCookieInventory();
    
    // Render shop items from config
    renderShopItems();
    
    // Render purchased upgrades in navbar
    renderPurchasedUpgrades();
    
    // Update cookie tier prices from config
    updateCookieTierPrices();
    
    // Update shop item states if we loaded upgrades
    if (hasLoadedSave) {
        updateShopItemStates();
    }
    
    // Re-render UI elements for initial stock
    renderDeals();
    renderPositions();
    renderStockHolding();
    
    console.log('All charts initialized and running in background');
}

// Initialize the application (hub first)
function initApp() {
    initVersionStamp();
    initAudioControls();
    // Initialize the hub/phone interface first
    initHub();
    console.log('Hub initialized - waiting for app selection');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

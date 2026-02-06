// Tutorial module - Step-by-step guide for trading basics

let tutorialOpen = false;
let currentTutorialStep = 0;
let highlightOverlay = null;
let tutorialButtonPreview = null;

// Tutorial steps based on BEGINNERS_MANUAL.md basics
const tutorialSteps = [
    {
        title: "Welcome to Fortune Trader",
        icon: "🎮",
        highlightElement: null, // No highlight for welcome
        content: `
            <p>Welcome! This tutorial will teach you the basics of trading in Fortune Trader.</p>
            <p>You'll learn how to read the chart, place trades, use fortune cookies, and understand the interface.</p>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">💡 Tip</div>
                <div class="tutorial-highlight-box-content">You can close this tutorial anytime and reopen it from the Tutorial button in the navigation bar.</div>
            </div>
        `
    },
    {
        title: "The Chart & Price Display",
        icon: "📈",
        highlightElement: ".chart-container", // Highlight the chart
        content: `
            <p>The <strong>chart</strong> shows the real-time price movement of the selected stock. The price updates every 2 seconds (1 tick).</p>
            <p>In the chart header, you'll see:</p>
            <ul>
                <li><strong>Stock Name</strong> - The current stock symbol (APLS, LOOGL, MASFT, etc.)</li>
                <li><strong>Current Price</strong> - The live price of the stock</li>
                <li><strong>Price Change</strong> - How much the price has changed (green = up, red = down)</li>
                <li><strong>Time Frame Selector</strong> - Switch between Live, 1H, 1D, 1W, 1M, 1Y views</li>
            </ul>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">📊 Chart Features</div>
                <div class="tutorial-highlight-box-content">You can click on the right edge of the chart (within 20px) to place position predictions - betting that the price will touch a specific range within 20 seconds!</div>
            </div>
        `
    },
    {
        title: "Trading Basics - Long & Short",
        icon: "⚡",
        highlightElement: ".trade-buttons", // Highlight trading buttons
        content: `
            <p><strong>Long Position</strong> - Bet that the price will go UP</p>
            <ul>
                <li>Click "Long" button (or press <code>A</code>)</li>
                <li>Your bet amount is deducted from balance</li>
                <li>Position lasts for 2 seconds</li>
                <li>If price goes UP → You win 2x your bet (double your money)</li>
                <li>If price goes DOWN or stays same → You lose your bet</li>
            </ul>
            <p><strong>Short Position</strong> - Bet that the price will go DOWN</p>
            <ul>
                <li>Click "Short" button (or press <code>D</code>)</li>
                <li>Your bet amount is deducted from balance</li>
                <li>Position lasts for 2 seconds</li>
                <li>If price goes DOWN → You win 2x your bet</li>
                <li>If price goes UP or stays same → You lose your bet</li>
            </ul>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">⏱️ Bet Lock</div>
                <div class="tutorial-highlight-box-content">After placing a bet, you must wait 2 seconds before placing another bet.</div>
            </div>
        `
    },
    {
        title: "Bet Amounts & Win Streaks",
        icon: "🔥",
        highlightElement: "#streakStat", // Highlight streak display
        content: `
            <p>Your <strong>bet amount</strong> determines how much you risk on each trade.</p>
            <p><strong>Win Streak System:</strong></p>
            <ul>
                <li>Start with default bet amounts: $50, $100, $150, $200</li>
                <li><strong>Win Streak:</strong> Each win increases your bet to the next tier</li>
                <li><strong>Loss:</strong> Resets bet to the first tier ($50)</li>
            </ul>
            <p>You can see your current streak and bet amount in the navigation bar at the top.</p>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">💰 Bet Combo Upgrades</div>
                <div class="tutorial-highlight-box-content">Purchase Bet Combo upgrades from the Cookie Shop to unlock higher bet amounts ($150-$1000).</div>
            </div>
        `
    },
    {
        title: "Fortune Cookies & Prophecies",
        icon: "🥠",
        highlightElement: "#cookieBuyBtn", // Highlight cookie purchase button
        content: `
            <p><strong>Fortune Cookies</strong> contain prophecies that reveal future price movements!</p>
            <p><strong>How to Purchase:</strong></p>
            <ol>
                <li>Open the <strong>Cookie Shop</strong> (right panel)</li>
                <li>Click the cookie purchase button to buy a cookie</li>
                <li>Cookie is added to your stash below</li>
            </ol>
            <p><strong>How to Decode Prophecies:</strong></p>
            <ol>
                <li><strong>Drag a cookie</strong> from your stash to the "Signal Reveal" area (center panel)</li>
                <li><strong>Click the cookie</strong> 6 times to unwrap it (you'll see an animation)</li>
                <li>After unwrapping, the prophecy appears in the <strong>Active Prophecies</strong> panel (left side)</li>
                <li>The prophecy shows <strong>encrypted symbols</strong> (scrambled text) - this is the prophecy information</li>
                <li><strong>Type the fortune text</strong> that appears below the encrypted symbols</li>
                <li>As you type <strong>correctly</strong>, encrypted symbols are revealed one by one</li>
                <li>When you finish typing (or all symbols are revealed), the prophecy <strong>activates automatically</strong>!</li>
            </ol>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">⌨️ Typing Tips</div>
                <div class="tutorial-highlight-box-content">
                    <ul style="margin: 8px 0; padding-left: 20px;">
                        <li>Type the fortune text letter by letter (spaces are skipped automatically)</li>
                        <li>Wrong keys will show an error - just keep typing the correct letters</li>
                        <li>Each correct letter reveals one encrypted symbol</li>
                        <li>You can see your progress as more symbols get revealed</li>
                    </ul>
                </div>
            </div>
            <p><strong>Prophecy Types:</strong></p>
            <ul>
                <li><strong>Trend Up/Down</strong> - Price will trend in that direction for 25-35 seconds</li>
                <li><strong>Shore</strong> - Price stays within a safe range (floor and ceiling)</li>
                <li><strong>Inevitable Zone</strong> - Price will definitely touch a specific zone</li>
                <li><strong>Volatility Spike/Calm</strong> - High or low volatility periods</li>
            </ul>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">🎯 Strategy Tip</div>
                <div class="tutorial-highlight-box-content">Use prophecies to time your trades! Open Long positions during Trend Up prophecies, and Short positions during Trend Down prophecies.</div>
            </div>
        `
    },
    {
        title: "Active Prophecies Panel",
        icon: "✨",
        highlightElement: ".deals-panel", // Highlight active prophecies panel
        content: `
            <p>The <strong>Active Prophecies</strong> panel (left side) shows all currently active prophecies.</p>
            <p>Each prophecy displays:</p>
            <ul>
                <li>Prophecy type and icon</li>
                <li>Target stock (if applicable)</li>
                <li>Time remaining</li>
                <li>Visual indicators on the chart (like trend lines, zones, etc.)</li>
            </ul>
            <p>Watch this panel to know when prophecies are active and plan your trades accordingly!</p>
        `
    },
    {
        title: "Navigation & Balance",
        icon: "💵",
        highlightElement: ".nav-stats", // Highlight navigation stats
        content: `
            <p>The <strong>navigation bar</strong> at the top shows important information:</p>
            <ul>
                <li><strong>Cash</strong> - Your current trading account balance</li>
                <li><strong>Streak & Bet</strong> - Your win streak and current bet amount</li>
                <li><strong>Portfolio</strong> - View all your positions and stocks</li>
                <li><strong>Cash Out</strong> - Transfer profits back to your bank (5% fee)</li>
            </ul>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">🏦 Banking</div>
                <div class="tutorial-highlight-box-content">Press <code>ESC</code> to open the phone interface, then use Baker's Bank to deposit money from your bank to your trading account. You need at least $100 to deposit.</div>
            </div>
        `
    },
    {
        title: "Stock Trading (Optional)",
        icon: "📊",
        highlightElement: null, // Don't highlight - show preview in center instead
        showButtons: "stock", // Show stock trading buttons in center
        content: `
            <p><strong>Stock Trading</strong> lets you buy and hold stocks for long-term gains.</p>
            <p><strong>To unlock:</strong> Purchase "Stock Trading Unlock" upgrade ($2,500) from Cookie Shop</p>
            <p><strong>How it works:</strong></p>
            <ul>
                <li>Click "Buy Stock" (or press <code>Space</code>) to purchase shares</li>
                <li>Shares = Your bet amount ÷ current stock price</li>
                <li>$25 fee per transaction (encourages bulk buying)</li>
                <li>Hold stocks and sell when profitable</li>
                <li>Click "Sell All Stock" to sell all shares of current stock</li>
            </ul>
            <p>Your stock holdings are shown in the chart header and Portfolio.</p>
        `
    },
    {
        title: "Margin Trading (Advanced)",
        icon: "⚡",
        highlightElement: null, // Don't highlight - show preview in center instead
        showButtons: "margin", // Show margin trading buttons in center
        content: `
            <p><strong>Margin Trading</strong> offers high-risk, high-reward trading with multipliers (25x-55x).</p>
            <p><strong>To unlock:</strong> Purchase "Margin Trading Unlock" upgrade ($5,000) from Cookie Shop</p>
            <p><strong>How it works:</strong></p>
            <ul>
                <li>Click "Long Margin" or "Short Margin" (or press <code>Z</code>/<code>C</code>)</li>
                <li><strong>Phase 1 (25 ticks):</strong> Position is LOCKED - you cannot close it</li>
                <li><strong>Phase 2 (25 ticks):</strong> Position is CLOSABLE - you can close anytime</li>
                <li>After Phase 2: Position auto-closes</li>
                <li>Profit = Bet Amount × (Price Change %) × Multiplier</li>
            </ul>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">⚠️ Warning</div>
                <div class="tutorial-highlight-box-content">Margin trading is high risk! Small price movements = big profits/losses. Use with fortune cookie prophecies for better timing.</div>
            </div>
        `
    },
    {
        title: "Keyboard Shortcuts",
        icon: "⌨️",
        highlightElement: null, // No specific element
        content: `
            <p>Use these keyboard shortcuts for faster trading:</p>
            <ul>
                <li><code>ESC</code> - Toggle phone interface during gameplay</li>
                <li><code>A</code> - Open Long position</li>
                <li><code>D</code> - Open Short position</li>
                <li><code>Space</code> - Buy Stock (if unlocked)</li>
                <li><code>Z</code> - Long Margin (if unlocked)</li>
                <li><code>C</code> - Short Margin (if unlocked)</li>
            </ul>
        `
    },
    {
        title: "Getting Started Tips",
        icon: "💡",
        highlightElement: null, // No specific element
        content: `
            <p><strong>Beginner Strategy:</strong></p>
            <ol>
                <li>Start with small deposits ($100-$250) from Baker's Bank</li>
                <li>Master Long/Short positions first</li>
                <li>Buy fortune cookies and decode them for trading insights</li>
                <li>Don't bet your entire balance on one trade</li>
                <li>Cash out regularly to transfer profits to your bank</li>
            </ol>
            <div class="tutorial-highlight-box">
                <div class="tutorial-highlight-box-title">🎯 Pro Tip</div>
                <div class="tutorial-highlight-box-content">Combine fortune cookie prophecies with your trades for better success rates. Trend Up prophecies work great with Long positions!</div>
            </div>
            <p>You're ready to start trading! Good luck! 🚀</p>
        `
    }
];

// Toggle tutorial overlay
function toggleTutorial() {
    tutorialOpen = !tutorialOpen;
    const overlay = document.getElementById('tutorialOverlay');
    const backdrop = document.getElementById('tutorialBackdrop');
    
    if (!overlay || !backdrop) {
        console.error('Tutorial overlay elements not found');
        return;
    }
    
    if (tutorialOpen) {
        currentTutorialStep = 0;
        renderTutorialStep();
        overlay.classList.add('open');
        backdrop.classList.add('open');
        createHighlightOverlay();
    } else {
        overlay.classList.remove('open');
        backdrop.classList.remove('open');
        removeHighlight();
        removeTutorialButtonPreview();
    }
}

// Close tutorial
function closeTutorial() {
    tutorialOpen = false;
    const overlay = document.getElementById('tutorialOverlay');
    const backdrop = document.getElementById('tutorialBackdrop');
    overlay.classList.remove('open');
    backdrop.classList.remove('open');
    removeHighlight();
    removeTutorialButtonPreview();
}

// Render current tutorial step
function renderTutorialStep() {
    const stepContainer = document.getElementById('tutorialStep');
    const stepNumber = document.getElementById('tutorialStepNumber');
    const totalSteps = document.getElementById('tutorialTotalSteps');
    const prevBtn = document.getElementById('tutorialPrevBtn');
    const nextBtn = document.getElementById('tutorialNextBtn');
    const overlay = document.getElementById('tutorialOverlay');
    
    if (!stepContainer || currentTutorialStep < 0 || currentTutorialStep >= tutorialSteps.length) {
        return;
    }
    
    const step = tutorialSteps[currentTutorialStep];
    const stepTitle = (typeof t === 'function' ? t('tutorial.step' + currentTutorialStep + '_title') : step.title);
    stepContainer.innerHTML = `
        <div class="tutorial-step-title">
            <span class="tutorial-step-icon">${step.icon}</span>
            ${stepTitle}
        </div>
        <div class="tutorial-step-content">
            ${step.content}
        </div>
    `;
    
    if (stepNumber) {
        stepNumber.textContent = currentTutorialStep + 1;
    }
    if (totalSteps) {
        totalSteps.textContent = tutorialSteps.length;
    }
    
    // Update navigation buttons
    if (prevBtn) {
        prevBtn.disabled = currentTutorialStep === 0;
    }
    if (nextBtn) {
        nextBtn.textContent = currentTutorialStep === tutorialSteps.length - 1
            ? (typeof t === 'function' ? t('modals.finish') : 'Finish')
            : (typeof t === 'function' ? t('modals.next') : 'Next');
    }
    
    // Always remove previous highlight first
    removeHighlight();
    
    // Reset panel positioning first
    if (overlay) {
        // Clear all positioning classes and inline styles
        overlay.classList.remove('positioned-left', 'positioned-right', 'positioned-top', 'positioned-bottom');
        overlay.style.top = '';
        overlay.style.left = '';
        overlay.style.right = '';
        overlay.style.width = '';
        overlay.style.maxWidth = '';
        overlay.style.transform = '';
    }
    
    // Handle showing buttons in center if needed
    if (step.showButtons) {
        // Only remove preview if it's a different button type
        if (tutorialButtonPreview) {
            const currentType = tutorialButtonPreview.querySelector('.stock-trade-buttons') ? 'stock' : 
                               tutorialButtonPreview.querySelector('.margin-trade-buttons') ? 'margin' : null;
            if (currentType !== step.showButtons) {
                removeTutorialButtonPreview();
            }
        }
        // Show button preview (will create new one or keep existing if same type)
        showTutorialButtonPreview(step.showButtons);
        // Position panel to the left side so buttons in center are visible
        if (overlay) {
            overlay.classList.add('positioned-left');
            overlay.style.top = '50%';
            overlay.style.left = '20px';
            overlay.style.right = 'auto';
            overlay.style.transform = 'translateY(-50%)';
            overlay.style.width = '380px';
            overlay.style.maxWidth = 'calc(50vw - 250px)';
        }
    } else {
        // Remove button preview if this step doesn't show buttons
        removeTutorialButtonPreview();
    }
    
    // Handle highlighting and panel positioning
    if (step.highlightElement) {
        // Small delay to ensure previous highlight is removed
        setTimeout(() => {
            highlightElement(step.highlightElement);
        }, 100);
    } else {
        // No highlight - check if this is a step after margin/stock
        // Stock is step 8 (index 7), Margin is step 9 (index 8)
        // So steps after are indices 9 and 10 (Keyboard Shortcuts and Getting Started Tips)
        const isAfterMarginStock = currentTutorialStep >= 9;
        
        if (overlay && !step.showButtons) {
            if (isAfterMarginStock) {
                // Center the panel for steps after margin/stock
                overlay.classList.remove('positioned-left', 'positioned-right', 'positioned-top', 'positioned-bottom');
                overlay.style.top = '50%';
                overlay.style.left = '50%';
                overlay.style.right = 'auto';
                overlay.style.transform = 'translate(-50%, -50%)';
                overlay.style.width = '400px';
                overlay.style.maxWidth = '90vw';
            } else {
                // Default position (right side) for other steps
                overlay.classList.add('positioned-right');
            }
        }
        removeHighlight();
    }
}

// Navigate to next step
function tutorialNext() {
    // Remove highlight and button preview before changing steps
    removeHighlight();
    removeTutorialButtonPreview();
    
    if (currentTutorialStep < tutorialSteps.length - 1) {
        currentTutorialStep++;
        renderTutorialStep();
    } else {
        // Last step - close tutorial
        closeTutorial();
    }
}

// Navigate to previous step
function tutorialPrevious() {
    // Remove highlight and button preview before changing steps
    removeHighlight();
    removeTutorialButtonPreview();
    
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        renderTutorialStep();
    }
}

// Create highlight overlay
function createHighlightOverlay() {
    if (highlightOverlay) {
        return; // Already exists
    }
    
    highlightOverlay = document.createElement('div');
    highlightOverlay.id = 'tutorialHighlightOverlay';
    highlightOverlay.className = 'tutorial-highlight-overlay';
    document.body.appendChild(highlightOverlay);
}

// Highlight a specific element
function highlightElement(selector) {
    // First, ensure any previous highlights are removed
    removeHighlight();
    
    if (!highlightOverlay) {
        createHighlightOverlay();
    }
    
    const element = document.querySelector(selector);
    if (!element) {
        // Element not found, remove highlight
        removeHighlight();
        return;
    }
    
    const overlay = document.getElementById('tutorialOverlay');
    if (!overlay) return;
    
    // Get element position
    const rect = element.getBoundingClientRect();
    const padding = 10; // Padding around highlighted element
    
    // Add highlight class to element (only one element should be highlighted)
    element.classList.add('tutorial-highlighted');
    
    // Create spotlight effect using CSS variables
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.setProperty('--highlight-x', `${Math.max(0, rect.left - padding)}px`);
    highlightOverlay.style.setProperty('--highlight-y', `${Math.max(0, rect.top - padding)}px`);
    highlightOverlay.style.setProperty('--highlight-width', `${rect.width + padding * 2}px`);
    highlightOverlay.style.setProperty('--highlight-height', `${rect.height + padding * 2}px`);
    
    // Position panel to avoid covering the highlighted element
    positionPanelForHighlight(rect, overlay);
    
    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    
    // Update highlight and panel position after scroll animation
    setTimeout(() => {
        // Double-check element still exists and is still the highlighted one
        if (element.classList.contains('tutorial-highlighted')) {
            const updatedRect = element.getBoundingClientRect();
            const padding = 10;
            highlightOverlay.style.setProperty('--highlight-x', `${Math.max(0, updatedRect.left - padding)}px`);
            highlightOverlay.style.setProperty('--highlight-y', `${Math.max(0, updatedRect.top - padding)}px`);
            highlightOverlay.style.setProperty('--highlight-width', `${updatedRect.width + padding * 2}px`);
            highlightOverlay.style.setProperty('--highlight-height', `${updatedRect.height + padding * 2}px`);
            
            // Reposition panel after scroll
            positionPanelForHighlight(updatedRect, overlay);
        }
    }, 300);
}

// Position tutorial panel to avoid covering highlighted element
function positionPanelForHighlight(elementRect, overlay) {
    if (!overlay) return;
    
    const panelRect = overlay.getBoundingClientRect();
    const panelWidth = 400; // Panel width when positioned to side
    const panelHeight = overlay.offsetHeight || 600; // Approximate panel height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20; // Margin from edges
    
    // Calculate element center
    const elementCenterX = elementRect.left + elementRect.width / 2;
    const elementCenterY = elementRect.top + elementRect.height / 2;
    
    // Determine best position for panel
    let position = 'right'; // default
    
    // Check if element is on the right side of screen
    if (elementCenterX > viewportWidth / 2) {
        // Element is on right, position panel on left
        position = 'left';
    } else {
        // Element is on left, position panel on right
        position = 'right';
    }
    
    // Check vertical position - if element is too high or low, adjust
    let topPosition = '50%';
    const elementTop = elementRect.top;
    const elementBottom = elementRect.bottom;
    
    // If element is in upper half, position panel lower
    if (elementTop < viewportHeight / 3) {
        topPosition = '60%';
    } 
    // If element is in lower half, position panel higher
    else if (elementBottom > viewportHeight * 2 / 3) {
        topPosition = '40%';
    }
    
    // Apply positioning
    overlay.classList.remove('positioned-left', 'positioned-right', 'positioned-top', 'positioned-bottom');
    overlay.classList.add(`positioned-${position}`);
    
    // Set custom top position if needed (using inline style for transform)
    if (topPosition !== '50%') {
        overlay.style.top = topPosition;
        overlay.style.transform = `translateY(calc(-1 * ${topPosition})) scale(1)`;
    } else {
        overlay.style.top = '50%';
        overlay.style.transform = 'translateY(-50%) scale(1)';
    }
}

// Remove highlight
function removeHighlight() {
    // Remove highlight class from all elements
    document.querySelectorAll('.tutorial-highlighted').forEach(el => {
        el.classList.remove('tutorial-highlighted');
    });
    
    // Hide overlay
    if (highlightOverlay) {
        highlightOverlay.style.display = 'none';
    }
}

// Close tutorial on ESC key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && tutorialOpen) {
        closeTutorial();
    }
});

// Show button preview in center of screen
function showTutorialButtonPreview(buttonType) {
    // Only remove if it's a different type or doesn't exist
    if (tutorialButtonPreview) {
        const currentType = tutorialButtonPreview.querySelector('.stock-trade-buttons') ? 'stock' : 
                           tutorialButtonPreview.querySelector('.margin-trade-buttons') ? 'margin' : null;
        if (currentType !== buttonType) {
            removeTutorialButtonPreview();
        } else {
            // Same type - just ensure it's visible
            tutorialButtonPreview.classList.add('visible');
            return; // Don't recreate, just make sure it's visible
        }
    }
    
    let buttonsHTML = '';
    
    if (buttonType === 'stock') {
        buttonsHTML = `
            <div class="tutorial-button-preview">
                <div class="tutorial-button-preview-label">Stock Trading Buttons</div>
                <div class="stock-trade-buttons" style="display: flex !important; gap: 12px; justify-content: center; margin-left: 0; padding-left: 0; border-left: none;">
                    <button class="trade-btn stock-buy" style="pointer-events: none; opacity: 1 !important; display: flex !important; visibility: visible !important;">
                        <span class="btn-text">
                            Buy Stock
                            <kbd class="btn-shortcut">Space</kbd>
                        </span>
                    </button>
                    <button class="trade-btn stock-sell" style="pointer-events: none; opacity: 1 !important; display: flex !important; visibility: visible !important;">Sell All Stock</button>
                </div>
            </div>
        `;
    } else if (buttonType === 'margin') {
        buttonsHTML = `
            <div class="tutorial-button-preview">
                <div class="tutorial-button-preview-label">Margin Trading Buttons</div>
                <div class="margin-trade-buttons" style="display: flex !important; gap: 12px; justify-content: center; margin-left: 0; padding-left: 0; border-left: none;">
                    <button class="trade-btn margin-long" style="pointer-events: none; opacity: 1 !important; display: flex !important; visibility: visible !important;">
                        Long Margin
                        <kbd class="btn-shortcut">Z</kbd>
                    </button>
                    <button class="trade-btn margin-short" style="pointer-events: none; opacity: 1 !important; display: flex !important; visibility: visible !important;">
                        Short Margin
                        <kbd class="btn-shortcut">C</kbd>
                    </button>
                </div>
            </div>
        `;
    }
    
    if (buttonsHTML) {
        tutorialButtonPreview = document.createElement('div');
        tutorialButtonPreview.id = 'tutorialButtonPreview';
        tutorialButtonPreview.className = 'tutorial-button-preview-container';
        tutorialButtonPreview.innerHTML = buttonsHTML;
        document.body.appendChild(tutorialButtonPreview);
        
        // Force layout recalculation
        tutorialButtonPreview.offsetHeight;
        
        // Animate in after a brief delay to ensure DOM is ready
        setTimeout(() => {
            if (tutorialButtonPreview) {
                tutorialButtonPreview.classList.add('visible');
            }
        }, 100);
    }
}

// Remove button preview
function removeTutorialButtonPreview() {
    if (tutorialButtonPreview) {
        tutorialButtonPreview.classList.remove('visible');
        // Use a longer timeout to ensure smooth transition, but clear any pending removals
        const previewToRemove = tutorialButtonPreview;
        tutorialButtonPreview = null; // Clear reference immediately to prevent re-showing
        setTimeout(() => {
            if (previewToRemove && previewToRemove.parentNode) {
                previewToRemove.parentNode.removeChild(previewToRemove);
            }
        }, 300);
    }
}

// Clean up on window resize
window.addEventListener('resize', function() {
    if (tutorialOpen && currentTutorialStep >= 0 && currentTutorialStep < tutorialSteps.length) {
        const step = tutorialSteps[currentTutorialStep];
        if (step.highlightElement) {
            highlightElement(step.highlightElement);
        }
    }
});

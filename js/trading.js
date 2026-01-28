// Trading, deals, and positions logic

// Confetti animation for max combo achievement
function triggerConfetti() {
    // Create confetti particles
    const particleCount = 150;
    const particles = [];
    // Green color variations
    const colors = ['#00FF00', '#32CD32', '#00CC00', '#66FF66', '#00AA00', '#7FFF00', '#90EE90', '#98FB98'];
    
    // Remove existing canvas if present (to start fresh)
    let existingCanvas = document.getElementById('confettiCanvas');
    if (existingCanvas) {
        existingCanvas.parentNode.removeChild(existingCanvas);
    }
    
    // Create canvas for confetti
    const canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const updateCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    
    // Handle window resize
    const resizeHandler = () => updateCanvasSize();
    window.addEventListener('resize', resizeHandler);
    
    // Create particles - spawn from top and slowly lower down
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: -10 - Math.random() * 50, // Stagger spawn from top
            vx: (Math.random() - 0.5) * 1.5, // Slower horizontal movement
            vy: Math.random() * 0.8 + 0.3, // Much slower vertical velocity (0.3-1.1)
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1, // Slower rotation
            shape: Math.random() > 0.5 ? 'circle' : 'square'
        });
    }
    
    // Animation loop
    let animationId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let activeParticles = 0;
        particles.forEach(particle => {
            if (particle.y < canvas.height + 20) {
                activeParticles++;
                
                // Update position - slow gentle fall
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.03; // Much lighter gravity for slow descent
                particle.rotation += particle.rotationSpeed;
                
                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.fillStyle = particle.color;
                
                if (particle.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                }
                
                ctx.restore();
            }
        });
        
        if (activeParticles > 0) {
            animationId = requestAnimationFrame(animate);
        } else {
            // Clean up canvas after animation
            window.removeEventListener('resize', resizeHandler);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            setTimeout(() => {
                if (canvas && canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }
            }, 100);
        }
    }
    
    animate();
}

// Flash the screen background (green for win/profit, red for loss)
function flashTradingScreen(isWin) {
    // Get or create the flash overlay
    let flashOverlay = document.getElementById('tradeFlashOverlay');
    if (!flashOverlay) {
        flashOverlay = document.createElement('div');
        flashOverlay.id = 'tradeFlashOverlay';
        flashOverlay.className = 'trade-flash-overlay';
        document.body.appendChild(flashOverlay);
    }
    
    // Remove any existing flash class
    flashOverlay.classList.remove('flash-green', 'flash-red');
    
    // Force a reflow to restart the animation
    void flashOverlay.offsetWidth;
    
    // Add the appropriate flash class
    if (isWin) {
        flashOverlay.classList.add('flash-green');
    } else {
        flashOverlay.classList.add('flash-red');
    }
    
    // Remove the class after animation completes
    setTimeout(() => {
        flashOverlay.classList.remove('flash-green', 'flash-red');
    }, 500);
}

// Get the current unlocked cookie tier based on purchased upgrades
function getCurrentCookieTier() {
    if (!state.purchasedUpgrades) return 1;
    
    // Check from highest to lowest tier
    if (state.purchasedUpgrades.includes('diamondCookie')) {
        return 3;
    }
    if (state.purchasedUpgrades.includes('goldenCookie')) {
        return 2;
    }
    return 1;
}

// Cookie/Signal mechanics - one cookie, multiple prophecy types
// Automatically uses the highest unlocked tier
function buyCookie() {
    const tier = getCurrentCookieTier();
    const tierConfig = getCookieTierConfig(tier);
    // Apply discount if purchased
    const price = getEffectiveCookiePrice(tier);
    
    if (state.balance < price) {
        showNotification('Insufficient funds', 'error');
        return;
    }

    // Play cookie purchase sound
    AudioManager.playCookiePurchase();
    
    state.balance -= price;
    updateBalance();

    // Pick random prophecy type
    const prophecyType = PROPHECY_TYPE_KEYS[Math.floor(Math.random() * PROPHECY_TYPE_KEYS.length)];
    const typeConfig = PROPHECY_CONFIG[prophecyType];
    
    // Get per-prophecy duration from config, apply tier modifier
    const durationConfig = typeConfig.duration || { min: 15, max: 30 };
    const baseDuration = Math.floor(Math.random() * (durationConfig.max - durationConfig.min + 1)) + durationConfig.min;
    const duration = Math.floor(baseDuration * tierConfig.modifiers.durationMultiplier);
    
    // Pick a random chart/stock from available stocks
    const stockKeys = Object.keys(stockConfig);
    const targetStock = stockKeys[Math.floor(Math.random() * stockKeys.length)];
    const targetStockConfig = stockConfig[targetStock];
    
    // Don't calculate prophecy values yet - will be calculated when decoded
    // Store only metadata needed for later calculation
    const cookie = { 
        id: Date.now(),
        tier: tier,
        tierConfig: tierConfig,
        prophecyType,
        typeConfig,
        duration,
        targetStock,
        targetStockName: targetStockConfig.name,
        targetStockTag: targetStockConfig.tag,
        tierModifiers: tierConfig.modifiers  // Store modifiers for later calculation
    };
    
    state.cookieInventory.push(cookie);
    renderCookieInventory();
    autoSave(); // Save after buying cookie
    showNotification(`${tierConfig.name} added to stash`, 'success');
}

// Render the cookie inventory
function renderCookieInventory() {
    const container = document.getElementById('cookieInventory');
    const countEl = document.getElementById('inventoryCount');
    
    if (!container) return;
    
    const count = state.cookieInventory.length;
    countEl.textContent = count + (count === 1 ? ' cookie' : ' cookies');
    
    if (count === 0) {
        container.innerHTML = '<div class="inventory-empty">No cookies yet. Purchase some above!</div>';
        return;
    }
    
    // Check if hint upgrades are purchased
    const hasStockHint = typeof hasCookieStockHint === 'function' ? hasCookieStockHint() : false;
    const hasProphecyHint = typeof hasCookieProphecyHint === 'function' ? hasCookieProphecyHint() : false;
    
    container.innerHTML = state.cookieInventory.map(cookie => {
        // Get tier config for icon, default to tier 1 for legacy cookies
        const tier = cookie.tier || 1;
        const tierConfig = getCookieTierConfig(tier);
        const tierClass = tier > 1 ? `tier-${tier}` : '';
        
        // Build tooltip text
        let tooltipText = tierConfig.name;
        const hints = [];
        
        if (hasStockHint && cookie.targetStockName) {
            hints.push(`Stock: ${cookie.targetStockName}`);
        }
        
        if (hasProphecyHint && cookie.typeConfig && cookie.typeConfig.name) {
            hints.push(`Type: ${cookie.typeConfig.name}`);
        }
        
        if (hints.length > 0) {
            tooltipText += '\n' + hints.join('\n');
        }
        
        return `
            <div class="inventory-cookie ${tierClass}" 
                 draggable="true" 
                 data-cookie-id="${cookie.id}"
                 data-tier="${tier}"
                 ondragstart="handleDragStart(event, ${cookie.id})"
                 ondragend="handleDragEnd(event)"
                 title="${tooltipText}">
                <div class="inventory-cookie-icon">${tierConfig.icon}</div>
            </div>
        `;
    }).join('');
}

// Drag and drop handlers
let draggedCookieId = null;

function handleDragStart(event, cookieId) {
    draggedCookieId = cookieId;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cookieId);
    
    // Add visual feedback to drop zone
    const dropZone = document.getElementById('signalReveal');
    if (dropZone) {
        dropZone.classList.add('drag-active');
    }
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    draggedCookieId = null;
    
    // Remove visual feedback from drop zone
    const dropZone = document.getElementById('signalReveal');
    if (dropZone) {
        dropZone.classList.remove('drag-active', 'drag-over');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const dropZone = document.getElementById('signalReveal');
    if (dropZone && !dropZone.classList.contains('drag-over')) {
        dropZone.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const dropZone = document.getElementById('signalReveal');
    // Only remove if we're actually leaving the drop zone (not entering a child)
    if (dropZone && !dropZone.contains(event.relatedTarget)) {
        dropZone.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    
    const dropZone = document.getElementById('signalReveal');
    if (dropZone) {
        dropZone.classList.remove('drag-active', 'drag-over');
    }
    
    const cookieId = parseInt(event.dataTransfer.getData('text/plain'));
    if (!cookieId) return;
    
    // Find and remove cookie from inventory
    const cookieIndex = state.cookieInventory.findIndex(c => c.id === cookieId);
    if (cookieIndex === -1) return;
    
    const cookie = state.cookieInventory.splice(cookieIndex, 1)[0];
    
    // Set as active cookie for unpacking
    state.cookie = cookie;
    
    // Reset unwrap animation to first frame
    state.cookieUnwrapFrame = 0;
    
    // Play cookie dropped sound
    AudioManager.playCookieDropped();
    
    renderCookieInventory();
    renderSignal();
    showNotification('Cookie ready to unpack!', 'info');
}

// Generate prophecy-specific data based on type
// Uses per-prophecy config from PROPHECY_CONFIG
// tierModifiers: { intervalTightness, strengthBonus } from cookie tier
function generateProphecyData(prophecyType, currentPrice, duration, tierModifiers = {}) {
    const config = PROPHECY_CONFIG[prophecyType] || {};
    
    // Default tier modifiers (tier 1 values)
    const intervalTightness = tierModifiers.intervalTightness || 1.0;
    const strengthBonus = tierModifiers.strengthBonus || 0;
    
    switch (prophecyType) {
        case 'trendUp':
        case 'trendDown': {
            // Calculate reversal probability based on tier
            // Tier 1: 33%, Tier 2: 66%, Tier 3: 95%
            // Map strengthBonus to tier probabilities
            let reversalProbability;
            if (strengthBonus === 0) {
                // Tier 1
                reversalProbability = 0.33;
            } else if (strengthBonus === 0.15) {
                // Tier 2
                reversalProbability = 0.66;
            } else if (strengthBonus === 0.3) {
                // Tier 3
                reversalProbability = 0.95;
            } else {
                // Fallback: interpolate or use tier 1
                reversalProbability = 0.33;
            }
            
            return {
                reversalProbability: parseFloat(reversalProbability.toFixed(3))
            };
        }
        
        case 'shore': {
            // Get shore config (with fallbacks)
            const baseLowerDistanceConfig = config.lowerDistance || { min: 0.5, max: 3.0 };
            const baseUpperDistanceConfig = config.upperDistance || { min: 0.5, max: 3.0 };
            const intervalConfig = config.intervalWidth || { min: 0.3, max: 1.0 };
            
            // Determine tier from strengthBonus (0 = tier 1, 0.15 = tier 2, 0.3 = tier 3)
            // REVERSED: Tier 1 creates WIDE shores (more room), Tier 2-3 create TIGHT shores (more restrictive)
            let lowerDistanceConfig, upperDistanceConfig;
            if (strengthBonus === 0) {
                // Tier 1: Wide range (2.0-6.0%) - price has more room to move
                lowerDistanceConfig = { min: 2.0, max: 6.0 };
                upperDistanceConfig = { min: 2.0, max: 6.0 };
            } else if (strengthBonus === 0.15) {
                // Tier 2: Medium-tight range (1.0-3.0%) - more restrictive
                lowerDistanceConfig = { min: 1.0, max: 3.0 };
                upperDistanceConfig = { min: 1.0, max: 3.0 };
            } else if (strengthBonus === 0.3) {
                // Tier 3: Tight range (0.5-2.0%) - very restrictive
                lowerDistanceConfig = { min: 0.5, max: 2.0 };
                upperDistanceConfig = { min: 0.5, max: 2.0 };
            } else {
                // Fallback to tier 1
                lowerDistanceConfig = baseLowerDistanceConfig;
                upperDistanceConfig = baseUpperDistanceConfig;
            }
            
            // Generate lower shore (price floor)
            const lowerDistance = lowerDistanceConfig.min + Math.random() * (lowerDistanceConfig.max - lowerDistanceConfig.min);
            const trueFloor = currentPrice * (1 - lowerDistance / 100);
            
            // Generate upper shore (price ceiling)
            const upperDistance = upperDistanceConfig.min + Math.random() * (upperDistanceConfig.max - upperDistanceConfig.min);
            const trueCeiling = currentPrice * (1 + upperDistance / 100);
            
            // Validate range: ensure lowerShore < upperShore
            // If invalid, adjust to create a valid range
            let finalLowerShore = trueFloor;
            let finalUpperShore = trueCeiling;
            if (finalLowerShore >= finalUpperShore) {
                // Invalid range - create a small valid range around midpoint
                const midPoint = (finalLowerShore + finalUpperShore) / 2;
                finalLowerShore = midPoint * 0.99;
                finalUpperShore = midPoint * 1.01;
            }
            
            // Apply interval tightness from tier (higher tiers = tighter intervals = more precise)
            const intervalWidth = (intervalConfig.min + Math.random() * (intervalConfig.max - intervalConfig.min)) * intervalTightness;
            const intervalHalf = (currentPrice * intervalWidth / 100) / 2;
            
            // Return both lower and upper bounds
            return {
                lowerShore: finalLowerShore,
                upperShore: finalUpperShore,
                lowerIntervalMin: parseFloat((trueFloor - intervalHalf).toFixed(2)),
                lowerIntervalMax: parseFloat((trueFloor + intervalHalf).toFixed(2)),
                upperIntervalMin: parseFloat((trueCeiling - intervalHalf).toFixed(2)),
                upperIntervalMax: parseFloat((trueCeiling + intervalHalf).toFixed(2))
            };
        }
        
        case 'inevitableZone': {
            // Get zone config (with fallbacks)
            const baseDistanceConfig = config.distance || { min: 0.3, max: 0.5 };
            const intervalConfig = config.intervalWidth || { min: 0.4, max: 1.2 };
            
            // Determine tier from strengthBonus (0 = tier 1, 0.15 = tier 2, 0.3 = tier 3)
            // REVERSED: Higher tiers place zone FARTHER away for more dramatic movement
            let distanceConfig;
            if (strengthBonus === 0) {
                // Tier 1: Close to current price (0.3-0.5%)
                distanceConfig = { min: 0.3, max: 0.5 };
            } else if (strengthBonus === 0.15) {
                // Tier 2: Medium distance (2.0-4.0%)
                distanceConfig = { min: 2.0, max: 4.0 };
            } else if (strengthBonus === 0.3) {
                // Tier 3: Far distance (5.0-10.0%)
                distanceConfig = { min: 5.0, max: 10.0 };
            } else {
                // Fallback to tier 1
                distanceConfig = baseDistanceConfig;
            }
            
            // Inevitable zone - price will touch this zone
            const direction = Math.random() > 0.5 ? 1 : -1;
            const distance = distanceConfig.min + Math.random() * (distanceConfig.max - distanceConfig.min);
            const trueZone = currentPrice * (1 + direction * distance / 100);
            
            // Apply interval tightness from tier (higher tiers = tighter intervals = easier to hit)
            const intervalWidth = (intervalConfig.min + Math.random() * (intervalConfig.max - intervalConfig.min)) * intervalTightness;
            // Calculate interval half based on trueZone, not currentPrice, so interval is centered on the zone
            const intervalHalf = (trueZone * intervalWidth / 100) / 2;
            return {
                trueValue: trueZone,
                intervalMin: parseFloat((trueZone - intervalHalf).toFixed(2)),
                intervalMax: parseFloat((trueZone + intervalHalf).toFixed(2)),
                touched: false,
                magnetismStrength: config.magnetismStrength || 0.25
            };
        }
        
        case 'volatilitySpike': {
            // Get base volatility spike config (with fallbacks)
            const baseVolConfig = config.volatilityMultiplier || { min: 4.0, max: 8.0 };
            
            // Determine tier from strengthBonus (0 = tier 1, 0.15 = tier 2, 0.3 = tier 3)
            // Higher tiers = MORE extreme volatility spikes
            let volConfig;
            if (strengthBonus === 0) {
                // Tier 1: Moderate spike (4.0x - 8.0x)
                volConfig = { min: 4.0, max: 8.0 };
            } else if (strengthBonus === 0.15) {
                // Tier 2: Strong spike (5.0x - 10.0x)
                volConfig = { min: 5.0, max: 10.0 };
            } else if (strengthBonus === 0.3) {
                // Tier 3: Extreme spike (6.0x - 12.0x)
                volConfig = { min: 6.0, max: 12.0 };
            } else {
                // Fallback to tier 1
                volConfig = baseVolConfig;
            }
            
            // Apply interval tightness to volatility range (tighter = more precise prediction)
            const volRange = (volConfig.max - volConfig.min) * intervalTightness;
            const volatilityMin = volConfig.min + Math.random() * volRange * 0.3;
            const volatilityMax = volatilityMin + Math.random() * (volConfig.min + volRange - volatilityMin);
            return {
                volatilityMin: parseFloat(volatilityMin.toFixed(1)),
                volatilityMax: parseFloat(volatilityMax.toFixed(1)),
                trueVolatility: volatilityMin + Math.random() * (volatilityMax - volatilityMin),
                windowStart: 0,  // Active immediately
                windowEnd: duration  // Active for full duration
            };
        }
        
        case 'volatilityCalm': {
            // Get base volatility calm config (with fallbacks)
            const baseVolConfig = config.volatilityMultiplier || { min: 0.05, max: 0.1 };
            
            // Determine tier from strengthBonus (0 = tier 1, 0.15 = tier 2, 0.3 = tier 3)
            // REVERSED: Higher tiers = MORE dramatic calm (less active, closer to zero)
            let volConfig;
            if (strengthBonus === 0) {
                // Tier 1: Mild calm (0.2x - 0.4x) - less dramatic, closer to normal
                volConfig = { min: 0.2, max: 0.4 };
            } else if (strengthBonus === 0.15) {
                // Tier 2: Moderate calm (0.1x - 0.2x) - more dramatic
                volConfig = { min: 0.1, max: 0.2 };
            } else if (strengthBonus === 0.3) {
                // Tier 3: Very calm (0.05x - 0.1x) - very dramatic reduction, least active
                volConfig = { min: 0.05, max: 0.1 };
            } else {
                // Fallback to tier 1
                volConfig = baseVolConfig;
            }
            
            // Apply interval tightness to volatility range
            const volRange = (volConfig.max - volConfig.min) * intervalTightness;
            const volatilityMin = volConfig.min + Math.random() * volRange * 0.5;
            const volatilityMax = volatilityMin + Math.random() * (volConfig.min + volRange - volatilityMin);
            return {
                volatilityMin: parseFloat(volatilityMin.toFixed(1)),
                volatilityMax: parseFloat(volatilityMax.toFixed(1)),
                trueVolatility: volatilityMin + Math.random() * (volatilityMax - volatilityMin),
                windowStart: 0,  // Active immediately
                windowEnd: duration  // Active for full duration
            };
        }
        
        default:
            return {};
    }
}

function renderSignal() {
    const reveal = document.getElementById('signalReveal');
    
    if (!state.cookie) {
        // Show empty drop zone
        reveal.innerHTML = `
            <div class="empty-state" id="emptyState">
                <div class="empty-state-icon">⚡</div>
                <div class="empty-state-text">Drag a cookie here to unpack its prophecy</div>
            </div>
        `;
        return;
    }
    
    // Initialize unwrapping animation state
    if (state.cookieUnwrapFrame === undefined) {
        state.cookieUnwrapFrame = 0;
    }
    
    // Get current frame image path based on cookie tier
    const cookieTier = state.cookie.tier || 1;
    const frameImage = `images/trading/${cookieTier}_cookie_${state.cookieUnwrapFrame}.png`;
    
    // Show cookie animation frame
    reveal.innerHTML = `
        <div class="cookie-unwrap-container" id="cookieUnwrapContainer" onclick="crackCookie()">
            <img src="${frameImage}" class="cookie-unwrap-frame" id="cookieUnwrapFrame" alt="Fortune Cookie">
            <div class="cookie-unwrap-hint">Click to unwrap your prophecy (${state.cookieUnwrapFrame}/5)</div>
        </div>
    `;
}

function crackCookie() {
    if (!state.cookie) return;

    // Advance to next frame
    state.cookieUnwrapFrame = (state.cookieUnwrapFrame || 0) + 1;
    
    // If we've shown all 6 frames (0-5), create the prophecy and reset
    if (state.cookieUnwrapFrame > 5) {
        // Play cookie opened sound on final reveal
        AudioManager.playCookieOpened();
        
        // Create the prophecy
        createProphecy(state.cookie);
        
        // Reset cookie state
        state.cookie = null;
        state.cookieUnwrapFrame = 0;
        
        // Return to initial drag-and-drop area
        renderSignal();
    } else {
        // Play animation sound for current frame (0-5)
        AudioManager.playCookieAnimation(state.cookieUnwrapFrame, 0.8);
        
        // Update to show next frame
        const cookieTier = state.cookie.tier || 1;
        const frameImage = `images/trading/${cookieTier}_cookie_${state.cookieUnwrapFrame}.png`;
        const frameEl = document.getElementById('cookieUnwrapFrame');
        const hintEl = document.querySelector('.cookie-unwrap-hint');
        
        if (frameEl) {
            frameEl.src = frameImage;
        }
        
        if (hintEl) {
            hintEl.textContent = `Click to unwrap your prophecy (${state.cookieUnwrapFrame}/5)`;
        }
    }
}

// Generate the secret info text (type + target) that gets decrypted
function generateSecretInfo(prophecy) {
    const typeName = prophecy.typeConfig.name.toUpperCase();
    const targetName = prophecy.targetStockName.toUpperCase();
    return `${typeName} | ${targetName}`;
}

// Generate scrambled version of secret info
function generateScrambledSecret(text) {
    const chars = '▓░▒█◊◆◇○●□■△▲⬡⬢';
    let result = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ' || text[i] === '|') {
            result += text[i];
        } else {
            const seed = text.charCodeAt(i) + i * 7;
            result += chars[seed % chars.length];
        }
    }
    return result;
}

// Get indices of encryptable characters (non-space, non-separator)
function getEncryptableIndices(text) {
    const indices = [];
    for (let i = 0; i < text.length; i++) {
        if (text[i] !== ' ' && text[i] !== '|') {
            indices.push(i);
        }
    }
    return indices;
}

// Render secret info with some chars revealed
function renderSecretDisplay(secretText, scrambledText, revealedIndices) {
    let result = '';
    for (let i = 0; i < secretText.length; i++) {
        if (secretText[i] === ' ' || secretText[i] === '|') {
            result += secretText[i];
        } else if (revealedIndices.has(i)) {
            result += secretText[i];
        } else {
            result += scrambledText[i];
        }
    }
    return result;
}

function createProphecy(cookie) {
    const now = Date.now();
    
    // Check if Auto Reveal is enabled
    const autoRevealEnabled = typeof hasAutoReveal === 'function' ? hasAutoReveal() : false;
    
    // Pick a random fortune text for typing
    const fortuneText = FORTUNE_TEXTS[Math.floor(Math.random() * FORTUNE_TEXTS.length)];
    
    // Generate the secret info (type + target)
    const tempProphecy = {
        typeConfig: cookie.typeConfig,
        targetStockName: cookie.targetStockName
    };
    const secretInfo = generateSecretInfo(tempProphecy);
    const scrambledSecret = generateScrambledSecret(secretInfo);
    const encryptableIndices = getEncryptableIndices(secretInfo);
    
    const prophecy = {
        id: now,
        prophecyType: cookie.prophecyType,
        typeConfig: cookie.typeConfig,
        duration: cookie.duration,
        startTime: null,  // Will be set when decoded
        targetStock: cookie.targetStock,
        targetStockName: cookie.targetStockName,
        targetStockTag: cookie.targetStockTag,
        resolved: false,
        // Decoding mini-game state
        fortuneText: fortuneText,           // The silly text player types
        typingPosition: 0,                  // Current position in fortune text
        secretInfo: secretInfo,             // "TYPE NAME | TARGET" - what gets revealed
        scrambledSecret: scrambledSecret,   // Scrambled version
        encryptableIndices: [...encryptableIndices], // Indices that can be revealed
        revealedIndices: new Set(),         // Which indices have been revealed
        isDecoded: false,
        autoRevealing: autoRevealEnabled,       // Track if auto-revealing
        lastAutoRevealTick: autoRevealEnabled ? (typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0) : null,
        // Store cookie metadata for later calculation (values will be calculated when decoded)
        cookieMetadata: {
            tierModifiers: cookie.tierModifiers || cookie.tierConfig?.modifiers || {}
        }
    };
    
    // Computed remaining for backwards compatibility
    Object.defineProperty(prophecy, 'remaining', {
        get: function() {
            if (!this.startTime) return this.duration; // Not decoded yet, show full duration
            return Math.max(0, this.duration - (Date.now() - this.startTime) / 1000);
        }
    });
    
    state.deals.push(prophecy);
    renderDeals();
}

// Calculate prophecy values when decoded, using current price at decode time
function calculateProphecyValues(prophecy) {
    if (prophecy.isDecoded) return; // Already calculated
    
    const now = Date.now();
    
    // Get current price for the target stock
    const currentStockPrice = prophecy.targetStock === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[prophecy.targetStock] 
            ? state.chartPrices[prophecy.targetStock].currentPrice 
            : stockConfig[prophecy.targetStock]?.basePrice || 100);
    
    // Get tier modifiers from stored metadata
    const tierModifiers = prophecy.cookieMetadata?.tierModifiers || {};
    
    // Generate prophecy data using current price at decode time
    const prophecyData = generateProphecyData(
        prophecy.prophecyType, 
        currentStockPrice, 
        prophecy.duration, 
        tierModifiers
    );
    
    // Apply the calculated values to the prophecy
    Object.assign(prophecy, prophecyData);
    
    // Set start time when decoded (prophecy starts now)
    prophecy.startTime = now;
    
    // Mark as decoded
    prophecy.isDecoded = true;
}

// Auto-decode all existing undecoded prophecies (when Auto Reveal is purchased)
function autoDecodeExistingProphecies() {
    if (!state.deals) return;
    
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    
    state.deals.forEach(prophecy => {
        if (!prophecy.isDecoded && !prophecy.resolved) {
            prophecy.autoRevealing = true;
            prophecy.lastAutoRevealTick = currentTick;
        }
    });
    
    renderDeals();
}

// Select a prophecy for decoding
function selectProphecy(id) {
    const prophecy = state.deals.find(d => d.id === id);
    if (!prophecy || prophecy.resolved || prophecy.isDecoded) return;
    
    // Toggle selection
    if (state.selectedProphecyId === id) {
        state.selectedProphecyId = null;
    } else {
        state.selectedProphecyId = id;
    }
    renderDeals();
}

// Handle keyboard input for decoding
function handleDecodeKeypress(event) {
    if (!state.selectedProphecyId) return;
    
    const prophecy = state.deals.find(d => d.id === state.selectedProphecyId);
    if (!prophecy || prophecy.resolved || prophecy.isDecoded) return;
    
    const key = event.key.toUpperCase();
    
    // Get current expected character (skip spaces)
    let pos = prophecy.typingPosition;
    while (prophecy.fortuneText[pos] === ' ' && pos < prophecy.fortuneText.length) {
        pos++;
    }
    prophecy.typingPosition = pos;
    
    const expectedChar = prophecy.fortuneText[pos];
    
    if (!expectedChar) {
        // Finished typing - reveal all remaining
        prophecy.encryptableIndices.forEach(idx => prophecy.revealedIndices.add(idx));
        // Calculate prophecy values using current price at decode time
        calculateProphecyValues(prophecy);
        state.selectedProphecyId = null;
        AudioManager.playProphecyDecoded();
        showNotification('Prophecy decoded!', 'success');
        renderDeals();
        return;
    }
    
    // Check if key matches
    if (key.length === 1 && /[A-Z0-9]/.test(key)) {
        if (key === expectedChar) {
            // Play subtle click for correct key
            AudioManager.playClick();
            prophecy.typingPosition++;
            
            // Skip any following spaces
            while (prophecy.fortuneText[prophecy.typingPosition] === ' ' && 
                   prophecy.typingPosition < prophecy.fortuneText.length) {
                prophecy.typingPosition++;
            }
            
            // Reveal a random encrypted symbol
            if (prophecy.encryptableIndices.length > 0) {
                const randomIdx = Math.floor(Math.random() * prophecy.encryptableIndices.length);
                const revealIdx = prophecy.encryptableIndices.splice(randomIdx, 1)[0];
                prophecy.revealedIndices.add(revealIdx);
            }
            
            // Check if fully decoded (all typed or all revealed)
            if (prophecy.typingPosition >= prophecy.fortuneText.length || 
                prophecy.encryptableIndices.length === 0) {
                // Reveal any remaining
                prophecy.encryptableIndices.forEach(idx => prophecy.revealedIndices.add(idx));
                // Calculate prophecy values using current price at decode time
                calculateProphecyValues(prophecy);
                state.selectedProphecyId = null;
                AudioManager.playProphecyDecoded();
                showNotification('Prophecy decoded!', 'success');
            }
            
            renderDeals();
        } else {
            // Wrong key - visual feedback and error sound
            AudioManager.playError();
            const card = document.querySelector(`.prophecy-card[data-id="${prophecy.id}"]`);
            if (card) {
                card.classList.add('decode-error');
                setTimeout(() => card.classList.remove('decode-error'), 200);
            }
        }
    }
}

// Initialize keyboard listener for decoding
document.addEventListener('keydown', handleDecodeKeypress);

// Check if trading shortcuts should be disabled
function areTradingShortcutsDisabled() {
    // Disable if a prophecy is selected and not decoded (user is typing)
    if (state.selectedProphecyId) {
        const prophecy = state.deals.find(d => d.id === state.selectedProphecyId);
        if (prophecy && !prophecy.resolved && !prophecy.isDecoded) {
            return true;
        }
    }
    
    // Disable if user is typing in any input field
    const activeElement = document.activeElement;
    if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    )) {
        return true;
    }
    
    return false;
}

// Handle trading keyboard shortcuts
function handleTradingShortcuts(event) {
    // Don't interfere if shortcuts are disabled
    if (areTradingShortcutsDisabled()) {
        return;
    }
    
    // Don't trigger if user is holding modifier keys (except for special cases)
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }
    
    const key = event.key.toLowerCase();
    
    // 'a' key - long position
    if (key === 'a') {
        event.preventDefault();
        openPosition('long');
        return;
    }
    
    // 'd' key - short position
    if (key === 'd') {
        event.preventDefault();
        openPosition('short');
        return;
    }
    
    // 'z' key - long margin position
    if (key === 'z') {
        event.preventDefault();
        if (typeof openMarginPosition === 'function') {
            openMarginPosition('long');
        }
        return;
    }
    
    // 'c' key - short margin position
    if (key === 'c') {
        event.preventDefault();
        if (typeof openMarginPosition === 'function') {
            openMarginPosition('short');
        }
        return;
    }
    
    // space - buy stock
    if (key === ' ') {
        event.preventDefault();
        buyStock();
        return;
    }
}

// Initialize keyboard listener for trading shortcuts
document.addEventListener('keydown', handleTradingShortcuts);

function renderDeals() {
    const container = document.getElementById('dealsContainer');
    const activeDeals = state.deals.filter(d => !d.resolved);
    document.getElementById('dealCount').textContent = activeDeals.length + ' Active';
    
    if (activeDeals.length === 0) {
        container.innerHTML = '<div class="empty-deals">No active prophecies. Purchase a fortune cookie to receive trading insights.</div>';
        return;
    }

    container.innerHTML = activeDeals.map(deal => {
        const isCurrentStock = deal.targetStock === state.dataMode;
        const categoryClass = deal.isDecoded ? getProphecyCategoryClass(deal) : '';
        const isSelected = state.selectedProphecyId === deal.id;
        const progress = deal.remaining / deal.duration;
        
        // Generate the encrypted/revealed secret display
        const secretDisplay = renderSecretDisplay(
            deal.secretInfo, 
            deal.scrambledSecret, 
            deal.revealedIndices
        );
        
        // Calculate typing progress
        const typedChars = deal.typingPosition;
        const totalChars = deal.fortuneText.replace(/ /g, '').length;
        const typingProgress = (typedChars / totalChars) * 100;
        
        // Render fortune text with typed portion highlighted
        const fortuneDisplay = renderFortuneText(deal.fortuneText, deal.typingPosition, isSelected);
        
        // Show decoded prophecy details or encrypted placeholder
        const detailsContent = deal.isDecoded ? renderProphecyDetails(deal) : '';
        
        return `
        <div class="deal-card prophecy-card ${categoryClass} ${isCurrentStock ? 'current-stock' : ''} ${isSelected ? 'selected' : ''} ${deal.isDecoded ? 'decoded' : 'encrypted'} ${deal.autoRevealing ? 'auto-revealed' : ''}" 
             data-id="${deal.id}" 
             onclick="selectProphecy(${deal.id})">
            <div class="prophecy-decode-header">
                <span class="prophecy-icon">${deal.isDecoded ? deal.typeConfig.icon : '🔮'}</span>
                <div class="prophecy-secret-display ${deal.isDecoded ? 'revealed' : ''}">
                    ${secretDisplay}
                </div>
            </div>
            <div class="fortune-text-container ${isSelected ? 'active' : ''}">
                <div class="fortune-quote">"${fortuneDisplay}"</div>
            </div>
            ${isSelected && !deal.isDecoded ? `
            <div class="decode-progress-bar">
                <div class="decode-progress-fill" style="width: ${typingProgress}%"></div>
            </div>
            ` : ''}
            ${detailsContent}
            <div class="deal-timer">
                <div class="timer-bar">
                    <div class="timer-fill" style="width: ${progress * 100}%"></div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Render fortune text with typed/untyped portions
function renderFortuneText(text, typedPosition, isActive) {
    if (!isActive) {
        return `<span class="fortune-untyped">${text}</span>`;
    }
    
    const typed = text.substring(0, typedPosition);
    const current = text[typedPosition] || '';
    const remaining = text.substring(typedPosition + 1);
    
    return `<span class="fortune-typed">${typed}</span><span class="fortune-current">${current}</span><span class="fortune-untyped">${remaining}</span>`;
}

// Get CSS class based on prophecy category
function getProphecyCategoryClass(deal) {
    switch (deal.prophecyType) {
        case 'trendUp': return 'trend-up';
        case 'trendDown': return 'trend-down';
        case 'shore': return 'shore';
        case 'inevitableZone': return 'zone';
        case 'volatilitySpike': return 'volatility-spike';
        case 'volatilityCalm': return 'volatility-calm';
        default: return '';
    }
}

// Render prophecy-specific details (compact version)
function renderProphecyDetails(deal) {
    // Safety check - only render if decoded and values exist
    if (!deal.isDecoded) return '';
    
    switch (deal.prophecyType) {
        case 'trendUp':
        case 'trendDown':
            if (deal.strengthMin === undefined || deal.strengthMax === undefined) return '';
            return `
                <div class="prophecy-detail-row">
                    <span class="detail-label">Strength:</span>
                    <span class="detail-value">${deal.strengthMin.toFixed(1)}% - ${deal.strengthMax.toFixed(1)}%</span>
                </div>
            `;
        
        case 'shore':
            if (deal.lowerIntervalMin === undefined || deal.lowerIntervalMax === undefined || 
                deal.upperIntervalMin === undefined || deal.upperIntervalMax === undefined) return '';
            return `
                <div class="prophecy-detail-row">
                    <span class="detail-label">Floor:</span>
                    <span class="detail-value price-interval">$${deal.lowerIntervalMin.toFixed(2)}-${deal.lowerIntervalMax.toFixed(2)}</span>
                </div>
                <div class="prophecy-detail-row">
                    <span class="detail-label">Ceiling:</span>
                    <span class="detail-value price-interval">$${deal.upperIntervalMin.toFixed(2)}-${deal.upperIntervalMax.toFixed(2)}</span>
                </div>
            `;
        
        case 'inevitableZone':
            if (deal.intervalMin === undefined || deal.intervalMax === undefined) return '';
            return `
                <div class="prophecy-detail-row">
                    <span class="detail-label">Zone:</span>
                    <span class="detail-value price-interval">$${deal.intervalMin.toFixed(2)}-${deal.intervalMax.toFixed(2)}</span>
                </div>
                ${deal.touched ? '<div class="prophecy-guarantee touched">Zone touched!</div>' : ''}
            `;
        
        case 'volatilitySpike':
            if (deal.volatilityMin === undefined || deal.volatilityMax === undefined) return '';
            return `
                <div class="prophecy-detail-row">
                    <span class="detail-label">Vol:</span>
                    <span class="detail-value vol-interval">${deal.volatilityMin.toFixed(1)}x-${deal.volatilityMax.toFixed(1)}x</span>
                </div>
            `;
        
        case 'volatilityCalm':
            if (deal.volatilityMin === undefined || deal.volatilityMax === undefined) return '';
            return `
                <div class="prophecy-detail-row">
                    <span class="detail-label">Vol:</span>
                    <span class="detail-value vol-interval">${deal.volatilityMin.toFixed(1)}x-${deal.volatilityMax.toFixed(1)}x</span>
                </div>
            `;
        
        default:
            return '';
    }
}

// placeBet removed - prophecies are info-only, no betting on prophecies

function updateDeals() {
    if (!state.deals || state.deals.length === 0) return;
    
    const now = Date.now();
    let needsRender = false;
    
    // Process gradual auto-reveal (speed depends on upgrade tier)
    if (typeof getCurrentTickNumber === 'function' && typeof getAutoRevealSpeed === 'function') {
        const currentTick = getCurrentTickNumber();
        const revealSpeed = getAutoRevealSpeed();
        
        state.deals.forEach(deal => {
            if (deal.autoRevealing && !deal.isDecoded && revealSpeed > 0) {
                // Check if a new tick has passed
                if (deal.lastAutoRevealTick !== currentTick) {
                    deal.lastAutoRevealTick = currentTick;
                    
                    // Reveal characters based on speed (999 = instant/all)
                    const charsToReveal = revealSpeed >= 999 ? deal.encryptableIndices.length : revealSpeed;
                    
                    for (let i = 0; i < charsToReveal && deal.encryptableIndices.length > 0; i++) {
                        const revealIdx = deal.encryptableIndices.shift();
                        deal.revealedIndices.add(revealIdx);
                        needsRender = true;
                    }
                    
                    // Check if fully revealed
                    if (deal.encryptableIndices.length === 0 && !deal.isDecoded) {
                        // Calculate prophecy values using current price at decode time
                        calculateProphecyValues(deal);
                        needsRender = true;
                        // Play prophecy decoded sound for auto-reveal completion
                        AudioManager.playProphecyDecoded();
                    }
                }
            }
        });
    }

    state.deals = state.deals.filter(deal => {
        if (deal.resolved) return false;
        
        // Only check expiration for decoded prophecies (startTime is set when decoded)
        if (!deal.isDecoded || !deal.startTime) {
            return true; // Keep undecoded prophecies
        }
        
        const elapsed = (now - deal.startTime) / 1000;
        const remaining = deal.duration - elapsed;
        needsRender = true;

        if (remaining <= 0) {
            // Prophecy expired - just remove it (info-only, no payout)
            deal.resolved = true;
            showNotification(`Prophecy for ${deal.targetStockName} expired`, 'info');
            return false;
        }
        return true;
    });

    if (needsRender) renderDeals();
}

// Create a prediction at the clicked price
function createPrediction(clickedPrice) {
    // Check timing lock
    if (!canPlaceBet()) {
        const remaining = getBetLockRemaining();
        showNotification(`Please wait ${remaining}s before betting again`, 'error');
        return;
    }

    // Prediction bet is 2x current bet
    const baseAmount = getCurrentBet();
    const amount = baseAmount * 2;

    if (amount > state.balance) {
        showNotification('Insufficient funds', 'error');
        return;
    }

    // Play click sound for placing prediction
    AudioManager.playClick();
    
    state.balance -= amount;
    updateBalance();

    // Calculate interval around clicked price (2% range)
    const intervalWidth = clickedPrice * 0.02; // 2% of price
    const intervalMin = clickedPrice - intervalWidth / 2;
    const intervalMax = clickedPrice + intervalWidth / 2;

    const now = Date.now();
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    
    const prediction = {
        id: now,
        price: clickedPrice,
        intervalMin: intervalMin,
        intervalMax: intervalMax,
        amount: amount,
        startTick: currentTick,
        targetTick: currentTick + 10, // Resolve after 10 ticks
        stockSymbol: state.dataMode,
        resolved: false,
        startTime: now,
        lastShrinkTick: currentTick // Track last tick when we shrunk this prediction
    };

    // Security validation
    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('createPrediction', {
            amount: amount,
            balance: state.balance,
            price: clickedPrice
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_prediction', { amount, price: clickedPrice });
            // Refund the bet
            state.balance += amount;
            updateBalance();
            showNotification(validation.reason, 'error');
            return;
        }
        SecurityService.logTransaction('createPrediction', { amount, price: clickedPrice });
    }

    // Initialize predictions array if it doesn't exist
    if (!state.predictions) {
        state.predictions = [];
    }

    state.predictions.push(prediction);
    state.lastBetTime = now; // Update bet lock timer
    
    // Re-render chart to show prediction
    if (typeof drawChartSmooth === 'function') {
        drawChartSmooth();
    }
    
    showNotification(`Prediction placed at $${clickedPrice.toFixed(2)}`, 'success');
}

function openPosition(direction) {
    // Check timing lock
    if (!canPlaceBet()) {
        const remaining = getBetLockRemaining();
        showNotification(`Please wait ${remaining}s before betting again`, 'error');
        return;
    }

    const amount = getCurrentBet();

    if (amount > state.balance) {
        showNotification('Insufficient funds', 'error');
        return;
    }

    // Play click sound for placing bet
    AudioManager.playClick();
    
    state.balance -= amount;
    updateBalance();

    const now = Date.now();
    const position = {
        id: now,
        direction: direction,
        amount: amount,
        entryPrice: state.currentPrice,
        duration: 2,
        startTime: now, // Use timestamp for smooth timer
        stockSymbol: state.dataMode // Track which stock this position belongs to
    };
    
    // Computed remaining for backwards compatibility
    Object.defineProperty(position, 'remaining', {
        get: function() {
            return Math.max(0, this.duration - (Date.now() - this.startTime) / 1000);
        }
    });

    state.positions.push(position);
    state.lastBetTime = now; // Update bet lock timer
    renderPositions();
    showNotification(`${direction.toUpperCase()} position opened`, 'success');
}

// Update predictions - check if 10 ticks have passed
// Only shrinks when chart actually updates (new tick occurs)
function updatePredictions() {
    if (!state.predictions || state.predictions.length === 0) return;
    
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    
    state.predictions.forEach(prediction => {
        if (prediction.resolved) return;
        
        // Only update shrinking when a new tick occurs (chart has updated)
        // Check if we've moved to a new tick since last shrink
        if (currentTick > prediction.lastShrinkTick) {
            // Update last shrink tick to current
            prediction.lastShrinkTick = currentTick;
        }
        
        // Check if target tick has been reached
        if (currentTick >= prediction.targetTick) {
            resolvePrediction(prediction);
        }
    });
}

// Resolve a prediction - check if current price is within interval
function resolvePrediction(prediction) {
    if (prediction.resolved) return;
    
    // Get current price for the prediction's stock
    const currentPrice = prediction.stockSymbol === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[prediction.stockSymbol]
            ? state.chartPrices[prediction.stockSymbol].currentPrice
            : stockConfig[prediction.stockSymbol]?.basePrice || 100);
    
    // Security validation
    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('resolvePrediction', {
            amount: prediction.amount,
            currentPrice: currentPrice,
            intervalMin: prediction.intervalMin,
            intervalMax: prediction.intervalMax
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_prediction_resolution', { 
                id: prediction.id, 
                reason: validation.reason 
            });
            return;
        }
    }
    
    // Check if price is within interval
    const isInside = currentPrice >= prediction.intervalMin && currentPrice <= prediction.intervalMax;
    
    // Mark as resolved
    prediction.resolved = true;
    prediction.resultPrice = currentPrice;
    prediction.won = isInside;
    
    if (isInside) {
        // Player wins - get 2x reward (4x total: 2x bet back + 2x profit)
        const winnings = Math.floor(prediction.amount * 2);
        state.balance += winnings;
        updateBalance();
        const profit = winnings - prediction.amount;
        prediction.result = profit;
        
        if (typeof SecurityService !== 'undefined') {
            SecurityService.logTransaction('prediction_win', { 
                id: prediction.id, 
                profit, 
                winnings 
            });
        }
        
        // Check if at max combo after handling win
        const betAmounts = typeof getCurrentBetAmounts === 'function' ? getCurrentBetAmounts() : BET_AMOUNTS;
        
        handleWin(); // Increase streak and bet
        
        // Check if player is at max combo
        const nowAtMaxCombo = state.betIndex >= betAmounts.length - 1;
        
        flashTradingScreen(true); // Green flash for win
        
        // Play appropriate sound based on combo level
        if (nowAtMaxCombo) {
            AudioManager.playSuccessfulDealMaxCombo(); // Play max combo sound
        } else {
            AudioManager.playSuccessfulDeal(); // Play regular success sound
        }
        
        // Trigger confetti animation whenever player wins at max combo
        if (nowAtMaxCombo) {
            triggerConfetti();
        }

        // Update fake streamer mood (prediction win)
        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(true, profit, prediction.amount);
        }
        
        showNotification(`Prediction won! +$${profit.toLocaleString()} 🔥`, 'success');
    } else {
        // Player loses - bet is already deducted
        prediction.result = -prediction.amount;
        
        if (typeof SecurityService !== 'undefined') {
            SecurityService.logTransaction('prediction_loss', { 
                id: prediction.id, 
                loss: prediction.amount,
                currentPrice: currentPrice,
                intervalMin: prediction.intervalMin,
                intervalMax: prediction.intervalMax
            });
        }
        
        handleLoss(); // Reset streak and bet
        flashTradingScreen(false); // Red flash for loss

        // Update fake streamer mood (prediction loss)
        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(false, -prediction.amount, prediction.amount);
        }

        showNotification(`Prediction lost -$${prediction.amount.toLocaleString()}`, 'error');
    }
    
    // Remove prediction after 4 seconds
    setTimeout(() => {
        const index = state.predictions.indexOf(prediction);
        if (index > -1) {
            state.predictions.splice(index, 1);
            // Re-render chart
            if (typeof drawChartSmooth === 'function') {
                drawChartSmooth();
            }
        }
    }, 4000);
    
    // Re-render chart to update prediction display
    if (typeof drawChartSmooth === 'function') {
        drawChartSmooth();
    }
    
    autoSave(); // Save after prediction resolves
}

function updatePositions() {
    const now = Date.now();
    state.positions.forEach(pos => {
        if (pos.resolved) return; // Skip already resolved positions
        
        const elapsed = (now - pos.startTime) / 1000;
        const remaining = pos.duration - elapsed;

        if (remaining <= 0 && !pos.resolved) {
            resolvePosition(pos);
        }
    });
    renderPositions();
}

function renderPositions() {
    const container = document.getElementById('activePositions');
    // Disabled: Don't show position bubbles
    if (container) {
        container.innerHTML = '';
    }
    return;
    
    // Filter positions by current stock symbol
    const currentStockPositions = state.positions.filter(p => p.stockSymbol === state.dataMode);
    
    if (currentStockPositions.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Update existing positions in place when possible to avoid flicker
    const existingChips = container.querySelectorAll('.position-chip');
    const existingIds = new Set();
    existingChips.forEach(chip => existingIds.add(chip.dataset.id));
    
    // Check if we need to rebuild (positions added/removed or resolved state changed)
    const currentIds = new Set(currentStockPositions.map(p => String(p.id)));
    const hasNewOrRemoved = currentStockPositions.length !== existingChips.length || 
        ![...currentIds].every(id => existingIds.has(id));
    
    // Check if any position changed from active to resolved
    const hasResolvedChange = currentStockPositions.some(pos => {
        if (!pos.resolved) return false;
        const chip = container.querySelector(`[data-id="${pos.id}"]`);
        return chip && !chip.classList.contains('resolved');
    });
    
    const needsRebuild = hasNewOrRemoved || hasResolvedChange;
    
    if (needsRebuild) {
        container.innerHTML = currentStockPositions.map(pos => {
            if (pos.resolved) {
                // Show resolved state with result
                const resultDisplay = pos.result >= 0 
                    ? `+$${pos.result.toLocaleString()}` 
                    : `-$${Math.abs(pos.result).toLocaleString()}`;
                const resultClass = pos.won ? 'won' : 'lost';
                return `
                    <div class="position-chip ${pos.direction} resolved ${resultClass}" data-id="${pos.id}">
                        <span class="position-direction">${pos.direction}</span>
                        <span class="position-amount">$${pos.amount}</span>
                        <span class="position-result ${resultClass}">${resultDisplay}</span>
                    </div>
                `;
            } else {
                // Show active position
                const delta = ((state.displayPrice - pos.entryPrice) / pos.entryPrice) * 100;
                const deltaDisplay = (delta >= 0 ? '+' : '') + delta.toFixed(2) + '%';
                const deltaClass = delta >= 0 ? 'positive' : 'negative';
                return `
                    <div class="position-chip ${pos.direction}" data-id="${pos.id}">
                        <span class="position-direction">${pos.direction}</span>
                        <span class="position-amount">$${pos.amount}</span>
                        <span class="position-timer">${pos.remaining}s</span>
                        <span class="position-pnl ${deltaClass}">${deltaDisplay}</span>
                    </div>
                `;
            }
        }).join('');
    } else {
        // Just update the changing values
        currentStockPositions.forEach(pos => {
            const chip = container.querySelector(`[data-id="${pos.id}"]`);
            if (!chip) return;
            
            if (pos.resolved) {
                // Update resolved position if needed
                const resultDisplay = pos.result >= 0 
                    ? `+$${pos.result.toLocaleString()}` 
                    : `-$${Math.abs(pos.result).toLocaleString()}`;
                const resultClass = pos.won ? 'won' : 'lost';
                
                // Update chip classes
                chip.className = `position-chip ${pos.direction} resolved ${resultClass}`;
                
                // Update result display
                let resultEl = chip.querySelector('.position-result');
                if (!resultEl) {
                    // Replace timer with result if not already done
                    const timerEl = chip.querySelector('.position-timer');
                    const pnlEl = chip.querySelector('.position-pnl');
                    if (timerEl) timerEl.remove();
                    if (pnlEl) pnlEl.remove();
                    resultEl = document.createElement('span');
                    resultEl.className = `position-result ${resultClass}`;
                    chip.appendChild(resultEl);
                }
                resultEl.textContent = resultDisplay;
                resultEl.className = `position-result ${resultClass}`;
            } else {
                // Update active position
                const delta = ((state.displayPrice - pos.entryPrice) / pos.entryPrice) * 100;
                const deltaDisplay = (delta >= 0 ? '+' : '') + delta.toFixed(2) + '%';
                const deltaClass = delta >= 0 ? 'positive' : 'negative';
                
                const timerEl = chip.querySelector('.position-timer');
                const pnlEl = chip.querySelector('.position-pnl');
                
                if (timerEl) timerEl.textContent = Math.ceil(pos.remaining) + 's';
                if (pnlEl) {
                    pnlEl.textContent = deltaDisplay;
                    pnlEl.className = 'position-pnl ' + deltaClass;
                }
            }
        });
    }
}

function resolvePosition(pos) {
    if (pos.resolved) return; // Already resolved

    // Get current price for the position's stock symbol
    const currentPrice = pos.stockSymbol === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[pos.stockSymbol]
            ? state.chartPrices[pos.stockSymbol].currentPrice
            : stockConfig[pos.stockSymbol]?.basePrice || 100);

    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('resolvePosition', {
            amount: pos.amount,
            entryPrice: pos.entryPrice,
            currentPrice: currentPrice,
            direction: pos.direction
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_position_resolution', { id: pos.id, reason: validation.reason });
            return;
        }
    }
    
    const priceChange = (currentPrice - pos.entryPrice) / pos.entryPrice;
    const won = 
        (pos.direction === 'long' && priceChange > 0) ||
        (pos.direction === 'short' && priceChange < 0);

    // Mark as resolved
    pos.resolved = true;
    pos.won = won;
    
    // Check if this is a bot position (don't affect streak)
    const isBotPosition = pos.isBotPosition === true;
    
    if (won) {
        // Fixed 2x multiplier - no movement bonus
        const winnings = Math.floor(pos.amount * 2);
        state.balance += winnings;
        updateBalance();
        const profit = winnings - pos.amount;
        pos.result = profit; // Store profit for display
        if (typeof SecurityService !== 'undefined') {
            SecurityService.logTransaction('position_win', { id: pos.id, profit, winnings, isBot: isBotPosition });
        }
        
        // Only affect streak for manual positions
        if (!isBotPosition) {
            // Check if at max combo after handling win
            const betAmounts = typeof getCurrentBetAmounts === 'function' ? getCurrentBetAmounts() : BET_AMOUNTS;
            
            handleWin(); // Increase streak and bet
            
            // Check if player is at max combo
            const nowAtMaxCombo = state.betIndex >= betAmounts.length - 1;
            
            flashTradingScreen(true); // Green flash for win
            
            // Play appropriate sound based on combo level
            if (nowAtMaxCombo) {
                AudioManager.playSuccessfulDealMaxCombo(); // Play max combo sound
            } else {
                AudioManager.playSuccessfulDeal(); // Play regular success sound
            }
            
            // Trigger confetti animation whenever player wins at max combo
            if (nowAtMaxCombo) {
                triggerConfetti();
            }

            // Update fake streamer mood (manual position win)
            if (typeof updateStreamerMoodOnTrade === 'function') {
                updateStreamerMoodOnTrade(true, profit, pos.amount);
            }
            
            showNotification(`+$${profit.toLocaleString()} 🔥`, 'success');
        } else {
            // Bot position win - play sound at 10% volume
            AudioManager.playSuccessfulDeal(0.1); // 10% of original volume
            showNotification(`Bot: +$${profit.toLocaleString()}`, 'info');
            
            // Update bot stats and track earnings
            if (typeof updateBotStats === 'function') {
                updateBotStats(pos.botId, true);
            }
            
            // Track earnings in bot's history
            const bot = state.bots.find(b => b.id === pos.botId);
            if (bot) {
                if (!bot.earningsHistory) {
                    bot.earningsHistory = [];
                }
                bot.earningsHistory.push({
                    timestamp: Date.now(),
                    profit: profit,
                    amount: pos.amount,
                    won: true
                });
            }
        }
    } else {
        pos.result = -pos.amount; // Store loss for display
        if (typeof SecurityService !== 'undefined') {
            SecurityService.logTransaction('position_loss', { id: pos.id, loss: pos.amount, isBot: isBotPosition });
        }
        
        // Only affect streak for manual positions
        if (!isBotPosition) {
            handleLoss(); // Reset streak and bet
            flashTradingScreen(false); // Red flash for loss

            // Update fake streamer mood (manual position loss)
            if (typeof updateStreamerMoodOnTrade === 'function') {
                updateStreamerMoodOnTrade(false, -pos.amount, pos.amount);
            }

            showNotification(`-$${pos.amount.toLocaleString()}`, 'error');
        } else {
            // Bot position loss - play error sound at 10% volume
            AudioManager.playError(0.1); // 10% of original volume
            showNotification(`Bot: -$${pos.amount.toLocaleString()}`, 'info');
            
            // Update bot stats and track earnings
            if (typeof updateBotStats === 'function') {
                updateBotStats(pos.botId, false);
            }
            
            // Track earnings in bot's history
            const bot = state.bots.find(b => b.id === pos.botId);
            if (bot) {
                if (!bot.earningsHistory) {
                    bot.earningsHistory = [];
                }
                bot.earningsHistory.push({
                    timestamp: Date.now(),
                    profit: -pos.amount,
                    amount: pos.amount,
                    won: false
                });
            }
        }
    }
    
    // Remove position after 4 seconds
    setTimeout(() => {
        const index = state.positions.indexOf(pos);
        if (index > -1) {
            state.positions.splice(index, 1);
            renderPositions();
        }
    }, 4000);
    
    // Re-render to show resolved state
    renderPositions();
    autoSave(); // Save after position resolves
    
    // Check for game over condition
    if (typeof checkGameOver === 'function') {
        checkGameOver();
    }
}

// Stock Trading Functions
function buyStock() {
    // Check if stock trading is unlocked
    if (typeof isStockTradingUnlocked === 'function' && !isStockTradingUnlocked()) {
        showNotification('Purchase "Stock Trading Unlock" upgrade to unlock stock trading', 'error');
        AudioManager.playError();
        return;
    }
    
    // Check timing lock
    if (!canPlaceBet()) {
        const remaining = getBetLockRemaining();
        showNotification(`Please wait ${remaining}s before buying again`, 'error');
        return;
    }
    
    const amount = getCurrentBet();
    const fee = STOCK_PURCHASE_FEE;
    const totalCostWithFee = amount + fee;

    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('buyStock', {
            amount,
            totalCost: totalCostWithFee,
            balance: state.balance,
            price: state.currentPrice
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_buy', { amount, totalCostWithFee, balance: state.balance });
            showNotification(validation.reason, 'error');
            return;
        }
        SecurityService.logTransaction('buyStock', { amount, fee, price: state.currentPrice });
    }
    
    // Check if player has enough for amount + fee
    if (totalCostWithFee > state.balance) {
        showNotification(`Insufficient funds (need $${totalCostWithFee} including $${fee} fee)`, 'error');
        return;
    }
    
    // Play click sound for buying stock
    AudioManager.playClick();
    
    const symbol = state.dataMode;
    const price = state.currentPrice;
    const sharesToBuy = amount / price;
    
    // Deduct amount + fee from balance
    state.balance -= totalCostWithFee;
    updateBalance();
    
    // Get or create holding for this symbol
    if (!state.stockHoldings[symbol]) {
        state.stockHoldings[symbol] = {
            shares: 0,
            avgPrice: 0,
            totalInvested: 0
        };
    }
    
    const holding = state.stockHoldings[symbol];
    
    // Calculate new average price (only count the stock amount, not the fee)
    const totalShares = holding.shares + sharesToBuy;
    const totalCost = holding.totalInvested + amount;
    holding.avgPrice = totalCost / totalShares;
    holding.shares = totalShares;
    holding.totalInvested = totalCost;
    
    const now = Date.now();
    state.lastBetTime = now; // Update bet lock timer
    
    renderStockHolding();
    autoSave(); // Save after buying stock
    showNotification(`Bought ${sharesToBuy.toFixed(4)} shares @ $${price.toFixed(2)} (fee: $${fee})`, 'success');
}

function sellStock() {
    // Check if stock trading is unlocked
    if (typeof isStockTradingUnlocked === 'function' && !isStockTradingUnlocked()) {
        showNotification('Purchase "Stock Trading Unlock" upgrade to unlock stock trading', 'error');
        AudioManager.playError();
        return;
    }
    
    const symbol = state.dataMode;
    const holding = state.stockHoldings[symbol];
    
    if (!holding || holding.shares === 0) {
        showNotification('No shares to sell', 'error');
        return;
    }

    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('sellStock', {
            amount: holding.totalInvested,
            shares: holding.shares,
            price: state.currentPrice
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_sell', { shares: holding.shares, price: state.currentPrice });
            showNotification(validation.reason, 'error');
            return;
        }
        SecurityService.logTransaction('sellStock', { shares: holding.shares, price: state.currentPrice });
    }
    
    // Play click sound for selling
    AudioManager.playClick();
    
    const price = state.currentPrice;
    const proceeds = holding.shares * price;
    const pnl = proceeds - holding.totalInvested;
    
    // Add proceeds to balance
    state.balance += proceeds;
    updateBalance();
    
    // Clear the holding
    const sharesSold = holding.shares;
    holding.shares = 0;
    holding.avgPrice = 0;
    holding.totalInvested = 0;
    
    renderStockHolding();
    autoSave(); // Save after selling stock
    
    if (pnl >= 0) {
        flashTradingScreen(true); // Green flash for profit
        AudioManager.playSuccessfulDeal(); // Play success sound

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(true, pnl, holding.totalInvested || Math.abs(pnl));
        }

        showNotification(`Sold ${sharesSold.toFixed(4)} shares +$${pnl.toFixed(2)}`, 'success');
    } else {
        flashTradingScreen(false); // Red flash for loss

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(false, pnl, holding.totalInvested || Math.abs(pnl));
        }

        showNotification(`Sold ${sharesSold.toFixed(4)} shares -$${Math.abs(pnl).toFixed(2)}`, 'error');
    }
    
    // Check for game over condition
    if (typeof checkGameOver === 'function') {
        checkGameOver();
    }
}

// Helper function to sell stock by symbol
function sellStockBySymbol(symbol) {
    const holding = state.stockHoldings[symbol];
    
    if (!holding || holding.shares === 0) {
        return { sold: false, reason: 'No shares to sell' };
    }

    // Get current price for this symbol
    const prices = state.chartPrices[symbol];
    const config = stockConfig[symbol];
    const currentPrice = prices ? prices.displayPrice : (config ? config.basePrice : 0);
    
    if (currentPrice <= 0) {
        return { sold: false, reason: 'Invalid price' };
    }

    if (typeof SecurityService !== 'undefined') {
        const validation = SecurityService.validateTransaction('sellStock', {
            amount: holding.totalInvested,
            shares: holding.shares,
            price: currentPrice
        });
        if (!validation.ok) {
            SecurityService.addFlag('invalid_sell', { shares: holding.shares, price: currentPrice });
            return { sold: false, reason: validation.reason };
        }
        SecurityService.logTransaction('sellStock', { shares: holding.shares, price: currentPrice, symbol });
    }
    
    const proceeds = holding.shares * currentPrice;
    const pnl = proceeds - holding.totalInvested;
    
    // Add proceeds to balance
    state.balance += proceeds;
    updateBalance();
    
    // Clear the holding
    const sharesSold = holding.shares;
    holding.shares = 0;
    holding.avgPrice = 0;
    holding.totalInvested = 0;
    
    // Update display if this is the current stock
    if (state.dataMode === symbol) {
        renderStockHolding();
    }
    
    return { 
        sold: true, 
        symbol, 
        sharesSold, 
        proceeds, 
        pnl,
        currentPrice 
    };
}

// Sell all stocks in portfolio
function sellAllStocks() {
    const holdings = Object.keys(state.stockHoldings).filter(symbol => {
        const holding = state.stockHoldings[symbol];
        return holding && holding.shares > 0;
    });
    
    if (holdings.length === 0) {
        showNotification('No stocks to sell', 'error');
        return;
    }
    
    AudioManager.playClick();
    
    let totalProceeds = 0;
    let totalPnl = 0;
    let soldCount = 0;
    const results = [];
    
    holdings.forEach(symbol => {
        const result = sellStockBySymbol(symbol);
        if (result.sold) {
            totalProceeds += result.proceeds;
            totalPnl += result.pnl;
            soldCount++;
            results.push(result);
        }
    });
    
    if (soldCount === 0) {
        showNotification('Failed to sell any stocks', 'error');
        return;
    }
    
    autoSave();
    renderPortfolioOverlay();
    
    if (totalPnl >= 0) {
        flashTradingScreen(true);
        AudioManager.playSuccessfulDeal();

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(true, totalPnl, Math.abs(totalPnl));
        }

        showNotification(`Sold ${soldCount} stock${soldCount > 1 ? 's' : ''} +$${totalPnl.toFixed(2)}`, 'success');
    } else {
        flashTradingScreen(false);

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(false, totalPnl, Math.abs(totalPnl));
        }

        showNotification(`Sold ${soldCount} stock${soldCount > 1 ? 's' : ''} -$${Math.abs(totalPnl).toFixed(2)}`, 'error');
    }
}

// Sell all profitable stocks in portfolio
function sellAllProfitableStocks() {
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
    
    if (holdings.length === 0) {
        showNotification('No profitable stocks to sell', 'error');
        return;
    }
    
    AudioManager.playClick();
    
    let totalProceeds = 0;
    let totalPnl = 0;
    let soldCount = 0;
    
    holdings.forEach(symbol => {
        const result = sellStockBySymbol(symbol);
        if (result.sold) {
            totalProceeds += result.proceeds;
            totalPnl += result.pnl;
            soldCount++;
        }
    });
    
    if (soldCount === 0) {
        showNotification('Failed to sell any stocks', 'error');
        return;
    }
    
    autoSave();
    renderPortfolioOverlay();
    
    flashTradingScreen(true);
    AudioManager.playSuccessfulDeal();
    showNotification(`Sold ${soldCount} profitable stock${soldCount > 1 ? 's' : ''} +$${totalPnl.toFixed(2)}`, 'success');
}

function renderStockHolding() {
    const container = document.getElementById('stockHoldingCompact');
    if (!container) return;
    
    const holding = getCurrentStockHolding();
    
    if (!holding || holding.shares === 0) {
        container.innerHTML = '';
        container.classList.remove('visible');
        return;
    }
    
    container.classList.add('visible');
    
    const pnl = getStockPnL(holding);
    const pnlClass = pnl.value >= 0 ? 'positive' : 'negative';
    const pnlSign = pnl.value >= 0 ? '+' : '';
    
    container.innerHTML = `
        <span class="stock-compact-label">STOCK</span>
        <span class="stock-compact-shares">${holding.shares.toFixed(4)} @ $${holding.avgPrice.toFixed(2)}</span>
        <span class="stock-compact-divider"></span>
        <span class="stock-compact-pnl ${pnlClass}">${pnlSign}$${pnl.value.toFixed(2)} (${pnlSign}${pnl.percent.toFixed(2)}%)</span>
    `;
}

// Update stock holding display (called in animation loop)
function updateStockHoldingDisplay() {
    const container = document.getElementById('stockHoldingCompact');
    if (!container) return;
    
    const holding = getCurrentStockHolding();
    if (!holding || holding.shares === 0) return;
    
    const pnl = getStockPnL(holding);
    const pnlClass = pnl.value >= 0 ? 'positive' : 'negative';
    const pnlSign = pnl.value >= 0 ? '+' : '';
    
    // Update the P&L value without full re-render
    const pnlEl = container.querySelector('.stock-compact-pnl');
    if (pnlEl) {
        pnlEl.className = `stock-compact-pnl ${pnlClass}`;
        pnlEl.textContent = `${pnlSign}$${pnl.value.toFixed(2)} (${pnlSign}${pnl.percent.toFixed(2)}%)`;
    }
}

// ===========================================
// MARGIN TRADING FUNCTIONS
// ===========================================
// Margin trading constants are defined in config.js:
// - MARGIN_TICKS_PHASE_1
// - MARGIN_TICKS_PHASE_2
// - MARGIN_MULTIPLIER

// Open a margin position
function openMarginPosition(direction) {
    // Check if margin trading is unlocked
    if (typeof isMarginTradingUnlocked === 'function' && !isMarginTradingUnlocked()) {
        showNotification('Purchase "Margin Trading Unlock" upgrade to unlock margin trading', 'error');
        AudioManager.playError();
        return;
    }
    
    // Check if there's already an active margin position
    if (state.marginPosition) {
        showNotification('Close your current margin position first', 'error');
        return;
    }
    
    // Check timing lock
    if (!canPlaceBet()) {
        const remaining = getBetLockRemaining();
        showNotification(`Please wait ${remaining}s before trading again`, 'error');
        return;
    }
    
    const amount = getCurrentBet();
    
    if (amount > state.balance) {
        showNotification('Insufficient funds', 'error');
        return;
    }
    
    // Play click sound
    AudioManager.playClick();
    
    // Deduct bet amount
    state.balance -= amount;
    updateBalance();
    
    const now = Date.now();
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    
    // Create margin position
    state.marginPosition = {
        id: now,
        direction: direction,
        amount: amount,
        entryPrice: state.currentPrice,
        startTick: currentTick,
        stockSymbol: state.dataMode,
        phase: 'locked' // 'locked' or 'closable'
    };
    
    state.lastBetTime = now; // Update bet lock timer
    
    // Hide margin buttons, show close button
    renderMarginPosition();
    
    const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : MARGIN_MULTIPLIER;
    showNotification(`${direction.toUpperCase()} margin position opened (x${multiplier})`, 'success');
    autoSave();
}

// Close margin position
function closeMarginPosition() {
    if (!state.marginPosition) return;
    
    // Check if position is in closable phase
    if (state.marginPosition.phase === 'locked') {
        showNotification('Position is still locked. Wait for the timer to finish.', 'error');
        return;
    }
    
    resolveMarginPosition();
}

// Resolve margin position (called on close, margin call, or timeout)
function resolveMarginPosition() {
    if (!state.marginPosition) return;
    
    const position = state.marginPosition;
    
    // Get current price for the position's stock symbol
    const currentPrice = position.stockSymbol === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[position.stockSymbol]
            ? state.chartPrices[position.stockSymbol].currentPrice
            : stockConfig[position.stockSymbol]?.basePrice || 100);
    
    // Calculate price change
    const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
    const won = 
        (position.direction === 'long' && priceChange > 0) ||
        (position.direction === 'short' && priceChange < 0);
    
    // Calculate P&L (percentage change multiplied by bet amount and multiplier)
    const priceChangePercent = Math.abs(priceChange) * 100; // Convert to percentage
    const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : MARGIN_MULTIPLIER;
    const pnl = won 
        ? position.amount * (priceChangePercent / 100) * multiplier
        : -position.amount * (priceChangePercent / 100) * multiplier;
    
    // Round to 2 decimal places
    const roundedPnl = Math.round(pnl * 100) / 100;
    
    // Apply P&L to balance
    state.balance += position.amount + roundedPnl;
    updateBalance();
    
    // Flash screen
    flashTradingScreen(won);
    
    // Play sound
    if (won) {
        AudioManager.playSuccessfulDeal();

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(true, roundedPnl, position.amount);
        }

        showNotification(`Margin position closed! +$${roundedPnl.toFixed(2)} 🔥`, 'success');
    } else {
        AudioManager.playError();

        if (typeof updateStreamerMoodOnTrade === 'function') {
            updateStreamerMoodOnTrade(false, -Math.abs(roundedPnl), position.amount);
        }

        showNotification(`Margin position closed. -$${Math.abs(roundedPnl).toFixed(2)}`, 'error');
    }
    
    // Update streak (only for wins)
    if (won) {
        handleWin();
    } else {
        handleLoss();
    }
    
    // Clear margin position
    state.marginPosition = null;
    
    // Show margin buttons, hide close button
    renderMarginPosition();
    
    autoSave();
    
    // Check for game over condition
    if (typeof checkGameOver === 'function') {
        checkGameOver();
    }
}

// Check for margin call (auto-close if balance insufficient to cover loss)
function checkMarginCall() {
    if (!state.marginPosition) return false;
    
    const position = state.marginPosition;
    
    // Get current price
    const currentPrice = position.stockSymbol === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[position.stockSymbol]
            ? state.chartPrices[position.stockSymbol].currentPrice
            : stockConfig[position.stockSymbol]?.basePrice || 100);
    
    // Calculate potential loss
    const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
    const isLosing = 
        (position.direction === 'long' && priceChange < 0) ||
        (position.direction === 'short' && priceChange > 0);
    
    if (!isLosing) return false; // Only margin call on losing positions
    
    // Calculate potential loss (percentage change multiplied by bet amount and multiplier)
    const priceChangePercent = Math.abs(priceChange) * 100; // Convert to percentage
    const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : MARGIN_MULTIPLIER;
    const potentialLoss = position.amount * (priceChangePercent / 100) * multiplier;
    
    // Check if current balance can cover the loss
    // If balance < potentialLoss, margin call triggers
    if (state.balance < potentialLoss) {
        // Margin call - close position and set balance to 0
        const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : MARGIN_MULTIPLIER;
        const loss = position.amount * (priceChangePercent / 100) * multiplier;
        const roundedLoss = Math.round(loss * 100) / 100;
        
        // Set balance to 0 (player loses everything)
        state.balance = 0;
        updateBalance();
        
        // Flash screen red
        flashTradingScreen(false);
        AudioManager.playError();
        showNotification(`Margin call! Position closed. Balance: $0`, 'error');
        
        // Reset streak
        handleLoss();
        
        // Clear margin position
        state.marginPosition = null;
        
        // Show margin buttons, hide close button
        renderMarginPosition();
        
        autoSave();
        
        // Check for game over condition
        if (typeof checkGameOver === 'function') {
            checkGameOver();
        }
        
        return true;
    }
    
    return false;
}

// Update margin position (called every tick)
function updateMarginPosition() {
    if (!state.marginPosition) return;
    
    // Check for margin call first
    if (checkMarginCall()) {
        return; // Position was closed by margin call
    }
    
    const position = state.marginPosition;
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    const ticksElapsed = currentTick - position.startTick;
    
    // Phase 1: First 25 ticks (locked)
    if (ticksElapsed < MARGIN_TICKS_PHASE_1) {
        position.phase = 'locked';
    }
    // Phase 2: Next 25 ticks (closable)
    else if (ticksElapsed < MARGIN_TICKS_PHASE_1 + MARGIN_TICKS_PHASE_2) {
        position.phase = 'closable';
    }
    // Phase 3: Timeout - auto-close
    else {
        // Auto-close after second phase ends
        resolveMarginPosition();
        return;
    }
    
    // Update UI
    renderMarginPosition();
}

// Render margin position UI
function renderMarginPosition() {
    const marginButtons = document.getElementById('marginTradeButtons');
    const closeContainer = document.getElementById('marginCloseButtonContainer');
    const closeButton = document.getElementById('marginCloseButton');
    const closeText = document.getElementById('marginCloseText');
    const closePnl = document.getElementById('marginClosePnl');
    const timerBar = document.getElementById('marginTimerBar');
    const timerFill = document.getElementById('marginTimerFill');
    
    if (!state.marginPosition) {
        // No active position - show margin buttons, hide close button
        if (marginButtons) marginButtons.style.display = 'flex';
        if (closeContainer) closeContainer.style.display = 'none';
        return;
    }
    
    // Active position - hide margin buttons, show close button
    if (marginButtons) marginButtons.style.display = 'none';
    if (closeContainer) closeContainer.style.display = 'block';
    
    const position = state.marginPosition;
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    const ticksElapsed = currentTick - position.startTick;
    
    // Calculate P&L
    const currentPrice = position.stockSymbol === state.dataMode
        ? state.currentPrice
        : (state.chartPrices && state.chartPrices[position.stockSymbol]
            ? state.chartPrices[position.stockSymbol].currentPrice
            : stockConfig[position.stockSymbol]?.basePrice || 100);
    
    const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
    const won = 
        (position.direction === 'long' && priceChange > 0) ||
        (position.direction === 'short' && priceChange < 0);
    
    // Calculate P&L (percentage change multiplied by bet amount and multiplier)
    const priceChangePercent = Math.abs(priceChange) * 100; // Convert to percentage
    const multiplier = typeof getMarginMultiplier === 'function' ? getMarginMultiplier() : MARGIN_MULTIPLIER;
    const pnl = won 
        ? position.amount * (priceChangePercent / 100) * multiplier
        : -position.amount * (priceChangePercent / 100) * multiplier;
    const roundedPnl = Math.round(pnl * 100) / 100;
    
    // Update P&L display
    if (closePnl) {
        const pnlClass = roundedPnl >= 0 ? 'positive' : 'negative';
        const pnlSign = roundedPnl >= 0 ? '+' : '';
        closePnl.className = `margin-close-pnl ${pnlClass}`;
        closePnl.textContent = `${pnlSign}$${Math.abs(roundedPnl).toFixed(2)}`;
    }
    
    // Update button state
    if (closeButton) {
        if (position.phase === 'locked') {
            closeButton.disabled = true;
            if (closeText) closeText.textContent = 'Position Locked';
        } else {
            closeButton.disabled = false;
            if (closeText) closeText.textContent = 'Close Position';
        }
    }
    
    // Update timer bar
    if (timerBar && timerFill) {
        let progress = 0;
        
        if (position.phase === 'locked') {
            // First phase: 0 to 100% (left to right)
            progress = ticksElapsed / MARGIN_TICKS_PHASE_1;
        } else {
            // Second phase: 0 to 100% (left to right) - bar resets visually
            const phase2Ticks = ticksElapsed - MARGIN_TICKS_PHASE_1;
            progress = phase2Ticks / MARGIN_TICKS_PHASE_2;
        }
        
        progress = Math.min(1, Math.max(0, progress));
        timerFill.style.width = `${progress * 100}%`;
    }
}

// Bots - Auto Trading Bot Management
// Bots analyze last 100 price points and make trading decisions

// ===========================================
// TECHNICAL INDICATORS
// ===========================================

// Calculate Simple Moving Average
function calculateSMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((acc, p) => acc + p, 0);
    return sum / period;
}

// Calculate Exponential Moving Average
function calculateEMA(prices, period) {
    if (prices.length < period) return null;
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
}

// Calculate RSI (Relative Strength Index) - using Wilder's smoothing method
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            avgGain += change;
        } else {
            avgLoss += Math.abs(change);
        }
    }
    
    avgGain = avgGain / period;
    avgLoss = avgLoss / period;
    
    // Apply Wilder's smoothing for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        
        // Wilder's smoothing: newAvg = (prevAvg * (period - 1) + current) / period
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// Calculate volatility (standard deviation of returns)
function calculateVolatility(prices, period = 20) {
    if (prices.length < period + 1) return null;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const slice = returns.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / period;
    return Math.sqrt(variance);
}

// Find support and resistance levels using local minima/maxima
function findSupportResistance(prices, lookback = 50) {
    if (prices.length < lookback) return { support: null, resistance: null };
    
    const slice = prices.slice(-lookback);
    
    // Find local minima (support) and maxima (resistance)
    const window = Math.max(3, Math.floor(lookback / 10)); // Window size for local extrema
    const minima = [];
    const maxima = [];
    
    for (let i = window; i < slice.length - window; i++) {
        const current = slice[i];
        let isMin = true;
        let isMax = true;
        
        // Check if current is local minimum
        for (let j = i - window; j <= i + window; j++) {
            if (j !== i && slice[j] < current) {
                isMin = false;
            }
            if (j !== i && slice[j] > current) {
                isMax = false;
            }
        }
        
        if (isMin) minima.push(current);
        if (isMax) maxima.push(current);
    }
    
    // Use median of minima for support, median of maxima for resistance
    // This is more robust than percentile method
    let support = null;
    let resistance = null;
    
    if (minima.length > 0) {
        minima.sort((a, b) => a - b);
        support = minima[Math.floor(minima.length / 2)];
    }
    
    if (maxima.length > 0) {
        maxima.sort((a, b) => a - b);
        resistance = maxima[Math.floor(maxima.length / 2)];
    }
    
    // Fallback to percentile method if no extrema found
    if (!support || !resistance) {
        const sorted = [...slice].sort((a, b) => a - b);
        support = support || sorted[Math.floor(sorted.length * 0.2)];
        resistance = resistance || sorted[Math.floor(sorted.length * 0.8)];
    }
    
    return { support, resistance };
}

// Check if price is near support/resistance
function isNearLevel(price, level, tolerance = 0.02) {
    if (!level) return false;
    const diff = Math.abs(price - level) / level;
    return diff <= tolerance;
}

// ===========================================
// BOT DECISION ENGINE
// ===========================================

// Evaluate bot conditions and return trading signal with detailed reasoning
function evaluateBotConditions(bot, currentPrice, history) {
    const reasoning = {
        hasData: false,
        indicatorValues: {},
        conditions: [],
        signal: null,
        confidence: 0,
        reason: ''
    };
    
    if (!history || history.length < 10) {
        reasoning.reason = 'Insufficient data (need at least 10 price points)';
        return { shouldEnter: false, direction: null, confidence: 0, reasoning };
    }
    
    // Extract prices from history
    const prices = history.map(h => h.value || h);
    if (prices.length === 0) {
        reasoning.reason = 'No price data available';
        return { shouldEnter: false, direction: null, confidence: 0, reasoning };
    }
    
    // Limit to last 100 points
    const recentPrices = prices.slice(-100);
    reasoning.hasData = true;
    
    const params = bot.params || {};
    let signal = null;
    let confidence = 0;
    
    switch (bot.strategy) {
        case 'trendFollowing': {
            const fastPeriod = params.fastMA || 10;
            const slowPeriod = params.slowMA || 30;
            const minSeparation = (params.minSeparationPercent || 0.5) / 100; // Minimum % separation required
            const trendStrength = params.trendStrength || 1.0; // Multiplier for trend strength requirement
            
            // Need at least one more point to detect crossover
            if (recentPrices.length < slowPeriod + 1) {
                reasoning.reason = `Need ${slowPeriod + 1} price points, have ${recentPrices.length}`;
                break;
            }
            
            const fastMA = calculateSMA(recentPrices, fastPeriod);
            const slowMA = calculateSMA(recentPrices, slowPeriod);
            
            reasoning.indicatorValues.fastMA = fastMA;
            reasoning.indicatorValues.slowMA = slowMA;
            
            if (fastMA && slowMA) {
                // Calculate previous period MAs (excluding last price) for crossover detection
                const prevPrices = recentPrices.slice(0, -1);
                const prevFast = calculateSMA(prevPrices, fastPeriod);
                const prevSlow = calculateSMA(prevPrices, slowPeriod);
                
                reasoning.indicatorValues.prevFastMA = prevFast;
                reasoning.indicatorValues.prevSlowMA = prevSlow;
                
                const maDiff = fastMA - slowMA;
                const maDiffPercent = ((maDiff / slowMA) * 100).toFixed(2);
                const separation = Math.abs(maDiff) / slowMA;
                
                // Check if separation meets minimum requirement
                const meetsMinSeparation = separation >= (minSeparation * trendStrength);
                reasoning.indicatorValues.separation = (separation * 100).toFixed(2) + '%';
                reasoning.indicatorValues.minSeparation = (minSeparation * trendStrength * 100).toFixed(2) + '%';
                
                if (!meetsMinSeparation) {
                    reasoning.reason = `MAs too close: ${(separation * 100).toFixed(2)}% separation < minimum ${(minSeparation * trendStrength * 100).toFixed(2)}%`;
                    reasoning.conditions.push(`Separation ${(separation * 100).toFixed(2)}% < minimum ${(minSeparation * trendStrength * 100).toFixed(2)}%`);
                    break;
                }
                
                // Check for crossover first (stronger signal)
                const isBullishCrossover = prevFast !== null && prevSlow !== null && prevFast <= prevSlow && fastMA > slowMA;
                const isBearishCrossover = prevFast !== null && prevSlow !== null && prevFast >= prevSlow && fastMA < slowMA;
                
                // Bullish: Fast MA above Slow MA (trend is up)
                if (fastMA > slowMA) {
                    signal = 'long';
                    if (isBullishCrossover) {
                        // Crossover gives higher confidence
                        confidence = Math.min(0.8, Math.max(0.5, separation * 25));
                        reasoning.reason = `Bullish crossover: Fast MA (${fastMA.toFixed(2)}) crossed above Slow MA (${slowMA.toFixed(2)})`;
                        reasoning.conditions.push(`Fast MA crossed above Slow MA (+${maDiffPercent}%)`);
                    } else {
                        // Established trend gives moderate confidence
                        confidence = Math.min(0.7, Math.max(0.4, separation * 20));
                        reasoning.reason = `Uptrend: Fast MA (${fastMA.toFixed(2)}) above Slow MA (${slowMA.toFixed(2)})`;
                        reasoning.conditions.push(`Fast MA > Slow MA (+${maDiffPercent}%)`);
                    }
                }
                // Bearish: Fast MA below Slow MA (trend is down)
                else if (fastMA < slowMA) {
                    signal = 'short';
                    if (isBearishCrossover) {
                        // Crossover gives higher confidence
                        confidence = Math.min(0.8, Math.max(0.5, separation * 25));
                        reasoning.reason = `Bearish crossover: Fast MA (${fastMA.toFixed(2)}) crossed below Slow MA (${slowMA.toFixed(2)})`;
                        reasoning.conditions.push(`Fast MA crossed below Slow MA (${maDiffPercent}%)`);
                    } else {
                        // Established trend gives moderate confidence
                        confidence = Math.min(0.7, Math.max(0.4, separation * 20));
                        reasoning.reason = `Downtrend: Fast MA (${fastMA.toFixed(2)}) below Slow MA (${slowMA.toFixed(2)})`;
                        reasoning.conditions.push(`Fast MA < Slow MA (${maDiffPercent}%)`);
                    }
                } else {
                    // MAs are equal or very close - no clear trend
                    reasoning.reason = `Fast MA (${fastMA.toFixed(2)}) and Slow MA (${slowMA.toFixed(2)}) are aligned, waiting for separation`;
                }
            } else {
                reasoning.reason = 'Could not calculate moving averages';
            }
            break;
        }
        
        case 'momentumReversal': {
            const period = params.rsiPeriod || 14;
            const oversold = params.oversoldThreshold || 30;
            const overbought = params.overboughtThreshold || 70;
            
            const rsi = calculateRSI(recentPrices, period);
            reasoning.indicatorValues.rsi = rsi;
            
            if (rsi !== null) {
                if (rsi < oversold) {
                    signal = 'long';
                    // Confidence increases as RSI gets further below oversold
                    // RSI 0 = max confidence (0.7), RSI 29 = min confidence (0.1)
                    const distanceBelow = oversold - rsi;
                    confidence = Math.min(0.7, Math.max(0.1, (distanceBelow / oversold) * 0.7));
                    reasoning.reason = `RSI oversold: ${rsi.toFixed(1)} < ${oversold} (buy signal)`;
                    reasoning.conditions.push(`RSI ${rsi.toFixed(1)} < Oversold ${oversold}`);
                } else if (rsi > overbought) {
                    signal = 'short';
                    // Confidence increases as RSI gets further above overbought
                    // RSI 100 = max confidence (0.7), RSI 71 = min confidence (0.1)
                    const distanceAbove = rsi - overbought;
                    confidence = Math.min(0.7, Math.max(0.1, (distanceAbove / (100 - overbought)) * 0.7));
                    reasoning.reason = `RSI overbought: ${rsi.toFixed(1)} > ${overbought} (sell signal)`;
                    reasoning.conditions.push(`RSI ${rsi.toFixed(1)} > Overbought ${overbought}`);
                } else {
                    reasoning.reason = `RSI: ${rsi.toFixed(1)} (neutral, waiting for ${oversold} or ${overbought})`;
                }
            } else {
                reasoning.reason = `Need ${period + 1} price points for RSI calculation`;
            }
            break;
        }
        
        case 'volatilityBreakout': {
            const lookback = params.lookbackPeriod || 20;
            const multiplier = params.volatilityMultiplier || 2.0;
            
            if (recentPrices.length < lookback + 1) {
                reasoning.reason = `Need ${lookback + 1} price points for volatility calculation`;
                break;
            }
            
            const volatility = calculateVolatility(recentPrices, lookback);
            const sma = calculateSMA(recentPrices, lookback);
            
            reasoning.indicatorValues.volatility = volatility;
            reasoning.indicatorValues.sma = sma;
            
            if (volatility && sma && !isNaN(volatility) && !isNaN(sma)) {
                const upperBand = sma + (sma * volatility * multiplier);
                const lowerBand = sma - (sma * volatility * multiplier);
                
                reasoning.indicatorValues.upperBand = upperBand;
                reasoning.indicatorValues.lowerBand = lowerBand;
                
                // Need at least 2 prices to detect breakout
                if (recentPrices.length >= 2) {
                    const prevPrice = recentPrices[recentPrices.length - 2];
                    
                    // Breakout above upper band
                    if (currentPrice > upperBand && prevPrice <= upperBand) {
                        signal = 'long';
                        const breakoutStrength = (currentPrice - upperBand) / upperBand;
                        confidence = Math.min(0.75, Math.max(0.3, breakoutStrength * 10));
                        reasoning.reason = `Breakout above upper band: $${currentPrice.toFixed(2)} > $${upperBand.toFixed(2)}`;
                        reasoning.conditions.push(`Price broke above upper band`);
                    }
                    // Breakout below lower band
                    else if (currentPrice < lowerBand && prevPrice >= lowerBand) {
                        signal = 'short';
                        const breakoutStrength = (lowerBand - currentPrice) / lowerBand;
                        confidence = Math.min(0.75, Math.max(0.3, breakoutStrength * 10));
                        reasoning.reason = `Breakout below lower band: $${currentPrice.toFixed(2)} < $${lowerBand.toFixed(2)}`;
                        reasoning.conditions.push(`Price broke below lower band`);
                    } else {
                        if (currentPrice > upperBand) {
                            reasoning.reason = `Price $${currentPrice.toFixed(2)} above upper band $${upperBand.toFixed(2)}, already broken out`;
                        } else if (currentPrice < lowerBand) {
                            reasoning.reason = `Price $${currentPrice.toFixed(2)} below lower band $${lowerBand.toFixed(2)}, already broken out`;
                        } else {
                            reasoning.reason = `Price $${currentPrice.toFixed(2)} between bands ($${lowerBand.toFixed(2)} - $${upperBand.toFixed(2)}), waiting for breakout`;
                        }
                    }
                } else {
                    reasoning.reason = 'Need at least 2 price points to detect breakout';
                }
            } else {
                reasoning.reason = `Could not calculate volatility bands`;
            }
            break;
        }
        
        case 'supportResistance': {
            const lookback = params.lookbackPeriod || 50;
            const tolerance = (params.tolerancePercent || 2) / 100;
            
            if (recentPrices.length < lookback) {
                reasoning.reason = `Need ${lookback} price points to calculate support/resistance`;
                break;
            }
            
            const levels = findSupportResistance(recentPrices, lookback);
            
            reasoning.indicatorValues.support = levels.support;
            reasoning.indicatorValues.resistance = levels.resistance;
            reasoning.indicatorValues.tolerance = tolerance * 100;
            
            if (levels.support && levels.resistance) {
                // Calculate distance to each level
                const distToSupport = Math.abs(currentPrice - levels.support) / levels.support;
                const distToResistance = Math.abs(currentPrice - levels.resistance) / levels.resistance;
                
                // Check if near support (buy signal)
                if (distToSupport <= tolerance) {
                    signal = 'long';
                    // Confidence based on how close to support (closer = higher confidence)
                    confidence = Math.max(0.4, 0.6 * (1 - (distToSupport / tolerance)));
                    reasoning.reason = `Near support: $${currentPrice.toFixed(2)} within ${(distToSupport * 100).toFixed(2)}% of support $${levels.support.toFixed(2)}`;
                    reasoning.conditions.push(`Price near support level`);
                }
                // Check if near resistance (sell signal)
                else if (distToResistance <= tolerance) {
                    signal = 'short';
                    // Confidence based on how close to resistance (closer = higher confidence)
                    confidence = Math.max(0.4, 0.6 * (1 - (distToResistance / tolerance)));
                    reasoning.reason = `Near resistance: $${currentPrice.toFixed(2)} within ${(distToResistance * 100).toFixed(2)}% of resistance $${levels.resistance.toFixed(2)}`;
                    reasoning.conditions.push(`Price near resistance level`);
                } else {
                    reasoning.reason = `Price $${currentPrice.toFixed(2)} not near levels (${(distToSupport * 100).toFixed(1)}% from support, ${(distToResistance * 100).toFixed(1)}% from resistance)`;
                }
            } else {
                reasoning.reason = `Could not calculate support/resistance levels`;
            }
            break;
        }
    }
    
    // Apply strategy direction filter
    if (signal && params.direction) {
        if (params.direction === 'long' && signal !== 'long') {
            reasoning.conditions.push(`Direction filter: Only LONG allowed, but signal is ${signal.toUpperCase()}`);
            signal = null;
        } else if (params.direction === 'short' && signal !== 'short') {
            reasoning.conditions.push(`Direction filter: Only SHORT allowed, but signal is ${signal.toUpperCase()}`);
            signal = null;
        } else if (params.direction === 'both') {
            reasoning.conditions.push(`Direction filter: Both directions allowed`);
        }
    }
    
    // Apply minimum confidence threshold
    const minConfidence = (params.minConfidence || 5) / 10;
    reasoning.indicatorValues.minConfidence = minConfidence;
    reasoning.indicatorValues.currentConfidence = confidence;
    
    if (confidence < minConfidence) {
        reasoning.conditions.push(`Confidence ${(confidence * 100).toFixed(1)}% < minimum ${(minConfidence * 100).toFixed(1)}%`);
        signal = null;
        confidence = 0;
    } else if (signal) {
        reasoning.conditions.push(`Confidence ${(confidence * 100).toFixed(1)}% >= minimum ${(minConfidence * 100).toFixed(1)}% ✓`);
    }
    
    reasoning.signal = signal;
    reasoning.confidence = confidence;
    
    if (!signal && !reasoning.reason) {
        reasoning.reason = 'No trading signal generated';
    }
    
    return {
        shouldEnter: signal !== null,
        direction: signal,
        confidence: confidence,
        reasoning: reasoning
    };
}

// ===========================================
// BOT POSITION MANAGEMENT
// ===========================================

// Open bot position (percentage of current bet based on upgrades, no streak effect)
function openBotPosition(bot, direction) {
    // Check timing lock (bots respect the same lock as manual bets)
    if (!canPlaceBet()) {
        return false;
    }
    
    // Calculate bot bet amount (percentage of current bet based on upgrades)
    const currentBet = getCurrentBet();
    const botBetPercentage = typeof getBotBetPercentage === 'function' ? getBotBetPercentage() : 0.1;
    const botBetAmount = Math.floor(currentBet * botBetPercentage);
    
    if (botBetAmount <= 0 || botBetAmount > state.balance) {
        return false;
    }
    
    // Get current price for currently observed chart
    const stockSymbol = state.dataMode;
    const prices = state.chartPrices[stockSymbol];
    if (!prices) return false;
    
    const currentPrice = prices.currentPrice;
    
    // Play click sound
    AudioManager.playClick();
    
    // Deduct balance
    state.balance -= botBetAmount;
    updateBalance();
    
    const now = Date.now();
    const position = {
        id: now,
        direction: direction,
        amount: botBetAmount,
        entryPrice: currentPrice,
        duration: 2,
        startTime: now,
        stockSymbol: stockSymbol,
        isBotPosition: true, // Mark as bot position
        botId: bot.id // Track which bot created this
    };
    
    // Computed remaining for backwards compatibility
    Object.defineProperty(position, 'remaining', {
        get: function() {
            return Math.max(0, this.duration - (Date.now() - this.startTime) / 1000);
        }
    });
    
    state.positions.push(position);
    state.lastBetTime = now; // Update bet lock timer (shared with manual bets)
    
    // Update bot's last trade time
    bot.lastTradeTime = now;
    
    renderPositions();
    return true;
}

// ===========================================
// BOT EXECUTION LOOP
// ===========================================

// Check if bot should exit its position (for trend following - exit on reversal)
function shouldBotExitPosition(bot, currentPrice, history) {
    if (bot.strategy !== 'trendFollowing') return false;
    
    // Find active position for this bot
    const activePosition = state.positions.find(pos => 
        pos.stockSymbol === state.dataMode && 
        pos.isBotPosition && 
        pos.botId === bot.id &&
        !pos.resolved &&
        pos.remaining > 0
    );
    
    if (!activePosition) return false;
    
    // Extract prices from history
    const prices = history.map(h => h.value || h);
    if (prices.length < 10) return false;
    
    const recentPrices = prices.slice(-100);
    const params = bot.params || {};
    const fastPeriod = params.fastMA || 10;
    const slowPeriod = params.slowMA || 30;
    
    if (recentPrices.length < slowPeriod + 1) return false;
    
    const fastMA = calculateSMA(recentPrices, fastPeriod);
    const slowMA = calculateSMA(recentPrices, slowPeriod);
    
    if (!fastMA || !slowMA) return false;
    
    // Exit if trend reversed
    // If we're long and Fast MA crossed below Slow MA, exit
    if (activePosition.direction === 'long' && fastMA < slowMA) {
        return true;
    }
    // If we're short and Fast MA crossed above Slow MA, exit
    if (activePosition.direction === 'short' && fastMA > slowMA) {
        return true;
    }
    
    return false;
}

// Execute all active bots
function executeBots() {
    // Only execute if game is started and we have balance
    if (!state.bots || state.bots.length === 0 || state.balance <= 0) return;
    
    state.bots.forEach(bot => {
        // Skip disabled bots
        if (!bot.enabled) return;
        
        // Get history for currently observed chart
        const stockSymbol = state.dataMode;
        const history = state.chartHistory[stockSymbol];
        
        if (!history || history.length === 0) return;
        
        // Get current price
        const prices = state.chartPrices[stockSymbol];
        if (!prices) return;
        
        const currentPrice = prices.currentPrice;
        
        // Check if bot already has an active position on current chart
        const activePosition = state.positions.find(pos => 
            pos.stockSymbol === stockSymbol && 
            pos.isBotPosition && 
            pos.botId === bot.id &&
            !pos.resolved &&
            pos.remaining > 0
        );
        
        // Check if bot should exit position (for trend following - exit on reversal)
        if (activePosition && shouldBotExitPosition(bot, currentPrice, history)) {
            // Update reasoning to show exit signal
            bot.lastReasoning = {
                hasData: true,
                indicatorValues: {},
                conditions: ['Trend reversed - exiting position'],
                signal: null,
                confidence: 0,
                reason: 'Trend reversed, closing position'
            };
            // Force close position immediately by resolving it
            if (typeof resolvePosition === 'function') {
                resolvePosition(activePosition);
                console.log(`Bot ${bot.name} exited position due to trend reversal`);
            }
            return; // Don't open new position this cycle
        }
        
        // Don't open new position if bot already has one
        if (activePosition) return;
        
        // Check cooldown period (if bot just closed a position)
        const cooldownSeconds = (bot.params && bot.params.cooldownSeconds) || 0;
        if (cooldownSeconds > 0 && bot.lastTradeTime > 0) {
            const secondsSinceLastTrade = (Date.now() - bot.lastTradeTime) / 1000;
            if (secondsSinceLastTrade < cooldownSeconds) {
                const remainingCooldown = Math.ceil(cooldownSeconds - secondsSinceLastTrade);
                // Update reasoning to show cooldown
                if (!bot.lastReasoning) bot.lastReasoning = {};
                bot.lastReasoning.reason = `Cooldown: ${remainingCooldown}s remaining before next trade`;
                return; // Still in cooldown
            }
        }
        
        // Evaluate bot conditions
        const signal = evaluateBotConditions(bot, currentPrice, history);
        
        // Add execution constraints to reasoning
        const currentBet = getCurrentBet();
        const botBetPercentage = typeof getBotBetPercentage === 'function' ? getBotBetPercentage() : 0.1;
        const botBetAmount = Math.floor(currentBet * botBetPercentage);
        const canBet = canPlaceBet();
        const hasFunds = botBetAmount > 0 && botBetAmount <= state.balance;
        
        if (signal.reasoning) {
            signal.reasoning.executionConstraints = {
                canBet: canBet,
                hasFunds: hasFunds,
                botBetAmount: botBetAmount,
                currentBet: currentBet,
                balance: state.balance
            };
            
            if (signal.shouldEnter && !canBet) {
                const remaining = getBetLockRemaining();
                signal.reasoning.conditions.push(`⏱️ Bet lock: ${remaining}s remaining`);
            }
            if (signal.shouldEnter && !hasFunds) {
                signal.reasoning.conditions.push(`💰 Insufficient funds: Need $${botBetAmount}, have $${state.balance}`);
            }
            if (signal.shouldEnter && canBet && hasFunds) {
                const percentageDisplay = Math.round(botBetPercentage * 100);
                signal.reasoning.conditions.push(`✅ Ready to trade: $${botBetAmount} (${percentageDisplay}% of $${currentBet})`);
            }
        }
        
        // Store reasoning for UI display
        bot.lastReasoning = signal.reasoning;
        bot.lastEvaluationTime = Date.now();
        
        if (signal.shouldEnter && signal.direction) {
            // Open position
            const success = openBotPosition(bot, signal.direction);
            if (success) {
                console.log(`Bot ${bot.name} opened ${signal.direction} position at $${currentPrice.toFixed(2)}`);
            }
        }
    });
    
    // Update UI if bots panel is visible
    if (document.getElementById('botsContent') && !document.getElementById('botsContent').classList.contains('hidden')) {
        renderActiveBots();
    }
}

// ===========================================
// BOT UI MANAGEMENT
// ===========================================

// Initialize bots panel (console mode)
function initBotsPanel() {
    // Ensure all bots have stats and earnings history initialized
    if (state.bots) {
        state.bots.forEach(bot => {
            if (!bot.stats) {
                bot.stats = { wins: 0, losses: 0, totalTrades: 0 };
            }
            if (!bot.earningsHistory) {
                bot.earningsHistory = [];
            }
            if (bot.viewExpanded === undefined) {
                bot.viewExpanded = false;
            }
            // Auto-generate name from strategy if missing
            if (!bot.name) {
                bot.name = getBotNameFromStrategy(bot.strategy);
            }
        });
    }
    
    // Setup console input handler
    const consoleInput = document.getElementById('consoleInput');
    if (consoleInput) {
        // Remove existing listener if any
        consoleInput.removeEventListener('keydown', handleConsoleInput);
        consoleInput.addEventListener('keydown', handleConsoleInput);
        consoleInput.focus();
    }
    
    // Update console status
    updateConsoleStatus();
    
    // Start real-time bot info updates
    startConsoleBotUpdates();
}

// Start periodic reasoning updates for visible bots
let botReasoningUpdateInterval = null;

function startBotReasoningUpdates() {
    // Clear existing interval
    if (botReasoningUpdateInterval) {
        clearInterval(botReasoningUpdateInterval);
    }
    
    // Update reasoning for all enabled bots every 2 seconds
    botReasoningUpdateInterval = setInterval(() => {
        // Only update if bots panel is visible
        const botsContent = document.getElementById('botsContent');
        if (!botsContent || botsContent.classList.contains('hidden')) return;
        
        if (!state.bots || state.bots.length === 0) return;
        
        // Update reasoning for each enabled bot
        state.bots.forEach(bot => {
            if (!bot.enabled) return;
            
            // Get history for currently observed chart
            const stockSymbol = state.dataMode;
            const history = state.chartHistory[stockSymbol];
            
            if (!history || history.length === 0) return;
            
            // Get current price
            const prices = state.chartPrices[stockSymbol];
            if (!prices) return;
            
            const currentPrice = prices.currentPrice;
            
            // Check if bot has active position on current chart
            const hasActivePosition = state.positions.some(pos => 
                pos.stockSymbol === stockSymbol && 
                pos.isBotPosition && 
                pos.botId === bot.id &&
                !pos.resolved &&
                pos.remaining > 0
            );
            
            // Don't evaluate if bot has active position
            if (hasActivePosition) return;
            
            // Evaluate bot conditions to update reasoning
            const signal = evaluateBotConditions(bot, currentPrice, history);
            bot.lastReasoning = signal.reasoning;
            bot.lastEvaluationTime = Date.now();
        });
        
        // Re-render to show updated reasoning
        renderActiveBots();
    }, 2000);
}

function stopBotReasoningUpdates() {
    if (botReasoningUpdateInterval) {
        clearInterval(botReasoningUpdateInterval);
        botReasoningUpdateInterval = null;
    }
}

// Update strategy parameters UI based on selected strategy
function updateStrategyParamsUI() {
    const strategySelect = document.getElementById('botStrategySelect');
    const paramsContainer = document.getElementById('botParamsContainer');
    
    if (!strategySelect || !paramsContainer) return;
    
    strategySelect.addEventListener('change', () => {
        renderStrategyParams(strategySelect.value);
    });
    
    // Initial render
    renderStrategyParams(strategySelect.value);
}

// Render strategy-specific parameters
function renderStrategyParams(strategy) {
    const paramsContainer = document.getElementById('botParamsContainer');
    if (!paramsContainer) return;
    
    let html = '';
    
    switch (strategy) {
        case 'trendFollowing':
            html = `
                <div class="bot-form-group">
                    <label class="bot-form-label">Fast MA Period</label>
                    <input type="number" class="bot-form-input" id="paramFastMA" value="10" min="5" max="50">
                    <div class="bot-param-hint">The Follower watches for crossovers between fast and slow lines</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Slow MA Period</label>
                    <input type="number" class="bot-form-input" id="paramSlowMA" value="30" min="20" max="100">
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Min Separation %</label>
                    <input type="number" class="bot-form-input" id="paramMinSeparation" value="0.5" min="0.1" max="5" step="0.1">
                    <div class="bot-param-hint">Minimum % gap between MAs to trade (higher = less trades, stronger trends)</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Trend Strength</label>
                    <input type="number" class="bot-form-input" id="paramTrendStrength" value="1.0" min="0.5" max="2.0" step="0.1">
                    <div class="bot-param-hint">Multiplier for trend strength (higher = requires stronger trends)</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Cooldown (seconds)</label>
                    <input type="number" class="bot-form-input" id="paramCooldown" value="0" min="0" max="60" step="1">
                    <div class="bot-param-hint">Wait time after closing position before trading again (reduces overtrading)</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Direction</label>
                    <select class="bot-form-select" id="paramDirection">
                        <option value="both">Both (Long & Short)</option>
                        <option value="long">Long Only</option>
                        <option value="short">Short Only</option>
                    </select>
                </div>
            `;
            break;
            
        case 'momentumReversal':
            html = `
                <div class="bot-form-group">
                    <label class="bot-form-label">RSI Period</label>
                    <input type="number" class="bot-form-input" id="paramRSIPeriod" value="14" min="5" max="30">
                    <div class="bot-param-hint">The Bouncer waits for RSI to hit extremes (below 30 or above 70)</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Oversold Threshold</label>
                    <input type="number" class="bot-form-input" id="paramOversold" value="30" min="20" max="40">
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Overbought Threshold</label>
                    <input type="number" class="bot-form-input" id="paramOverbought" value="70" min="60" max="80">
                </div>
            `;
            break;
            
        case 'volatilityBreakout':
            html = `
                <div class="bot-form-group">
                    <label class="bot-form-label">Lookback Period</label>
                    <input type="number" class="bot-form-input" id="paramLookback" value="20" min="10" max="50">
                    <div class="bot-param-hint">The Explorer watches for price to break outside normal movement bands</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Volatility Multiplier</label>
                    <input type="number" class="bot-form-input" id="paramVolatilityMult" value="2.0" min="1.5" max="3.0" step="0.1">
                </div>
            `;
            break;
            
        case 'supportResistance':
            html = `
                <div class="bot-form-group">
                    <label class="bot-form-label">Lookback Period</label>
                    <input type="number" class="bot-form-input" id="paramLookback" value="50" min="20" max="100">
                    <div class="bot-param-hint">The Shores finds floor (support) and ceiling (resistance) levels</div>
                </div>
                <div class="bot-form-group">
                    <label class="bot-form-label">Tolerance %</label>
                    <input type="number" class="bot-form-input" id="paramTolerance" value="2" min="1" max="5">
                </div>
            `;
            break;
    }
    
    // Add minimum confidence slider
    html += `
        <div class="bot-form-group">
            <label class="bot-form-label">Minimum Confidence (1-10)</label>
            <input type="number" class="bot-form-input" id="paramMinConfidence" value="5" min="1" max="10">
        </div>
    `;
    
    paramsContainer.innerHTML = html;
}

// Stock selector removed - bots now trade on currently observed chart

// Render active bots list
function renderActiveBots() {
    const botsList = document.getElementById('botsList');
    if (!botsList) return;
    
    const activeBots = state.bots || [];
    
    if (activeBots.length === 0) {
        botsList.innerHTML = '<div class="bots-empty">No active bots. Create a bot below to start auto trading.</div>';
        return;
    }
    
    botsList.innerHTML = activeBots.map(bot => {
        const strategyNames = {
            'trendFollowing': 'The Follower',
            'momentumReversal': 'The Bouncer',
            'volatilityBreakout': 'The Explorer',
            'supportResistance': 'The Shores'
        };
        
        const statusClass = bot.enabled ? 'bot-status-active' : 'bot-status-disabled';
        const statusText = bot.enabled ? 'Active' : 'Disabled';
        const isExpanded = bot.viewExpanded || false;
        
        // Calculate win rate
        const stats = bot.stats || { wins: 0, losses: 0, totalTrades: 0 };
        const winRate = stats.totalTrades > 0 
            ? ((stats.wins / stats.totalTrades) * 100).toFixed(0)
            : '0';
        
        // Calculate actual bet amount (percentage of current bet based on upgrades)
        const currentBet = typeof getCurrentBet === 'function' ? getCurrentBet() : 100;
        const botBetPercentage = typeof getBotBetPercentage === 'function' ? getBotBetPercentage() : 0.1;
        const botBetAmount = Math.floor(currentBet * botBetPercentage);
        
        // Calculate lifetime earnings/losses
        let lifetimeEarnings = 0;
        if (bot.earningsHistory && bot.earningsHistory.length > 0) {
            lifetimeEarnings = bot.earningsHistory.reduce((sum, entry) => sum + entry.profit, 0);
        }
        state.positions.forEach(pos => {
            if (pos.isBotPosition && pos.botId === bot.id && pos.resolved && pos.result !== undefined) {
                const inHistory = bot.earningsHistory && bot.earningsHistory.some(e => 
                    Math.abs(e.timestamp - pos.startTime) < 1000 && e.amount === pos.amount
                );
                if (!inHistory) {
                    lifetimeEarnings += pos.result;
                }
            }
        });
        const earningsDisplay = lifetimeEarnings >= 0 
            ? `+$${Math.abs(lifetimeEarnings).toLocaleString()}` 
            : `-$${Math.abs(lifetimeEarnings).toLocaleString()}`;
        const earningsClass = lifetimeEarnings >= 0 ? 'bot-earnings-positive' : 'bot-earnings-negative';
        
        // Get reasoning data
        const reasoning = bot.lastReasoning || {};
        const hasReasoning = reasoning && Object.keys(reasoning).length > 0;
        const signal = reasoning.signal;
        const confidence = reasoning.confidence || 0;
        const reason = reasoning.reason || 'Evaluating...';
        
        // Check if bot has active position
        const hasActivePosition = state.positions.some(pos => 
            pos.stockSymbol === state.dataMode && 
            pos.isBotPosition && 
            pos.botId === bot.id &&
            !pos.resolved &&
            pos.remaining > 0
        );
        
        // Format indicator values for display
        let indicatorText = '';
        if (reasoning.indicatorValues) {
            const ind = reasoning.indicatorValues;
            const parts = [];
            
            if (ind.fastMA !== undefined && ind.slowMA !== undefined) {
                parts.push(`MA: ${ind.fastMA?.toFixed(2) || 'N/A'}/${ind.slowMA?.toFixed(2) || 'N/A'}`);
            }
            if (ind.rsi !== undefined) {
                parts.push(`RSI: ${ind.rsi.toFixed(1)}`);
            }
            if (ind.upperBand !== undefined && ind.lowerBand !== undefined) {
                parts.push(`Bands: $${ind.lowerBand.toFixed(2)}-$${ind.upperBand.toFixed(2)}`);
            }
            if (ind.support !== undefined && ind.resistance !== undefined) {
                parts.push(`S/R: $${ind.support.toFixed(2)}/$${ind.resistance.toFixed(2)}`);
            }
            
            indicatorText = parts.join(' • ');
        }
        
        // General info view (collapsed)
        const generalInfoView = `
            <div class="bot-card-general">
                <div class="bot-card-header-compact">
                    <div class="bot-card-strategy">${strategyNames[bot.strategy] || bot.strategy}</div>
                    <div class="bot-card-header-right">
                        <div class="bot-card-status-compact ${statusClass}">${statusText} ${winRate}%</div>
                        <button class="bot-card-toggle" onclick="event.stopPropagation(); toggleBot('${bot.id}')" title="${bot.enabled ? 'Disable' : 'Enable'}">
                            ${bot.enabled ? '⏸' : '▶'}
                        </button>
                        <button class="bot-card-delete" onclick="event.stopPropagation(); deleteBot('${bot.id}')" title="Delete Bot">×</button>
                    </div>
                </div>
                <div class="bot-card-stats-compact">
                    <div class="bot-stat-compact">
                        <span class="bot-stat-label-compact">Bet</span>
                        <span class="bot-stat-value-compact">$${botBetAmount.toLocaleString()}</span>
                    </div>
                    <div class="bot-stat-compact">
                        <span class="bot-stat-label-compact">Lifetime</span>
                        <span class="bot-stat-value-compact ${earningsClass}">${earningsDisplay}</span>
                    </div>
                </div>
                ${hasActivePosition ? `
                    <div class="bot-status-badge bot-status-badge-active">🟢 Active Position</div>
                ` : signal ? `
                    <div class="bot-status-badge bot-status-badge-signal">${signal.toUpperCase()} Signal ${(confidence * 100).toFixed(0)}%</div>
                ` : `
                    <div class="bot-status-badge bot-status-badge-idle">⚪ Idle</div>
                `}
            </div>
        `;
        
        // Thinking view (expanded)
        const thinkingView = `
            <div class="bot-card-thinking">
                <div class="bot-thinking-header">
                    <div class="bot-thinking-title">${strategyNames[bot.strategy] || bot.strategy}</div>
                    <div class="bot-thinking-header-right">
                        <div class="bot-thinking-status ${statusClass}">${statusText} ${winRate}%</div>
                        <button class="bot-card-toggle" onclick="event.stopPropagation(); toggleBot('${bot.id}')" title="${bot.enabled ? 'Disable' : 'Enable'}">
                            ${bot.enabled ? '⏸' : '▶'}
                        </button>
                        <button class="bot-card-delete" onclick="event.stopPropagation(); deleteBot('${bot.id}')" title="Delete Bot">×</button>
                    </div>
                </div>
                ${hasActivePosition ? `
                    <div class="bot-reasoning bot-reasoning-active">
                        <div class="bot-reasoning-status">🟢 Active Position</div>
                    </div>
                ` : hasReasoning ? `
                    <div class="bot-reasoning ${signal ? 'bot-reasoning-signal' : 'bot-reasoning-idle'}">
                        <div class="bot-reasoning-header">
                            <span class="bot-reasoning-status">${signal ? `🟢 ${signal.toUpperCase()} Signal` : '⚪ Idle'}</span>
                            ${confidence > 0 ? `<span class="bot-reasoning-confidence">${(confidence * 100).toFixed(0)}%</span>` : ''}
                        </div>
                        <div class="bot-reasoning-text">${reason}</div>
                        ${indicatorText ? `<div class="bot-reasoning-indicators">${indicatorText}</div>` : ''}
                        ${reasoning.conditions && reasoning.conditions.length > 0 ? `
                            <div class="bot-reasoning-conditions">
                                ${reasoning.conditions.map(c => `<div class="bot-condition-item">${c}</div>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <div class="bot-reasoning bot-reasoning-idle">
                        <div class="bot-reasoning-text">Waiting for evaluation...</div>
                    </div>
                `}
                <div class="bot-thinking-footer">
                    <div class="bot-thinking-footer-item">
                        <span class="bot-thinking-footer-label">Bet:</span>
                        <span class="bot-thinking-footer-value">$${botBetAmount.toLocaleString()}</span>
                    </div>
                    <div class="bot-thinking-footer-item">
                        <span class="bot-thinking-footer-label">Lifetime:</span>
                        <span class="bot-thinking-footer-value ${earningsClass}">${earningsDisplay}</span>
                    </div>
                </div>
            </div>
        `;
        
        return `
            <div class="bot-card ${isExpanded ? 'bot-card-expanded' : ''}" data-bot-id="${bot.id}" onclick="toggleBotView('${bot.id}')">
                ${isExpanded ? thinkingView : generalInfoView}
            </div>
        `;
    }).join('');
}

// Update bots count display
function updateBotsCount() {
    const botsCount = document.getElementById('botsCount');
    if (!botsCount) return;
    
    const activeBots = (state.bots || []).filter(b => b.enabled);
    botsCount.textContent = `${activeBots.length} active`;
}

// Get bot name from strategy
function getBotNameFromStrategy(strategy) {
    const strategyNames = {
        'trendFollowing': 'The Follower',
        'momentumReversal': 'The Bouncer',
        'volatilityBreakout': 'The Explorer',
        'supportResistance': 'The Shores'
    };
    return strategyNames[strategy] || 'Unknown Bot';
}

// Check if bot of this strategy already exists
function botStrategyExists(strategy) {
    return state.bots && state.bots.some(bot => bot.strategy === strategy);
}

// Create bot
function createBot() {
    const strategySelect = document.getElementById('botStrategySelect');
    
    if (!strategySelect) return;
    
    const strategy = strategySelect.value;
    
    // Validation
    if (!strategy) {
        showNotification('Please select a strategy', 'error');
        return;
    }
    
    // Check if bot of this strategy already exists
    if (botStrategyExists(strategy)) {
        showNotification(`${getBotNameFromStrategy(strategy)} already exists. Only one bot per strategy allowed.`, 'error');
        return;
    }
    
    // Collect strategy parameters
    const params = {};
    
    switch (strategy) {
        case 'trendFollowing': {
            const fastMA = document.getElementById('paramFastMA');
            const slowMA = document.getElementById('paramSlowMA');
            const minSeparation = document.getElementById('paramMinSeparation');
            const trendStrength = document.getElementById('paramTrendStrength');
            const cooldown = document.getElementById('paramCooldown');
            const direction = document.getElementById('paramDirection');
            params.fastMA = fastMA ? parseInt(fastMA.value) : 10;
            params.slowMA = slowMA ? parseInt(slowMA.value) : 30;
            params.minSeparationPercent = minSeparation ? parseFloat(minSeparation.value) : 0.5;
            params.trendStrength = trendStrength ? parseFloat(trendStrength.value) : 1.0;
            params.cooldownSeconds = cooldown ? parseInt(cooldown.value) : 0;
            params.direction = direction ? direction.value : 'both';
            break;
        }
        case 'momentumReversal': {
            const rsiPeriod = document.getElementById('paramRSIPeriod');
            const oversold = document.getElementById('paramOversold');
            const overbought = document.getElementById('paramOverbought');
            params.rsiPeriod = rsiPeriod ? parseInt(rsiPeriod.value) : 14;
            params.oversoldThreshold = oversold ? parseInt(oversold.value) : 30;
            params.overboughtThreshold = overbought ? parseInt(overbought.value) : 70;
            break;
        }
        case 'volatilityBreakout': {
            const lookback = document.getElementById('paramLookback');
            const mult = document.getElementById('paramVolatilityMult');
            params.lookbackPeriod = lookback ? parseInt(lookback.value) : 20;
            params.volatilityMultiplier = mult ? parseFloat(mult.value) : 2.0;
            break;
        }
        case 'supportResistance': {
            const lookback = document.getElementById('paramLookback');
            const tolerance = document.getElementById('paramTolerance');
            params.lookbackPeriod = lookback ? parseInt(lookback.value) : 50;
            params.tolerancePercent = tolerance ? parseInt(tolerance.value) : 2;
            break;
        }
    }
    
    // Get minimum confidence
    const minConf = document.getElementById('paramMinConfidence');
    params.minConfidence = minConf ? parseInt(minConf.value) : 5;
    
    // Create bot object (trades on currently observed chart)
    // Name is auto-generated from strategy
    const bot = {
        id: Date.now().toString(),
        name: getBotNameFromStrategy(strategy),
        enabled: true,
        strategy: strategy,
        params: params,
        createdAt: Date.now(),
        lastTradeTime: 0,
        // Win/loss tracking
        stats: {
            wins: 0,
            losses: 0,
            totalTrades: 0
        },
        // Earnings history
        earningsHistory: [],
        // UI state
        viewExpanded: false // Toggle state for card view
    };
    
    // Add to state
    if (!state.bots) {
        state.bots = [];
    }
    state.bots.push(bot);
    
    // Save state
    autoSave();
    
    // Clear form
    strategySelect.value = 'trendFollowing';
    renderStrategyParams('trendFollowing');
    
    // Update UI
    renderActiveBots();
    updateBotsCount();
    
    showNotification(`Bot "${name}" created!`, 'success');
    AudioManager.playClick();
}

// Toggle bot view (general info <-> thinking info)
function toggleBotView(botId) {
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;
    
    bot.viewExpanded = !bot.viewExpanded;
    renderActiveBots();
    AudioManager.playClick();
}

// Toggle bot enabled/disabled
function toggleBot(botId) {
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;
    
    bot.enabled = !bot.enabled;
    autoSave();
    
    renderActiveBots();
    updateBotsCount();
    
    showNotification(`${bot.name} ${bot.enabled ? 'enabled' : 'disabled'}`, 'info');
    AudioManager.playClick();
}

// Update bot stats (called when bot position resolves)
function updateBotStats(botId, won) {
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;
    
    // Initialize stats if not present (for bots created before stats were added)
    if (!bot.stats) {
        bot.stats = { wins: 0, losses: 0, totalTrades: 0 };
    }
    
    // Initialize earnings tracking if not present
    if (!bot.earningsHistory) {
        bot.earningsHistory = [];
    }
    
    if (won) {
        bot.stats.wins++;
    } else {
        bot.stats.losses++;
    }
    bot.stats.totalTrades++;
    
    // Update last trade time for cooldown tracking
    bot.lastTradeTime = Date.now();
    
    autoSave();
    
    // Update UI if bots panel is visible
    if (document.getElementById('botsContent') && !document.getElementById('botsContent').classList.contains('hidden')) {
        renderActiveBots();
    }
}

// Delete bot
function deleteBot(botId) {
    const bot = state.bots.find(b => b.id === botId);
    if (!bot) return;
    
    state.bots = state.bots.filter(b => b.id !== botId);
    autoSave();
    
    updateConsoleStatus();
    showNotification(`Bot "${bot.name}" deleted`, 'info');
    AudioManager.playClick();
}

// ===========================================
// CONSOLE COMMAND SYSTEM
// ===========================================

// Handle console input
function handleConsoleInput(event) {
    if (event.key === 'Enter') {
        const input = event.target;
        const command = input.value.trim();
        
        if (command) {
            // Echo command
            addConsoleLine(`> ${command}`, 'console-text');
            
            // Process command
            processConsoleCommand(command);
            
            // Clear input
            input.value = '';
        }
        
        event.preventDefault();
    } else if (event.key === 'ArrowUp') {
        // TODO: Command history (future enhancement)
        event.preventDefault();
    }
}

// Process console command
function processConsoleCommand(command) {
    const parts = command.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);
    
    // Stop show command refresh if another command is entered
    if (showCommandActive && cmd !== 'show' && cmd !== 'list') {
        showCommandActive = false;
        showOutputStartIndex = -1;
    }
    
    switch (cmd) {
        case 'help':
            showHelp();
            break;
        case 'create':
        case 'new':
            handleCreateCommand(args);
            break;
        case 'delete':
        case 'remove':
            handleDeleteCommand(args);
            break;
        case 'show':
        case 'list':
            handleShowCommand(args);
            break;
        case 'enable':
            handleEnableCommand(args);
            break;
        case 'disable':
            handleDisableCommand(args);
            break;
        case 'clear':
            clearConsole();
            break;
        default:
            addConsoleLine(`Unknown command: ${cmd}. Type 'help' for available commands.`, 'console-error');
    }
}

// Show help
function showHelp() {
    addConsoleLine('', 'console-info');
    addConsoleLine('Available Commands:', 'console-info');
    addConsoleLine('  create [fast] [slow] [separation] [strength] [cooldown] [confidence]', 'console-text');
    addConsoleLine('    - Create or update "The Follower" bot with parameters', 'console-text');
    addConsoleLine('    - Example: create 10 30 0.5 5 0 5', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  show', 'console-text');
    addConsoleLine('    - Show bot info (updates in real-time)', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  delete', 'console-text');
    addConsoleLine('    - Delete the bot', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  enable', 'console-text');
    addConsoleLine('    - Enable the bot', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  disable', 'console-text');
    addConsoleLine('    - Disable the bot', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  clear', 'console-text');
    addConsoleLine('    - Clear console output', 'console-text');
    addConsoleLine('', 'console-text');
    addConsoleLine('  help', 'console-text');
    addConsoleLine('    - Show this help message', 'console-text');
}

// Handle create command
function handleCreateCommand(args) {
    // Parse parameters with defaults
    const fastMA = args[0] ? parseInt(args[0]) : 10;
    const slowMA = args[1] ? parseInt(args[1]) : 30;
    const minSeparation = args[2] ? parseFloat(args[2]) : 0.5;
    const trendStrength = args[3] ? parseFloat(args[3]) : 10;
    const cooldown = args[4] ? parseInt(args[4]) : 5;
    const minConfidence = args[5] ? parseInt(args[5]) : 5;
    
    // Validate
    if (isNaN(fastMA) || isNaN(slowMA) || isNaN(minSeparation) || isNaN(trendStrength) || isNaN(cooldown) || isNaN(minConfidence)) {
        addConsoleLine('Error: Invalid parameters. Use: create [fast] [slow] [separation] [strength] [cooldown] [confidence]', 'console-error');
        return;
    }
    
    // Check if bot already exists - if so, update it instead of creating new
    let bot = state.bots && state.bots.length > 0 ? state.bots.find(b => b.strategy === 'trendFollowing') : null;
    
    if (bot) {
        // Update existing bot
        bot.params.fastMAPeriod = fastMA;
        bot.params.slowMAPeriod = slowMA;
        bot.params.minSeparationPercent = minSeparation;
        bot.params.trendStrength = trendStrength;
        bot.params.cooldownSeconds = cooldown;
        bot.params.minConfidence = minConfidence;
        
        autoSave();
        addConsoleLine(`Bot "${bot.name}" parameters updated!`, 'console-success');
        addConsoleLine(`  Fast MA: ${fastMA}, Slow MA: ${slowMA}, Min Separation: ${minSeparation}%`, 'console-text');
        addConsoleLine(`  Trend Strength: ${trendStrength}, Cooldown: ${cooldown}s, Min Confidence: ${minConfidence}/10`, 'console-text');
    } else {
        // Create new bot
        bot = {
            id: Date.now().toString(),
            name: 'The Follower',
            enabled: true,
            strategy: 'trendFollowing',
            params: {
                fastMAPeriod: fastMA,
                slowMAPeriod: slowMA,
                minSeparationPercent: minSeparation,
                trendStrength: trendStrength,
                cooldownSeconds: cooldown,
                minConfidence: minConfidence,
                direction: 'both'
            },
            createdAt: Date.now(),
            lastTradeTime: 0,
            stats: { wins: 0, losses: 0, totalTrades: 0 },
            earningsHistory: [],
            viewExpanded: false
        };
        
        if (!state.bots) {
            state.bots = [];
        }
        state.bots.push(bot);
        autoSave();
        
        addConsoleLine(`Bot "${bot.name}" created successfully!`, 'console-success');
        addConsoleLine(`  Fast MA: ${fastMA}, Slow MA: ${slowMA}, Min Separation: ${minSeparation}%`, 'console-text');
        addConsoleLine(`  Trend Strength: ${trendStrength}, Cooldown: ${cooldown}s, Min Confidence: ${minConfidence}/10`, 'console-text');
    }
    
    updateConsoleStatus();
    AudioManager.playClick();
}

// Handle delete command
function handleDeleteCommand(args) {
    const bot = state.bots && state.bots.length > 0 ? state.bots[0] : null;
    
    if (!bot) {
        addConsoleLine('Error: No bot found.', 'console-error');
        return;
    }
    
    state.bots = state.bots.filter(b => b.id !== bot.id);
    autoSave();
    
    addConsoleLine(`Bot "${bot.name}" deleted.`, 'console-success');
    updateConsoleStatus();
    AudioManager.playClick();
}

// Handle show command
function handleShowCommand(args) {
    // Mark show command as active
    showCommandActive = true;
    showCommandArgs = []; // Always show all bots (just one for now)
    
    // Record where show output starts
    const output = document.getElementById('consoleOutput');
    if (output) {
        showOutputStartIndex = output.querySelectorAll('.console-line').length;
    }
    
    // Always show all bots (detailed view)
    showAllBots(false);
}

// Show all bots
function showAllBots(skipHeader = false) {
    const bots = state.bots || [];
    
    if (bots.length === 0) {
        addConsoleLine('No bots found. Use "create" to create a bot.', 'console-warning');
        showCommandActive = false;
        return;
    }
    
    if (!skipHeader) {
        // Don't show header for single bot
    }
    // Always show detailed info
    bots.forEach(bot => {
        renderBotToConsole(bot, true);
    });
}

// Render bot info to console
function renderBotToConsole(bot, detailed = false) {
    const stats = bot.stats || { wins: 0, losses: 0, totalTrades: 0 };
    const winRate = stats.totalTrades > 0 
        ? ((stats.wins / stats.totalTrades) * 100).toFixed(0)
        : '0';
    
    const currentBet = typeof getCurrentBet === 'function' ? getCurrentBet() : 100;
    const botBetPercentage = typeof getBotBetPercentage === 'function' ? getBotBetPercentage() : 0.1;
    const botBetAmount = Math.floor(currentBet * botBetPercentage);
    
    let lifetimeEarnings = 0;
    if (bot.earningsHistory && bot.earningsHistory.length > 0) {
        lifetimeEarnings = bot.earningsHistory.reduce((sum, entry) => sum + entry.profit, 0);
    }
    const earningsDisplay = lifetimeEarnings >= 0 
        ? `+$${Math.abs(lifetimeEarnings).toLocaleString()}` 
        : `-$${Math.abs(lifetimeEarnings).toLocaleString()}`;
    
    const reasoning = bot.lastReasoning || {};
    const signal = reasoning.signal;
    const confidence = reasoning.confidence || 0;
    
    addConsoleLine('', 'console-text');
    addConsoleLine(`${bot.name}`, 'console-text');
    addConsoleLine(`  Status: ${bot.enabled ? 'ACTIVE' : 'DISABLED'} | Win Rate: ${winRate}%`, 'console-text');
    addConsoleLine(`  Bet: $${botBetAmount.toLocaleString()} | Lifetime: ${earningsDisplay}`, 'console-text');
    
    if (detailed) {
        const params = bot.params || {};
        addConsoleLine(`  Strategy: ${bot.strategy}`, 'console-text');
        if (bot.strategy === 'trendFollowing') {
            addConsoleLine(`  Fast MA: ${params.fastMAPeriod || 10} | Slow MA: ${params.slowMAPeriod || 30}`, 'console-text');
            addConsoleLine(`  Min Separation: ${params.minSeparationPercent || 0.5}%`, 'console-text');
        }
    }
    
    if (reasoning && reasoning.reason) {
        addConsoleLine(`  Current: ${reasoning.reason}`, 'console-text');
    }
}

// Handle enable command
function handleEnableCommand(args) {
    const bot = state.bots && state.bots.length > 0 ? state.bots[0] : null;
    
    if (!bot) {
        addConsoleLine('Error: No bot found.', 'console-error');
        return;
    }
    
    bot.enabled = true;
    autoSave();
    
    addConsoleLine(`Bot "${bot.name}" enabled.`, 'console-success');
    updateConsoleStatus();
    AudioManager.playClick();
}

// Handle disable command
function handleDisableCommand(args) {
    const bot = state.bots && state.bots.length > 0 ? state.bots[0] : null;
    
    if (!bot) {
        addConsoleLine('Error: No bot found.', 'console-error');
        return;
    }
    
    bot.enabled = false;
    autoSave();
    
    addConsoleLine(`Bot "${bot.name}" disabled.`, 'console-success');
    updateConsoleStatus();
    AudioManager.playClick();
}

// Add line to console output
function addConsoleLine(text, className = 'console-text') {
    const output = document.getElementById('consoleOutput');
    if (!output) return;
    
    const line = document.createElement('div');
    line.className = `console-line ${className}`;
    line.innerHTML = `<span class="console-text">${text}</span>`;
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

// Clear console
function clearConsole() {
    const output = document.getElementById('consoleOutput');
    if (!output) return;
    
    // Stop show command refresh
    showCommandActive = false;
    showOutputStartIndex = -1;
    
    output.innerHTML = '';
    addConsoleLine('Console cleared.', 'console-info');
}

// Update console status
function updateConsoleStatus() {
    const statusEl = document.getElementById('consoleStatus');
    if (!statusEl) return;
    
    const activeCount = (state.bots || []).filter(b => b.enabled).length;
    const totalCount = (state.bots || []).length;
    
    if (totalCount === 0) {
        statusEl.textContent = 'READY';
    } else {
        statusEl.textContent = `${activeCount}/${totalCount} ACTIVE`;
    }
}

// Track if show command is active
let showCommandActive = false;
let showCommandArgs = [];
let showOutputStartIndex = -1;

// Start real-time bot updates in console
let consoleUpdateInterval = null;

function startConsoleBotUpdates() {
    if (consoleUpdateInterval) {
        clearInterval(consoleUpdateInterval);
    }
    
    consoleUpdateInterval = setInterval(() => {
        const botsContent = document.getElementById('botsContent');
        if (!botsContent || botsContent.classList.contains('hidden')) return;
        
        // Update status
        updateConsoleStatus();
        
        // Update bot reasoning for all enabled bots (needed for show command)
        if (state.bots && state.bots.length > 0) {
            state.bots.forEach(bot => {
                if (!bot.enabled) return;
                
                const stockSymbol = state.dataMode;
                const history = state.chartHistory[stockSymbol];
                if (!history || history.length === 0) return;
                
                const prices = state.chartPrices[stockSymbol];
                if (!prices) return;
                
                const currentPrice = prices.currentPrice;
                
                // Check if bot has active position
                const hasActivePosition = state.positions.some(pos => 
                    pos.stockSymbol === stockSymbol && 
                    pos.isBotPosition && 
                    pos.botId === bot.id &&
                    !pos.resolved &&
                    pos.remaining > 0
                );
                
                // Don't evaluate if bot has active position
                if (hasActivePosition) return;
                
                // Evaluate bot conditions to update reasoning
                const signal = evaluateBotConditions(bot, currentPrice, history);
                bot.lastReasoning = signal.reasoning;
                bot.lastEvaluationTime = Date.now();
            });
        }
        
        // Refresh show command output if active
        if (showCommandActive) {
            refreshShowOutput();
        }
    }, 2000);
}

function stopConsoleBotUpdates() {
    if (consoleUpdateInterval) {
        clearInterval(consoleUpdateInterval);
        consoleUpdateInterval = null;
    }
    showCommandActive = false;
    showOutputStartIndex = -1;
}

// Refresh show command output
function refreshShowOutput() {
    if (showOutputStartIndex < 0) return;
    
    const output = document.getElementById('consoleOutput');
    if (!output) return;
    
    // Remove all lines from showOutputStartIndex onwards
    const lines = Array.from(output.querySelectorAll('.console-line'));
    for (let i = lines.length - 1; i >= showOutputStartIndex; i--) {
        lines[i].remove();
    }
    
    // Re-render show output (skip header on refresh)
    showAllBots(true);
}

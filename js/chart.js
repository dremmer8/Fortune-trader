// Chart rendering functionality

let canvas;
let ctx;

function initChart() {
    canvas = document.getElementById('chart');
    ctx = canvas.getContext('2d');
    
    // Add event handlers for predictions on right edge
    if (canvas) {
        canvas.addEventListener('click', handleChartClick);
        canvas.addEventListener('mousemove', handleChartMouseMove);
        canvas.addEventListener('mouseleave', handleChartMouseLeave);
    }
}

// Track mouse position for preview
let mouseX = 0;
let mouseY = 0;
let isMouseOverChart = false;

// Handle mouse move for preview
function handleChartMouseMove(event) {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Check if mouse is in the right edge zone (within 20px of right edge)
    const rightEdgeStart = padding.left + chartWidth - 20;
    const scaleX = canvas.width / rect.width;
    const x = mouseX * scaleX;
    
    isMouseOverChart = (x >= rightEdgeStart && x <= width - padding.right) && 
                       (mouseY >= padding.top && mouseY <= padding.top + chartHeight);
    
    // Trigger redraw for preview
    if (typeof drawChartSmooth === 'function') {
        drawChartSmooth();
    }
}

// Handle mouse leave
function handleChartMouseLeave() {
    isMouseOverChart = false;
    if (typeof drawChartSmooth === 'function') {
        drawChartSmooth();
    }
}

// Handle clicks on chart - create predictions on right edge
function handleChartClick(event) {
    if (!canvas) return;
    
    // Initialize predictions array if it doesn't exist
    if (!state.predictions) {
        state.predictions = [];
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert click coordinates to canvas coordinates
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Check if click is on the right edge (within 20px of right edge)
    const rightEdgeStart = padding.left + chartWidth - 20;
    if (x < rightEdgeStart || x > width - padding.right) return;
    
    // Check if click is within chart area vertically
    if (y < padding.top || y > padding.top + chartHeight) return;
    
    // Calculate price from Y position
    // Use the SAME price range calculation as drawChartSmooth to ensure alignment
    if (state.prices.length < 1) return;
    
    const targetCount = typeof CHART_VISIBLE_POINTS !== 'undefined' ? CHART_VISIBLE_POINTS : 100;
    
    // Use display price for the most recent point (same as chart drawing)
    let prices;
    if (state.prices.length === 0) {
        prices = new Array(targetCount).fill(state.displayPrice);
    } else if (state.prices.length < targetCount) {
        const firstPrice = state.prices[0];
        const paddingCount = targetCount - state.prices.length - 1;
        const paddingArray = paddingCount > 0 ? new Array(paddingCount).fill(firstPrice) : [];
        prices = [...paddingArray, ...state.prices, state.displayPrice];
        if (prices.length > targetCount) {
            prices = prices.slice(-targetCount);
        }
    } else {
        prices = [...state.prices.slice(-(targetCount - 1)), state.displayPrice];
    }
    
    // Include prophecies in range calculation (same as chart)
    const prophecies = typeof getActivePropheciesForChart === 'function' ? getActivePropheciesForChart() : [];
    const prophecyPrices = [];
    prophecies.forEach(p => {
        if (p.intervalMin !== undefined) prophecyPrices.push(p.intervalMin);
        if (p.intervalMax !== undefined) prophecyPrices.push(p.intervalMax);
    });
    
    // Include predictions in min/max calculation
    const activePredictions = state.predictions.filter(p => !p.resolved && p.stockSymbol === state.dataMode);
    const predictionPrices = [];
    activePredictions.forEach(p => {
        predictionPrices.push(p.intervalMin, p.intervalMax, p.price);
    });
    
    const activeDeals = state.deals.filter(d => !d.resolved && d.remaining > 0 && d.stockSymbol === state.dataMode);
    const activePositions = state.positions.filter(p => p.remaining > 0 && p.stockSymbol === state.dataMode);
    const dealPrices = activeDeals.map(d => d.entryPrice);
    const positionPrices = activePositions.map(p => p.entryPrice);
    
    const stockHolding = typeof getCurrentStockHolding === 'function' ? getCurrentStockHolding() : null;
    const stockAvgPrice = stockHolding && stockHolding.shares > 0 ? [stockHolding.avgPrice] : [];
    
    // Use EXACT same calculation as drawChartSmooth
    const allPrices = [...prices, ...dealPrices, ...positionPrices, ...stockAvgPrice, ...prophecyPrices, ...predictionPrices];
    
    // Ensure we have valid prices
    if (allPrices.length === 0) {
        allPrices.push(state.displayPrice || 100);
    }
    
    const min = Math.min(...allPrices) * 0.998;
    const max = Math.max(...allPrices) * 1.002;
    const range = max - min || 1;
    
    // Calculate price from Y coordinate using the same formula as chart drawing
    const normalizedY = 1 - ((y - padding.top) / chartHeight);
    const clickedPrice = min + (normalizedY * range);
    
    // Create prediction
    createPrediction(clickedPrice);
}

// Get active prophecies for current chart (for effects calculation - includes undecoded)
function getActivePropheciesForChart() {
    if (!state.deals) return [];
    return state.deals.filter(d => 
        !d.resolved && 
        d.remaining > 0 && 
        d.targetStock === state.dataMode
    );
}

// Get active prophecies for visual rendering (only decoded ones)
function getActivePropheciesForChartVisual() {
    if (!state.deals) return [];
    return state.deals.filter(d => 
        !d.resolved && 
        d.remaining > 0 && 
        d.targetStock === state.dataMode &&
        d.isDecoded === true  // Only show visual cues for decoded prophecies
    );
}

// Main function to draw all prophecy indicators
function drawProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range, prices) {
    // Draw trend indicators first (background)
    drawTrendProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range);
    
    // Draw shore indicators (price bounds)
    drawShoreProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range);
    
    // Draw inevitable zone indicators
    drawZoneProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range);
    
    // Draw volatility indicators
    drawVolatilityProphecyIndicators(ctx, padding, chartWidth, chartHeight);
}

// Draw trend prophecy indicators on chart
function drawTrendProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range) {
    const prophecies = getActivePropheciesForChartVisual();
    const trendProphecies = prophecies.filter(p => 
        p.prophecyType === 'trendUp' || p.prophecyType === 'trendDown'
    );
    
    if (trendProphecies.length === 0) return;
    
    const now = Date.now();
    
    trendProphecies.forEach(prophecy => {
        const isUp = prophecy.prophecyType === 'trendUp';
        const elapsed = (now - prophecy.startTime) / 1000;
        const remaining = Math.max(0, prophecy.duration - elapsed);
        const progress = 1 - (remaining / prophecy.duration); // 0 to 1
        
        // Calculate average strength
        const avgStrength = (prophecy.strengthMin + prophecy.strengthMax) / 2;
        const strengthNormalized = avgStrength / 0.8; // Normalize to 0-1 range (max is 0.8%)
        
        // Pulsing animation
        const pulsePhase = (now % 2000) / 2000;
        const pulseIntensity = 0.7 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;
        
        // Colors
        const upColor = { r: 16, g: 185, b: 129 }; // Green
        const downColor = { r: 239, g: 68, b: 68 }; // Red
        const color = isUp ? upColor : downColor;
        
        // Draw trend gradient overlay on chart area
        const gradientOpacity = 0.08 * strengthNormalized * pulseIntensity;
        
        if (isUp) {
            // Upward trend - gradient from bottom (transparent) to top (colored)
            const trendGradient = ctx.createLinearGradient(0, padding.top + chartHeight, 0, padding.top);
            trendGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            trendGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${gradientOpacity * 0.5})`);
            trendGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${gradientOpacity})`);
            ctx.fillStyle = trendGradient;
        } else {
            // Downward trend - gradient from top (transparent) to bottom (colored)
            const trendGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
            trendGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            trendGradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${gradientOpacity * 0.5})`);
            trendGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${gradientOpacity})`);
            ctx.fillStyle = trendGradient;
        }
        
        ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight);
        
        // Draw animated trend arrows on the right side
        const arrowCount = 3;
        const arrowSpacing = chartHeight / (arrowCount + 1);
        const arrowSize = 12 + strengthNormalized * 8; // Larger arrows for stronger trends
        const arrowOpacity = 0.4 + strengthNormalized * 0.4;
        
        for (let i = 0; i < arrowCount; i++) {
            // Stagger animation for each arrow
            const arrowPhase = (pulsePhase + i * 0.33) % 1;
            const arrowPulse = 0.5 + Math.sin(arrowPhase * Math.PI * 2) * 0.5;
            
            const arrowX = padding.left + chartWidth - 30;
            const baseY = padding.top + arrowSpacing * (i + 1);
            
            // Animate arrow position (move up for uptrend, down for downtrend)
            const moveOffset = (arrowPulse - 0.5) * 15 * (isUp ? -1 : 1);
            const arrowY = baseY + moveOffset;
            
            ctx.save();
            ctx.translate(arrowX, arrowY);
            if (!isUp) ctx.rotate(Math.PI); // Flip for down arrows
            
            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(0, -arrowSize);
            ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.3);
            ctx.lineTo(-arrowSize * 0.2, arrowSize * 0.3);
            ctx.lineTo(-arrowSize * 0.2, arrowSize);
            ctx.lineTo(arrowSize * 0.2, arrowSize);
            ctx.lineTo(arrowSize * 0.2, arrowSize * 0.3);
            ctx.lineTo(arrowSize * 0.6, arrowSize * 0.3);
            ctx.closePath();
            
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${arrowOpacity * arrowPulse})`;
            ctx.fill();
            
            ctx.restore();
        }
        
        // Draw trend info badge in top-left of chart
        const badgeX = padding.left + 10;
        const badgeY = padding.top + 15;
        const badgeWidth = 140;
        const badgeHeight = 50;
        
        // Badge background
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
        ctx.lineWidth = 1;
        
        // Rounded rectangle
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(badgeX + radius, badgeY);
        ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
        ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
        ctx.lineTo(badgeX, badgeY + radius);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Badge icon and text
        const icon = isUp ? '📈' : '📉';
        ctx.font = '16px sans-serif';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
        ctx.textAlign = 'left';
        ctx.fillText(icon, badgeX + 8, badgeY + 22);
        
        // Trend type
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
        ctx.fillText(isUp ? 'TREND UP' : 'TREND DOWN', badgeX + 30, badgeY + 20);
        
        // Strength
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Strength: ${prophecy.strengthMin.toFixed(2)}%-${prophecy.strengthMax.toFixed(2)}%`, badgeX + 8, badgeY + 38);
        
        // Timer bar inside badge
        const timerBarY = badgeY + badgeHeight - 5;
        const timerBarWidth = badgeWidth - 16;
        const timerProgress = remaining / prophecy.duration;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(badgeX + 8, timerBarY, timerBarWidth, 3);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.fillRect(badgeX + 8, timerBarY, timerBarWidth * timerProgress, 3);
    });
}

// Draw shore prophecy indicators (floor/ceiling lines)
function drawShoreProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range) {
    const prophecies = getActivePropheciesForChartVisual();
    const shoreProphecies = prophecies.filter(p => 
        p.prophecyType === 'lowerShore' || p.prophecyType === 'upperShore'
    );
    
    if (shoreProphecies.length === 0) return;
    
    const now = Date.now();
    
    shoreProphecies.forEach(prophecy => {
        const isLower = prophecy.prophecyType === 'lowerShore';
        const elapsed = (now - prophecy.startTime) / 1000;
        const remaining = Math.max(0, prophecy.duration - elapsed);
        const progress = remaining / prophecy.duration;
        
        // Colors
        const color = isLower 
            ? { r: 34, g: 197, b: 94 }   // Green for floor
            : { r: 249, g: 115, b: 22 }; // Orange for ceiling
        
        // Calculate Y positions for the interval
        const intervalMinY = padding.top + chartHeight * (1 - (prophecy.intervalMin - min) / range);
        const intervalMaxY = padding.top + chartHeight * (1 - (prophecy.intervalMax - min) / range);
        
        // Clamp to chart area
        const clampedMinY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMinY));
        const clampedMaxY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMaxY));
        
        // Pulsing animation
        const pulsePhase = (now % 2000) / 2000;
        const pulseIntensity = 0.7 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;
        
        // Draw shaded zone for the interval
        const zoneOpacity = 0.15 * pulseIntensity;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${zoneOpacity})`;
        
        if (isLower) {
            // Lower shore - shade from interval to bottom of chart
            ctx.fillRect(padding.left, clampedMinY, chartWidth, padding.top + chartHeight - clampedMinY);
        } else {
            // Upper shore - shade from top of chart to interval
            ctx.fillRect(padding.left, padding.top, chartWidth, clampedMaxY - padding.top);
        }
        
        // Draw interval zone (hatched area between min and max)
        const zoneHeight = Math.abs(clampedMinY - clampedMaxY);
        const zoneTop = Math.min(clampedMinY, clampedMaxY);
        
        // Draw hatched pattern for the interval zone
        ctx.save();
        ctx.beginPath();
        ctx.rect(padding.left, zoneTop, chartWidth, zoneHeight);
        ctx.clip();
        
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
        ctx.lineWidth = 1;
        const hatchSpacing = 8;
        for (let i = -chartWidth; i < chartWidth + zoneHeight; i += hatchSpacing) {
            ctx.beginPath();
            ctx.moveTo(padding.left + i, zoneTop);
            ctx.lineTo(padding.left + i + zoneHeight, zoneTop + zoneHeight);
            ctx.stroke();
        }
        ctx.restore();
        
        // Draw boundary lines
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        
        // Min line
        ctx.beginPath();
        ctx.moveTo(padding.left, clampedMinY);
        ctx.lineTo(padding.left + chartWidth, clampedMinY);
        ctx.stroke();
        
        // Max line
        ctx.beginPath();
        ctx.moveTo(padding.left, clampedMaxY);
        ctx.lineTo(padding.left + chartWidth, clampedMaxY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw labels
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
        ctx.textAlign = 'left';
        
        const icon = isLower ? '🛡️' : '🔒';
        const label = isLower ? 'FLOOR' : 'CEILING';
        
        // Label at the middle of the zone
        const labelY = (clampedMinY + clampedMaxY) / 2;
        ctx.fillText(`${icon} ${label}`, padding.left + 5, labelY + 4);
        
        // Price labels on the right
        ctx.textAlign = 'right';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`$${prophecy.intervalMin.toFixed(2)}`, padding.left + chartWidth - 5, clampedMinY + 12);
        ctx.fillText(`$${prophecy.intervalMax.toFixed(2)}`, padding.left + chartWidth - 5, clampedMaxY - 4);
    });
}

// Draw inevitable zone prophecy indicators
function drawZoneProphecyIndicators(ctx, padding, chartWidth, chartHeight, min, max, range) {
    const prophecies = getActivePropheciesForChartVisual();
    const zoneProphecies = prophecies.filter(p => p.prophecyType === 'inevitableZone');
    
    if (zoneProphecies.length === 0) return;
    
    const now = Date.now();
    
    zoneProphecies.forEach(prophecy => {
        const elapsed = (now - prophecy.startTime) / 1000;
        const remaining = Math.max(0, prophecy.duration - elapsed);
        const urgency = 1 - (remaining / prophecy.duration);
        
        // Purple color for zones
        const color = { r: 168, g: 85, b: 247 };
        
        // Calculate Y positions for the interval
        const intervalMinY = padding.top + chartHeight * (1 - (prophecy.intervalMin - min) / range);
        const intervalMaxY = padding.top + chartHeight * (1 - (prophecy.intervalMax - min) / range);
        
        // Clamp to chart area
        const clampedMinY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMinY));
        const clampedMaxY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMaxY));
        
        const zoneHeight = Math.abs(clampedMinY - clampedMaxY);
        const zoneTop = Math.min(clampedMinY, clampedMaxY);
        const zoneCenterY = (clampedMinY + clampedMaxY) / 2;
        
        // Pulsing animation - faster as urgency increases
        const pulseSpeed = 1500 - urgency * 1000; // 1500ms to 500ms
        const pulsePhase = (now % pulseSpeed) / pulseSpeed;
        const pulseIntensity = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.5;
        
        if (prophecy.touched) {
            // Zone was touched - show success state
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
            ctx.fillRect(padding.left, zoneTop, chartWidth, zoneHeight);
            
            // Draw checkmark or success indicator
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
            ctx.textAlign = 'center';
            ctx.fillText('✓ TOUCHED', padding.left + chartWidth / 2, zoneCenterY + 5);
        } else {
            // Zone not touched yet - show target with magnetism effect
            const baseOpacity = 0.1 + urgency * 0.15;
            const zoneOpacity = baseOpacity * pulseIntensity;
            
            // Draw glowing zone
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${zoneOpacity})`;
            ctx.fillRect(padding.left, zoneTop, chartWidth, zoneHeight);
            
            // Draw "magnetic" lines pulling toward zone
            const lineCount = 5;
            const currentPriceY = padding.top + chartHeight * (1 - (state.displayPrice - min) / range);
            
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.2 + urgency * 0.3})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            
            for (let i = 0; i < lineCount; i++) {
                const t = (i + 1) / (lineCount + 1);
                const startX = padding.left + chartWidth * t;
                const animOffset = Math.sin((now / 500 + i) % (Math.PI * 2)) * 10;
                
                ctx.beginPath();
                ctx.moveTo(startX, currentPriceY + animOffset);
                ctx.lineTo(startX, zoneCenterY);
                ctx.stroke();
            }
            ctx.setLineDash([]);
            
            // Draw target icon
            ctx.font = '16px sans-serif';
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.7 + pulseIntensity * 0.3})`;
            ctx.textAlign = 'center';
            ctx.fillText('🎯', padding.left + chartWidth / 2, zoneCenterY + 6);
        }
        
        // Draw boundary lines
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
        
        ctx.beginPath();
        ctx.moveTo(padding.left, clampedMinY);
        ctx.lineTo(padding.left + chartWidth, clampedMinY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding.left, clampedMaxY);
        ctx.lineTo(padding.left + chartWidth, clampedMaxY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Price labels
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#a0a0b0';
        ctx.textAlign = 'right';
        ctx.fillText(`$${prophecy.intervalMin.toFixed(2)}`, padding.left + chartWidth - 5, clampedMinY + 12);
        ctx.fillText(`$${prophecy.intervalMax.toFixed(2)}`, padding.left + chartWidth - 5, clampedMaxY - 4);
    });
}

// Draw volatility prophecy indicators
function drawVolatilityProphecyIndicators(ctx, padding, chartWidth, chartHeight) {
    const prophecies = getActivePropheciesForChartVisual();
    const volProphecies = prophecies.filter(p => 
        p.prophecyType === 'volatilitySpike' || p.prophecyType === 'volatilityCalm'
    );
    
    if (volProphecies.length === 0) return;
    
    const now = Date.now();
    
    volProphecies.forEach((prophecy, index) => {
        const isSpike = prophecy.prophecyType === 'volatilitySpike';
        const elapsed = (now - prophecy.startTime) / 1000;
        
        // Check if we're in the volatility window
        const inWindow = elapsed >= prophecy.windowStart && elapsed <= prophecy.windowEnd;
        const windowProgress = inWindow 
            ? (elapsed - prophecy.windowStart) / (prophecy.windowEnd - prophecy.windowStart)
            : (elapsed < prophecy.windowStart ? 0 : 1);
        
        // Colors
        const color = isSpike 
            ? { r: 245, g: 158, b: 11 }  // Amber for spike
            : { r: 56, g: 189, b: 248 }; // Cyan for calm
        
        // Badge position (stack multiple volatility prophecies)
        const badgeX = padding.left + chartWidth - 150;
        const badgeY = padding.top + 15 + (index * 55);
        const badgeWidth = 140;
        const badgeHeight = 50;
        
        // Pulsing when active
        const pulsePhase = (now % 1000) / 1000;
        const pulseIntensity = inWindow ? (0.7 + Math.sin(pulsePhase * Math.PI * 2) * 0.3) : 0.5;
        
        // Badge background
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${inWindow ? 0.2 : 0.1})`;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${inWindow ? 0.8 : 0.4})`;
        ctx.lineWidth = inWindow ? 2 : 1;
        
        // Rounded rectangle
        const radius = 6;
        ctx.beginPath();
        ctx.moveTo(badgeX + radius, badgeY);
        ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
        ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
        ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
        ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
        ctx.lineTo(badgeX, badgeY + radius);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Badge content
        const icon = isSpike ? '⚡' : '🌊';
        ctx.font = '14px sans-serif';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
        ctx.textAlign = 'left';
        ctx.fillText(icon, badgeX + 8, badgeY + 20);
        
        // Type and status
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
        const statusText = inWindow ? 'ACTIVE' : (elapsed < prophecy.windowStart ? 'PENDING' : 'ENDED');
        ctx.fillText(`${isSpike ? 'VOL SPIKE' : 'VOL CALM'} - ${statusText}`, badgeX + 28, badgeY + 18);
        
        // Time window
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText(`Window: ${prophecy.windowStart.toFixed(0)}s-${prophecy.windowEnd.toFixed(0)}s`, badgeX + 8, badgeY + 32);
        ctx.fillText(`Vol: ${prophecy.volatilityMin.toFixed(1)}x-${prophecy.volatilityMax.toFixed(1)}x`, badgeX + 8, badgeY + 43);
        
        // Window progress bar
        if (elapsed >= prophecy.windowStart) {
            const progressBarY = badgeY + badgeHeight - 5;
            const progressBarWidth = badgeWidth - 16;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(badgeX + 8, progressBarY, progressBarWidth, 3);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            ctx.fillRect(badgeX + 8, progressBarY, progressBarWidth * Math.min(1, windowProgress), 3);
        }
        
        // If in window, add visual effect to chart area
        if (inWindow) {
            if (isSpike) {
                // Spike - add jittery border effect
                const jitterIntensity = 2 + Math.sin(now / 50) * 2;
                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(
                    padding.left + Math.random() * jitterIntensity,
                    padding.top + Math.random() * jitterIntensity,
                    chartWidth - Math.random() * jitterIntensity * 2,
                    chartHeight - Math.random() * jitterIntensity * 2
                );
                ctx.setLineDash([]);
            } else {
                // Calm - add soft glow border
                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
                ctx.lineWidth = 4;
                ctx.strokeRect(padding.left, padding.top, chartWidth, chartHeight);
            }
        }
    });
}

// Draw prediction intervals on chart
function drawPredictions(ctx, padding, chartWidth, chartHeight, min, max, range) {
    const now = Date.now();
    const currentTick = typeof getCurrentTickNumber === 'function' ? getCurrentTickNumber() : 0;
    
    // Draw preview zone on right edge if mouse is hovering
    if (isMouseOverChart && canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleY = canvas.height / rect.height;
        const y = mouseY * scaleY;
        
        if (y >= padding.top && y <= padding.top + chartHeight) {
            // Calculate price from Y position using the same range as the chart
            const normalizedY = 1 - ((y - padding.top) / chartHeight);
            const previewPrice = min + (normalizedY * range);
            
            // Calculate interval around preview price (2% range)
            const intervalWidth = previewPrice * 0.02;
            const previewIntervalMin = previewPrice - intervalWidth / 2;
            const previewIntervalMax = previewPrice + intervalWidth / 2;
            
            // Calculate Y positions for preview interval
            const previewMinY = padding.top + chartHeight * (1 - (previewIntervalMin - min) / range);
            const previewMaxY = padding.top + chartHeight * (1 - (previewIntervalMax - min) / range);
            
            const previewZoneHeight = Math.abs(previewMinY - previewMaxY);
            const previewZoneTop = Math.min(previewMinY, previewMaxY);
            
            // Draw preview zone (right edge only, 20px wide)
            const previewZoneWidth = 20;
            const previewZoneX = padding.left + chartWidth - previewZoneWidth;
            
            const previewColor = { r: 139, g: 92, b: 246 }; // Purple
            // Use 75% transparency for preview (25% opacity)
            ctx.fillStyle = `rgba(${previewColor.r}, ${previewColor.g}, ${previewColor.b}, 0.25)`;
            ctx.fillRect(previewZoneX, previewZoneTop, previewZoneWidth, previewZoneHeight);
            
            // Draw preview boundary lines
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(${previewColor.r}, ${previewColor.g}, ${previewColor.b}, 0.25)`;
            
            ctx.beginPath();
            ctx.moveTo(previewZoneX, previewMinY);
            ctx.lineTo(previewZoneX + previewZoneWidth, previewMinY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(previewZoneX, previewMaxY);
            ctx.lineTo(previewZoneX + previewZoneWidth, previewMaxY);
            ctx.stroke();
            
            ctx.setLineDash([]);
        }
    }
    
    if (!state.predictions || !Array.isArray(state.predictions) || state.predictions.length === 0) return;
    
    // Filter predictions for current stock and validate data
    const activePredictions = state.predictions.filter(p => 
        p && 
        !p.resolved && 
        p.stockSymbol === state.dataMode &&
        typeof p.intervalMin === 'number' && 
        typeof p.intervalMax === 'number' && 
        typeof p.price === 'number' &&
        !isNaN(p.intervalMin) && 
        !isNaN(p.intervalMax) && 
        !isNaN(p.price)
    );
    
    if (activePredictions.length === 0) return;
    
    activePredictions.forEach(prediction => {
        // Calculate ticks remaining based on last shrink tick (synced with chart updates)
        const ticksElapsed = prediction.lastShrinkTick - prediction.startTick;
        const ticksRemaining = Math.max(0, 10 - ticksElapsed);
        
        // Calculate horizontal shrink: discrete steps tied to chart ticks
        // Each tick shrinks by 1/10th of the width
        const shrinkProgress = ticksRemaining / 10; // 1.0 when 0 ticks elapsed, 0.0 when 10 ticks elapsed
        const currentWidth = chartWidth * shrinkProgress; // Shrinks from left to right
        
        // If width is 0 or less, trigger resolution (should already be handled, but double-check)
        if (currentWidth <= 0 && !prediction.resolved) {
            // This will be handled by updatePredictions, but we skip drawing
            return;
        }
        
        // Calculate Y positions for the interval
        const intervalMinY = padding.top + chartHeight * (1 - (prediction.intervalMin - min) / range);
        const intervalMaxY = padding.top + chartHeight * (1 - (prediction.intervalMax - min) / range);
        
        // Clamp to chart area
        const clampedMinY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMinY));
        const clampedMaxY = Math.max(padding.top, Math.min(padding.top + chartHeight, intervalMaxY));
        
        const zoneHeight = Math.abs(clampedMinY - clampedMaxY);
        const zoneTop = Math.min(clampedMinY, clampedMaxY);
        const zoneCenterY = (clampedMinY + clampedMaxY) / 2;
        
        // Color: purple/blue for predictions
        const color = { r: 139, g: 92, b: 246 }; // Purple
        
        // Draw interval zone with 75% transparency (25% opacity) and horizontal shrinking
        const zoneOpacity = 0.05; // Fixed 75% transparency (25% opacity)
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${zoneOpacity})`;
        // Shrink from left to right: start X moves right as width decreases
        const startX = padding.left + chartWidth - currentWidth;
        ctx.fillRect(startX, zoneTop, currentWidth, zoneHeight);
        
        // Draw boundary lines (also shrink horizontally)
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${zoneOpacity})`;
        
        ctx.beginPath();
        ctx.moveTo(startX, clampedMinY);
        ctx.lineTo(startX + currentWidth, clampedMinY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(startX, clampedMaxY);
        ctx.lineTo(startX + currentWidth, clampedMaxY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Draw center line (prediction price) - also shrinks
        const centerY = padding.top + chartHeight * (1 - (prediction.price - min) / range);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${zoneOpacity})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        ctx.moveTo(startX, centerY);
        ctx.lineTo(startX + currentWidth, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw ticks remaining (only if there's space)
        if (currentWidth > 30) {
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.fillStyle = '#a0a0b0';
            ctx.textAlign = 'right';
            ctx.fillText(`${ticksRemaining}T`, startX + currentWidth - 5, zoneCenterY - 8);
        }
        
        // Price labels (only if there's space)
        if (currentWidth > 60) {
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillStyle = '#a0a0b0';
            ctx.textAlign = 'right';
            ctx.fillText(`$${prediction.intervalMin.toFixed(2)}`, startX + currentWidth - 5, clampedMinY + 10);
            ctx.fillText(`$${prediction.intervalMax.toFixed(2)}`, startX + currentWidth - 5, clampedMaxY - 2);
        }
    });
}

// Helper function to ensure we always have exactly CHART_VISIBLE_POINTS points
// Generates simulated historical values if fewer points exist
function getPaddedPrices(rawPrices, currentPrice) {
    const targetCount = typeof CHART_VISIBLE_POINTS !== 'undefined' ? CHART_VISIBLE_POINTS : 100;
    
    if (rawPrices.length === 0) {
        // No data - generate simulated history
        return generateQuickSimulatedPrices(currentPrice, targetCount);
    }
    
    // Get last targetCount prices
    let prices = rawPrices.slice(-targetCount);
    
    if (prices.length < targetCount) {
        // Generate simulated history to pad from left
        const firstPrice = prices[0];
        const paddingCount = targetCount - prices.length;
        const simulatedPadding = generateQuickSimulatedPrices(firstPrice, paddingCount);
        prices = [...simulatedPadding, ...prices];
    }
    
    return prices;
}

// Generate quick simulated prices for padding (lighter than full simulation)
function generateQuickSimulatedPrices(basePrice, count) {
    const prices = [];
    let price = basePrice;
    const volatility = basePrice * 0.003; // 0.3% base volatility
    
    // Generate backwards from base price
    for (let i = 0; i < count; i++) {
        // Random walk with slight mean reversion
        const noise = (Math.random() - 0.5) * 2 * volatility;
        const reversion = (basePrice - price) * 0.02;
        price = price + noise + reversion;
        prices.unshift(price); // Add to beginning
    }
    
    // Ensure last price matches base price for continuity
    if (prices.length > 0) {
        // Smooth transition to base price in last few points
        const smoothingRange = Math.min(5, prices.length);
        for (let i = 0; i < smoothingRange; i++) {
            const idx = prices.length - smoothingRange + i;
            const t = (i + 1) / smoothingRange;
            prices[idx] = prices[idx] * (1 - t * 0.5) + basePrice * (t * 0.5);
        }
    }
    
    return prices;
}

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth - 32;
    canvas.height = canvas.parentElement.clientHeight - 32;
}

function drawChart() {
    if (!canvas || !ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 20 };

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(42, 42, 58, 0.5)';
    ctx.lineWidth = 1;
    
    // Horizontal grid
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (height - padding.top - padding.bottom) * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    // Vertical grid
    for (let i = 0; i <= 6; i++) {
        const x = padding.left + (width - padding.left - padding.right) * i / 6;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
    }

    // Allow drawing with 1 point (starting fresh)
    if (state.prices.length < 1) return;

    // Always show CHART_VISIBLE_POINTS positions, padded if needed
    const prices = getPaddedPrices(state.prices, state.currentPrice);
    const targetCount = typeof CHART_VISIBLE_POINTS !== 'undefined' ? CHART_VISIBLE_POINTS : 100;
    
    // Include deal and position entry prices in min/max calculation for proper scaling
    // Filter by current stock symbol
    const activeDeals = state.deals.filter(d => !d.resolved && d.remaining > 0 && d.stockSymbol === state.dataMode);
    const activePositions = state.positions.filter(p => p.remaining > 0 && p.stockSymbol === state.dataMode);
    const dealPrices = activeDeals.map(d => d.entryPrice);
    const positionPrices = activePositions.map(p => p.entryPrice);
    
    // Include stock holding average price if exists
    const stockHolding = typeof getCurrentStockHolding === 'function' ? getCurrentStockHolding() : null;
    const stockAvgPrice = stockHolding && stockHolding.shares > 0 ? [stockHolding.avgPrice] : [];
    
    const allPrices = [...prices, ...dealPrices, ...positionPrices, ...stockAvgPrice];
    
    const min = Math.min(...allPrices) * 0.998;
    const max = Math.max(...allPrices) * 1.002;
    const range = max - min || 1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Combine deals and positions into unified bets array
    const allBets = [
        ...activeDeals.map(d => ({ ...d, type: 'prophecy' })),
        ...activePositions.map(p => ({ ...p, type: 'position' }))
    ];

    // Find the closest bet to closing (lowest remaining time)
    let closestBet = null;
    if (allBets.length > 0) {
        closestBet = allBets.reduce((closest, bet) => 
            bet.remaining < closest.remaining ? bet : closest
        );
    }

    // Draw bet marker line and gradient fill for closest bet
    if (closestBet) {
        const entryY = padding.top + chartHeight * (1 - (closestBet.entryPrice - min) / range);
        const currentY = padding.top + chartHeight * (1 - (state.currentPrice - min) / range);
        const isLong = closestBet.direction === 'long';
        
        // Line color based on bet direction
        const lineColor = isLong ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        // Fill color based on price position: green if higher, red if lower
        const isPriceHigher = state.currentPrice > closestBet.entryPrice;
        const fillColor = isPriceHigher ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        const transparentColor = 'rgba(0, 0, 0, 0)';
        
        // Draw gradient fill between entry price and current price
        const fillTop = Math.min(entryY, currentY);
        const fillBottom = Math.max(entryY, currentY);
        const fillHeight = fillBottom - fillTop;
        
        // Only draw gradient fill if there's actual height difference
        if (fillHeight > 1) {
            const betGradient = ctx.createLinearGradient(0, fillTop, 0, fillBottom);
            // Opaque color always at entry price line, transparent at current price
            const entryPosition = Math.max(0, Math.min(1, (entryY - fillTop) / fillHeight));
            
            if (entryY < currentY) {
                // Entry is above, current is below - opaque at top (entry), transparent at bottom (current)
                betGradient.addColorStop(0, fillColor);
                betGradient.addColorStop(entryPosition, fillColor);
                betGradient.addColorStop(1, transparentColor);
            } else {
                // Entry is below, current is above - transparent at top (current), opaque at bottom (entry)
                betGradient.addColorStop(0, transparentColor);
                betGradient.addColorStop(entryPosition, fillColor);
                betGradient.addColorStop(1, fillColor);
            }
            
            ctx.fillStyle = betGradient;
            ctx.fillRect(padding.left, fillTop, chartWidth, fillHeight);
        }
        
        // Draw entry price line (fail level)
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.moveTo(padding.left, entryY);
        ctx.lineTo(width - padding.right, entryY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Price labels
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#606070';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const price = max - (range * i / 4);
        const y = padding.top + (height - padding.top - padding.bottom) * i / 4;
        ctx.fillText(price.toFixed(2), width - 10, y + 4);
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    // Use fixed divisor based on target count for consistent scaling
    const divisor = Math.max(1, targetCount - 1);
    prices.forEach((price, i) => {
        const x = padding.left + chartWidth * i / divisor;
        const y = padding.top + chartHeight * (1 - (price - min) / range);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const lastX = padding.left + chartWidth;
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.lineTo(lastX, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Render bet markers
    renderBetMarkers(allBets, closestBet, min, max, chartHeight, padding.top);
}

function renderBetMarkers(bets, closestBet, min, max, chartHeight, paddingTop) {
    const container = document.getElementById('betMarkersContainer');
    if (!container) return;
    
    if (bets.length === 0) {
        container.innerHTML = '';
        return;
    }

    const range = max - min || 1;
    
    container.innerHTML = bets.map(bet => {
        // Calculate Y position as percentage
        const yPercent = (1 - (bet.entryPrice - min) / range) * 100;
        const isClosest = closestBet && bet.id === closestBet.id && bet.type === closestBet.type;
        const shortId = String(bet.id).slice(-4);
        const typeClass = bet.type; // 'prophecy' or 'position'
        const amountLabel = bet.type === 'prophecy' 
            ? (bet.invested > 0 ? `$${bet.invested}` : 'No bet')
            : `$${bet.amount}`;
        
        return `
            <div class="bet-marker ${bet.direction} ${typeClass} ${isClosest ? 'closest' : ''}" 
                 style="top: ${yPercent}%"
                 title="${bet.type === 'prophecy' ? 'Prophecy' : 'Position'} #${shortId}&#10;Entry: $${bet.entryPrice.toFixed(2)}&#10;Amount: ${amountLabel}&#10;Time: ${bet.remaining}s">
                <div class="bet-marker-info">
                    <span class="bet-marker-id">#${shortId}</span>
                    <span class="bet-marker-price">$${bet.entryPrice.toFixed(2)}</span>
                </div>
                <div class="bet-marker-dot ${bet.direction}"></div>
            </div>
        `;
    }).join('');
}

function drawChartSmooth() {
    if (!canvas || !ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 20 };

    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(42, 42, 58, 0.5)';
    ctx.lineWidth = 1;
    
    // Horizontal grid
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (height - padding.top - padding.bottom) * i / 4;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    // Vertical grid
    for (let i = 0; i <= 6; i++) {
        const x = padding.left + (width - padding.left - padding.right) * i / 6;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, height - padding.bottom);
        ctx.stroke();
    }

    // Allow drawing with 1 point (starting fresh)
    if (state.prices.length < 1) return;

    const targetCount = typeof CHART_VISIBLE_POINTS !== 'undefined' ? CHART_VISIBLE_POINTS : 100;
    
    // Calculate chart dimensions early (needed for prophecy indicators)
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Pre-calculate min/max for prophecy indicators (need this early)
    let preCalcPrices;
    if (state.prices.length === 0) {
        preCalcPrices = [state.displayPrice];
    } else {
        preCalcPrices = [...state.prices.slice(-targetCount), state.displayPrice];
    }
    
    // Include prophecy price intervals in range calculation
    const prophecies = getActivePropheciesForChart();
    const prophecyPrices = [];
    prophecies.forEach(p => {
        if (p.intervalMin !== undefined) prophecyPrices.push(p.intervalMin);
        if (p.intervalMax !== undefined) prophecyPrices.push(p.intervalMax);
    });
    
    // Include predictions in pre-calculation for proper range
    const preCalcActivePredictions = (state.predictions && Array.isArray(state.predictions)) 
        ? state.predictions.filter(p => p && !p.resolved && p.stockSymbol === state.dataMode && 
            typeof p.intervalMin === 'number' && typeof p.intervalMax === 'number' && typeof p.price === 'number') 
        : [];
    const preCalcPredictionPrices = [];
    preCalcActivePredictions.forEach(p => {
        if (p.intervalMin && p.intervalMax && p.price) {
            preCalcPredictionPrices.push(p.intervalMin, p.intervalMax, p.price);
        }
    });
    
    // Safe min/max calculation (handle empty arrays)
    const allPreCalcPrices = [...preCalcPrices];
    if (prophecyPrices.length > 0) allPreCalcPrices.push(...prophecyPrices);
    if (preCalcPredictionPrices.length > 0) allPreCalcPrices.push(...preCalcPredictionPrices);
    
    // Ensure we have valid prices
    if (allPreCalcPrices.length === 0) {
        allPreCalcPrices.push(state.displayPrice || 100);
    }
    
    const preCalcMin = Math.min(...allPreCalcPrices) * 0.998;
    const preCalcMax = Math.max(...allPreCalcPrices) * 1.002;
    const preCalcRange = preCalcMax - preCalcMin || 1;
    
    // Draw prophecy indicators FIRST (as background layer)
    try {
        drawProphecyIndicators(ctx, padding, chartWidth, chartHeight, preCalcMin, preCalcMax, preCalcRange, preCalcPrices);
    } catch (e) {
        console.warn('Error drawing prophecy indicators:', e);
    }
    
    // Use display price for the most recent point for smooth animation
    // Always ensure targetCount points, padded if needed
    let prices;
    if (state.prices.length === 0) {
        // No data - fill with display price
        prices = new Array(targetCount).fill(state.displayPrice);
    } else if (state.prices.length < targetCount) {
        // Pad from left with first available price, then add all prices, then displayPrice at end
        const firstPrice = state.prices[0];
        const paddingCount = targetCount - state.prices.length - 1; // -1 for displayPrice at end
        const paddingArray = paddingCount > 0 ? new Array(paddingCount).fill(firstPrice) : [];
        prices = [...paddingArray, ...state.prices, state.displayPrice];
        // Ensure exactly targetCount points
        if (prices.length > targetCount) {
            prices = prices.slice(-targetCount);
        }
    } else {
        // Enough data - take last (targetCount-1) and add displayPrice
        prices = [...state.prices.slice(-(targetCount - 1)), state.displayPrice];
    }
    
    // Include deal and position entry prices in min/max calculation
    // Filter by current stock symbol
    const activeDeals = state.deals.filter(d => !d.resolved && d.remaining > 0 && d.stockSymbol === state.dataMode);
    const activePositions = state.positions.filter(p => p.remaining > 0 && p.stockSymbol === state.dataMode);
    const dealPrices = activeDeals.map(d => d.entryPrice);
    const positionPrices = activePositions.map(p => p.entryPrice);
    
    // Get stock holding for current symbol
    const stockHolding = typeof getCurrentStockHolding === 'function' ? getCurrentStockHolding() : null;
    const stockAvgPrice = stockHolding && stockHolding.shares > 0 ? [stockHolding.avgPrice] : [];
    
    // Include predictions in price range calculation
    const activePredictions = (state.predictions && Array.isArray(state.predictions)) 
        ? state.predictions.filter(p => 
            p && 
            !p.resolved && 
            p.stockSymbol === state.dataMode &&
            typeof p.intervalMin === 'number' && 
            typeof p.intervalMax === 'number' && 
            typeof p.price === 'number'
        ) 
        : [];
    const predictionPrices = [];
    activePredictions.forEach(p => {
        if (p.intervalMin && p.intervalMax && p.price) {
            predictionPrices.push(p.intervalMin, p.intervalMax, p.price);
        }
    });
    
    // Include prophecy intervals in the price range
    const allPrices = [...prices, ...dealPrices, ...positionPrices, ...stockAvgPrice, ...prophecyPrices, ...predictionPrices];
    
    // Ensure we have valid prices
    if (allPrices.length === 0) {
        allPrices.push(state.displayPrice || 100);
    }
    
    const min = Math.min(...allPrices) * 0.998;
    const max = Math.max(...allPrices) * 1.002;
    const range = max - min || 1;

    // Draw predictions using the FINAL min/max/range (same as chart line)
    // This ensures predictions align correctly with the chart axis
    try {
        if (typeof drawPredictions === 'function') {
            drawPredictions(ctx, padding, chartWidth, chartHeight, min, max, range);
        }
    } catch (e) {
        console.warn('Error drawing predictions:', e);
    }

    // Combine deals and positions into unified bets array
    const allBets = [
        ...activeDeals.map(d => ({ ...d, type: 'prophecy' })),
        ...activePositions.map(p => ({ ...p, type: 'position' }))
    ];

    // Find the closest bet to closing
    let closestBet = null;
    if (allBets.length > 0) {
        closestBet = allBets.reduce((closest, bet) => 
            bet.remaining < closest.remaining ? bet : closest
        );
    }

    // Draw stock holding average price line (blue)
    if (stockHolding && stockHolding.shares > 0) {
        const avgY = padding.top + chartHeight * (1 - (stockHolding.avgPrice - min) / range);
        const currentY = padding.top + chartHeight * (1 - (state.displayPrice - min) / range);
        
        // Blue color for stock positions
        const lineColor = 'rgba(59, 130, 246, 0.9)';
        // Fill color based on price position relative to avg
        const isPriceHigher = state.displayPrice > stockHolding.avgPrice;
        const fillColor = isPriceHigher ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)';
        const transparentColor = 'rgba(0, 0, 0, 0)';
        
        const fillTop = Math.min(avgY, currentY);
        const fillBottom = Math.max(avgY, currentY);
        
        if (fillBottom - fillTop > 1) {
            const stockGradient = ctx.createLinearGradient(0, fillTop, 0, fillBottom);
            const entryPosition = (avgY - fillTop) / (fillBottom - fillTop);
            
            if (avgY < currentY) {
                stockGradient.addColorStop(0, fillColor);
                stockGradient.addColorStop(entryPosition, fillColor);
                stockGradient.addColorStop(1, transparentColor);
            } else {
                stockGradient.addColorStop(0, transparentColor);
                stockGradient.addColorStop(entryPosition, fillColor);
                stockGradient.addColorStop(1, fillColor);
            }
            
            ctx.fillStyle = stockGradient;
            ctx.fillRect(padding.left, fillTop, chartWidth, fillBottom - fillTop);
        }
        
        // Draw average price line
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(padding.left, avgY);
        ctx.lineTo(width - padding.right, avgY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw label on the right side
        ctx.font = '10px JetBrains Mono';
        ctx.fillStyle = lineColor;
        ctx.textAlign = 'left';
        ctx.fillText(`AVG $${stockHolding.avgPrice.toFixed(2)}`, padding.left + 5, avgY - 5);
    }

    // Draw bet marker line and gradient fill for closest bet
    if (closestBet) {
        const entryY = padding.top + chartHeight * (1 - (closestBet.entryPrice - min) / range);
        const currentY = padding.top + chartHeight * (1 - (state.displayPrice - min) / range);
        const isLong = closestBet.direction === 'long';
        
        // Line color based on bet direction
        const lineColor = isLong ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        // Fill color based on price position: green if higher, red if lower
        const isPriceHigher = state.displayPrice > closestBet.entryPrice;
        const fillColor = isPriceHigher ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        const transparentColor = 'rgba(0, 0, 0, 0)';
        
        const fillTop = Math.min(entryY, currentY);
        const fillBottom = Math.max(entryY, currentY);
        const fillHeight = fillBottom - fillTop;
        
        // Only draw gradient fill if there's actual height difference
        if (fillHeight > 1) {
            const betGradient = ctx.createLinearGradient(0, fillTop, 0, fillBottom);
            // Opaque color always at entry price line, transparent at current price
            const entryPosition = Math.max(0, Math.min(1, (entryY - fillTop) / fillHeight));
            
            if (entryY < currentY) {
                // Entry is above, current is below - opaque at top (entry), transparent at bottom (current)
                betGradient.addColorStop(0, fillColor);
                betGradient.addColorStop(entryPosition, fillColor);
                betGradient.addColorStop(1, transparentColor);
            } else {
                // Entry is below, current is above - transparent at top (current), opaque at bottom (entry)
                betGradient.addColorStop(0, transparentColor);
                betGradient.addColorStop(entryPosition, fillColor);
                betGradient.addColorStop(1, fillColor);
            }
            
            ctx.fillStyle = betGradient;
            ctx.fillRect(padding.left, fillTop, chartWidth, fillHeight);
        }
        
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.moveTo(padding.left, entryY);
        ctx.lineTo(width - padding.right, entryY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Price labels
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = '#606070';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const price = max - (range * i / 4);
        const y = padding.top + (height - padding.top - padding.bottom) * i / 4;
        ctx.fillText(price.toFixed(2), width - 10, y + 4);
    }

    // Draw smooth line with bezier curves
    // The rightmost point always stays at the right edge, only Y (price) animates
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    const numPoints = prices.length;
    // Use fixed divisor based on target count for consistent scaling
    const divisor = Math.max(1, targetCount - 1);
    // Right edge X is always fixed
    const rightEdgeX = padding.left + chartWidth;
    // Y position smoothly interpolates via displayPrice (already in prices array as last element)
    let lastDrawnX = rightEdgeX;
    let lastDrawnY = padding.top + chartHeight * (1 - (state.displayPrice - min) / range);

    prices.forEach((price, i) => {
        const x = padding.left + chartWidth * i / divisor;
        const y = padding.top + chartHeight * (1 - (price - min) / range);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else if (i < numPoints - 1) {
            // Use quadratic curves for smoother lines (middle points)
            ctx.lineTo(x, y);
        } else {
            // Last point - always at right edge, Y from displayPrice
            ctx.lineTo(rightEdgeX, lastDrawnY);
        }
    });
    ctx.stroke();

    // Gradient fill - follows animated line endpoint
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.lineTo(lastDrawnX, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw pulsing dot at current price point
    const pulsePhase = (Date.now() % 1500) / 1500; // 1.5s pulse cycle
    const pulseSize = 4 + Math.sin(pulsePhase * Math.PI * 2) * 2;
    const pulseOpacity = 0.6 + Math.sin(pulsePhase * Math.PI * 2) * 0.4;
    
    ctx.beginPath();
    ctx.arc(lastDrawnX, lastDrawnY, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(59, 130, 246, ${pulseOpacity})`;
    ctx.fill();
    
    // Inner dot
    ctx.beginPath();
    ctx.arc(lastDrawnX, lastDrawnY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    // Draw tick countdown stripe (grows from left to right)
    const now = Date.now();
    const timeSinceLastTick = now - state.lastPriceUpdate;
    const tickInterval = state.priceUpdateInterval; // 2000ms
    const tickProgress = Math.min(1, timeSinceLastTick / tickInterval); // 0 to 1
    const stripeWidth = chartWidth * tickProgress; // Grows from 0 to full
    
    // Draw stripe at the very top of chart area
    const stripeHeight = 2;
    const stripeY = padding.top - stripeHeight - 2;
    
    // Dark blue mono color, subtle
    ctx.fillStyle = 'rgba(30, 58, 138, 0.35)';
    ctx.fillRect(padding.left, stripeY, stripeWidth, stripeHeight);

    // Render bet markers
    renderBetMarkers(allBets, closestBet, min, max, chartHeight, padding.top);
}

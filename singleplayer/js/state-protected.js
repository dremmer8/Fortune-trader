// Protected State Management with Anti-Tampering
// This wraps the state object to detect and prevent console manipulation

const StateProtection = (() => {
    // Private storage for sensitive values
    const _private = {
        bankBalance: STARTING_BANK_BALANCE,
        totalEarnings: 0,
        lifetimeSpendings: 0,
        tradingRounds: 0,
        balance: 0,
        lastModified: Date.now()
    };

    // Track expected vs actual changes
    const changeLog = [];
    const MAX_CHANGE_LOG = 100;

    function logChange(property, oldValue, newValue, isLegitimate = true) {
        const entry = {
            timestamp: Date.now(),
            property,
            oldValue,
            newValue,
            isLegitimate,
            stackTrace: new Error().stack
        };
        changeLog.push(entry);
        if (changeLog.length > MAX_CHANGE_LOG) {
            changeLog.shift();
        }

        if (!isLegitimate && typeof SecurityService !== 'undefined') {
            SecurityService.addFlag('direct_state_manipulation', {
                property,
                oldValue,
                newValue,
                timestamp: entry.timestamp
            });
        }
    }

    function createProtectedProperty(obj, propName, initialValue, validator = null) {
        let value = initialValue;

        Object.defineProperty(obj, propName, {
            get() {
                return value;
            },
            set(newValue) {
                const oldValue = value;

                // Validate the change
                if (validator) {
                    const validation = validator(oldValue, newValue);
                    if (!validation.valid) {
                        console.warn(`⚠️ Blocked suspicious change to ${propName}:`, validation.reason);
                        logChange(propName, oldValue, newValue, false);
                        return; // Block the change
                    }
                }

                // Check for suspicious rapid increases
                if (typeof oldValue === 'number' && typeof newValue === 'number') {
                    const timeSinceLastMod = Date.now() - _private.lastModified;
                    const delta = newValue - oldValue;
                    const deltaPercent = oldValue > 0 ? (delta / oldValue) * 100 : 0;

                    // Flag if value increases by >1000% in <1 second
                    if (delta > 0 && deltaPercent > 1000 && timeSinceLastMod < 1000) {
                        console.warn(`⚠️ Suspicious rapid increase in ${propName}: ${deltaPercent.toFixed(0)}% in ${timeSinceLastMod}ms`);
                        logChange(propName, oldValue, newValue, false);
                        if (typeof SecurityService !== 'undefined') {
                            SecurityService.addFlag('rapid_value_increase', {
                                property: propName,
                                deltaPercent,
                                timeSinceLastMod
                            });
                        }
                    }
                }

                value = newValue;
                _private[propName] = newValue;
                _private.lastModified = Date.now();
                logChange(propName, oldValue, newValue, true);
            },
            enumerable: true,
            configurable: false // Prevent re-definition
        });
    }

    // Validators for specific properties
    const validators = {
        bankBalance: (oldVal, newVal) => {
            if (typeof newVal !== 'number' || !Number.isFinite(newVal)) {
                return { valid: false, reason: 'Invalid number' };
            }
            if (newVal < 0) {
                return { valid: false, reason: 'Cannot be negative' };
            }
            if (newVal > 1_000_000_000) {
                return { valid: false, reason: 'Exceeds maximum balance' };
            }
            // Allow legitimate large increases from prestiging
            const delta = newVal - oldVal;
            if (delta > 50_000_000 && delta > oldVal * 10) {
                // Only allow if recent prestige or deposit
                const recentTransactions = typeof SecurityService !== 'undefined' 
                    ? SecurityService.getRecentTransactions(5)
                    : [];
                const hasLegitSource = recentTransactions.some(t => 
                    t.type === 'prestigeToBank' || t.type === 'takeLoan'
                );
                if (!hasLegitSource) {
                    return { valid: false, reason: 'Unexplained large increase' };
                }
            }
            return { valid: true };
        },

        balance: (oldVal, newVal) => {
            if (typeof newVal !== 'number' || !Number.isFinite(newVal)) {
                return { valid: false, reason: 'Invalid number' };
            }
            if (newVal < 0) {
                return { valid: false, reason: 'Cannot be negative' };
            }
            if (newVal > 1_000_000_000) {
                return { valid: false, reason: 'Exceeds maximum balance' };
            }
            return { valid: true };
        },

        totalEarnings: (oldVal, newVal) => {
            if (typeof newVal !== 'number' || !Number.isFinite(newVal)) {
                return { valid: false, reason: 'Invalid number' };
            }
            // Allow reset to 0 (legitimate game reset)
            if (newVal === 0) {
                return { valid: true };
            }
            if (newVal < oldVal) {
                return { valid: false, reason: 'Cannot decrease' };
            }
            if (newVal > 5_000_000_000) {
                return { valid: false, reason: 'Exceeds maximum' };
            }
            return { valid: true };
        },

        tradingRounds: (oldVal, newVal) => {
            if (typeof newVal !== 'number' || !Number.isFinite(newVal)) {
                return { valid: false, reason: 'Invalid number' };
            }
            // Allow reset to 0 (legitimate game reset)
            if (newVal === 0) {
                return { valid: true };
            }
            if (newVal < oldVal) {
                return { valid: false, reason: 'Cannot decrease' };
            }
            if (newVal > 250_000) {
                return { valid: false, reason: 'Exceeds maximum' };
            }
            return { valid: true };
        }
    };

    function protectState(stateObj) {
        // Protect sensitive numeric properties
        createProtectedProperty(stateObj, 'bankBalance', stateObj.bankBalance, validators.bankBalance);
        createProtectedProperty(stateObj, 'balance', stateObj.balance, validators.balance);
        createProtectedProperty(stateObj, 'totalEarnings', stateObj.totalEarnings, validators.totalEarnings);
        createProtectedProperty(stateObj, 'lifetimeSpendings', stateObj.lifetimeSpendings, validators.totalEarnings);
        createProtectedProperty(stateObj, 'tradingRounds', stateObj.tradingRounds, validators.tradingRounds);

        // Periodically verify integrity
        setInterval(() => {
            verifyStateIntegrity(stateObj);
        }, 5000); // Check every 5 seconds
    }

    function verifyStateIntegrity(stateObj) {
        // Check if values match our private storage
        const props = ['bankBalance', 'totalEarnings', 'tradingRounds', 'balance'];
        for (const prop of props) {
            if (_private[prop] !== undefined && stateObj[prop] !== _private[prop]) {
                console.error(`🚨 State corruption detected: ${prop} mismatch`);
                if (typeof SecurityService !== 'undefined') {
                    SecurityService.addFlag('state_corruption', {
                        property: prop,
                        expected: _private[prop],
                        actual: stateObj[prop]
                    });
                }
                // Restore from private storage
                stateObj[prop] = _private[prop];
            }
        }
    }

    function getChangeLog() {
        return [...changeLog];
    }

    function getSuspiciousChanges() {
        return changeLog.filter(c => !c.isLegitimate);
    }

    return {
        protectState,
        verifyStateIntegrity,
        getChangeLog,
        getSuspiciousChanges
    };
})();

// Apply protection after state is initialized
if (typeof state !== 'undefined') {
    StateProtection.protectState(state);
    console.log('🔒 State protection enabled');
}

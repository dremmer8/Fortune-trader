// Security and anti-cheat utilities
const SecurityService = (() => {
    const SECURITY_STATE_KEY = 'fortuneTrader_security_state';
    const TRANSACTION_LOG_KEY = 'fortuneTrader_transaction_log';
    const SIGNING_KEY_KEY = 'fortuneTrader_signing_key';
    const DEVICE_ID_KEY = 'fortuneTrader_device_id';

    const SIGNATURE_VERSION = 1;
    const MAX_LOG_ENTRIES = 200;
    const CLOUD_SUBMISSION_INTERVAL_MS = 30_000;

    const LIMITS = {
        maxBalance: 1_000_000_000,
        maxTotalEarnings: 5_000_000_000,
        maxLifetimeSpendings: 5_000_000_000,
        maxTradingRounds: 250_000,
        maxEarningsPerSecond: 200_000,
        maxBankDeltaPerSecond: 250_000
    };

    const defaultSecurityState = () => ({
        lastSaveAt: 0,
        lastBankBalance: 0,
        lastTotalEarnings: 0,
        lastBalance: 0,
        lastSubmissionAt: 0,
        flagged: false,
        flags: []
    });

    function loadState() {
        try {
            const raw = localStorage.getItem(SECURITY_STATE_KEY);
            if (raw) {
                return { ...defaultSecurityState(), ...JSON.parse(raw) };
            }
        } catch (error) {
            console.warn('Security state load failed:', error);
        }
        return defaultSecurityState();
    }

    function saveState(state) {
        try {
            localStorage.setItem(SECURITY_STATE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('Security state save failed:', error);
        }
    }

    function getDeviceId() {
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
            deviceId = (crypto.randomUUID && crypto.randomUUID()) || `device_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }
        return deviceId;
    }

    function loadTransactionLog() {
        try {
            const raw = localStorage.getItem(TRANSACTION_LOG_KEY);
            if (raw) {
                return JSON.parse(raw) || [];
            }
        } catch (error) {
            console.warn('Transaction log load failed:', error);
        }
        return [];
    }

    function saveTransactionLog(log) {
        try {
            localStorage.setItem(TRANSACTION_LOG_KEY, JSON.stringify(log));
        } catch (error) {
            console.warn('Transaction log save failed:', error);
        }
    }

    function logTransaction(type, details) {
        const entry = {
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            type,
            timestamp: Date.now(),
            details
        };
        const log = loadTransactionLog();
        log.push(entry);
        if (log.length > MAX_LOG_ENTRIES) {
            log.splice(0, log.length - MAX_LOG_ENTRIES);
        }
        saveTransactionLog(log);
        return entry;
    }

    function addFlag(reason, details) {
        const state = loadState();
        const flagEntry = {
            reason,
            timestamp: Date.now(),
            details
        };
        state.flagged = true;
        state.flags = [...(state.flags || []), flagEntry].slice(-20);
        saveState(state);
        logTransaction('flag', flagEntry);
        return flagEntry;
    }

    function validateNumericRange(label, value, min, max) {
        if (!Number.isFinite(value)) {
            return `${label} is not a valid number`;
        }
        if (value < min) {
            return `${label} is below minimum`;
        }
        if (value > max) {
            return `${label} exceeds maximum`;
        }
        return null;
    }

    function validateTransaction(type, payload) {
        const amount = payload?.amount;
        if (!Number.isFinite(amount) || amount <= 0) {
            return { ok: false, reason: 'Invalid amount' };
        }

        switch (type) {
            case 'depositToTrading': {
                if (amount < payload.minDeposit) {
                    return { ok: false, reason: 'Below minimum deposit' };
                }
                if (amount > payload.bankBalance) {
                    return { ok: false, reason: 'Deposit exceeds bank balance' };
                }
                break;
            }
            case 'prestigeToBank': {
                if (payload.portfolioValue <= 0) {
                    return { ok: false, reason: 'Empty portfolio' };
                }
                break;
            }
            case 'buyStock': {
                if (payload.totalCost > payload.balance) {
                    return { ok: false, reason: 'Insufficient balance for purchase' };
                }
                if (!Number.isFinite(payload.price) || payload.price <= 0) {
                    return { ok: false, reason: 'Invalid price' };
                }
                break;
            }
            case 'sellStock': {
                if (!payload.shares || payload.shares <= 0) {
                    return { ok: false, reason: 'No shares to sell' };
                }
                if (!Number.isFinite(payload.price) || payload.price <= 0) {
                    return { ok: false, reason: 'Invalid price' };
                }
                break;
            }
            case 'resolvePosition': {
                if (!Number.isFinite(payload.entryPrice) || payload.entryPrice <= 0) {
                    return { ok: false, reason: 'Invalid entry price' };
                }
                if (!Number.isFinite(payload.currentPrice) || payload.currentPrice <= 0) {
                    return { ok: false, reason: 'Invalid current price' };
                }
                break;
            }
            default:
                break;
        }

        return { ok: true };
    }

    function validateSaveData(saveData) {
        const issues = [];
        const bankIssue = validateNumericRange('Bank balance', saveData.bankBalance, 0, LIMITS.maxBalance);
        if (bankIssue) issues.push(bankIssue);
        const tradingIssue = validateNumericRange('Trading balance', saveData.balance, 0, LIMITS.maxBalance);
        if (tradingIssue) issues.push(tradingIssue);
        const earningsIssue = validateNumericRange('Total earnings', saveData.totalEarnings, 0, LIMITS.maxTotalEarnings);
        if (earningsIssue) issues.push(earningsIssue);
        const spendIssue = validateNumericRange('Lifetime spendings', saveData.lifetimeSpendings, 0, LIMITS.maxLifetimeSpendings);
        if (spendIssue) issues.push(spendIssue);
        const roundsIssue = validateNumericRange('Trading rounds', saveData.tradingRounds, 0, LIMITS.maxTradingRounds);
        if (roundsIssue) issues.push(roundsIssue);

        const state = loadState();
        if (state.lastSaveAt && saveData.timestamp > state.lastSaveAt) {
            const secondsElapsed = Math.max(1, (saveData.timestamp - state.lastSaveAt) / 1000);
            const earningsDelta = saveData.totalEarnings - state.lastTotalEarnings;
            const bankDelta = saveData.bankBalance - state.lastBankBalance;
            if (earningsDelta > LIMITS.maxEarningsPerSecond * secondsElapsed) {
                issues.push('Earnings progression too fast');
            }
            if (bankDelta > LIMITS.maxBankDeltaPerSecond * secondsElapsed) {
                issues.push('Bank balance progression too fast');
            }
        }

        if (issues.length) {
            addFlag('save_validation', { issues, timestamp: saveData.timestamp });
        }

        return { ok: issues.length === 0, issues };
    }

    function updateBaseline(saveData) {
        const state = loadState();
        state.lastSaveAt = saveData.timestamp;
        state.lastBankBalance = saveData.bankBalance;
        state.lastTotalEarnings = saveData.totalEarnings;
        state.lastBalance = saveData.balance;
        saveState(state);
    }

    function stableStringify(value) {
        if (value === null || typeof value !== 'object') {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return `[${value.map(stableStringify).join(',')}]`;
        }
        const keys = Object.keys(value).sort();
        const entries = keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
        return `{${entries.join(',')}}`;
    }

    async function loadSigningKeys() {
        if (!window.crypto || !window.crypto.subtle) {
            return null;
        }

        const stored = localStorage.getItem(SIGNING_KEY_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                const privateKey = await window.crypto.subtle.importKey(
                    'jwk',
                    parsed.privateKeyJwk,
                    { name: 'ECDSA', namedCurve: 'P-256' },
                    true,
                    ['sign']
                );
                const publicKey = await window.crypto.subtle.importKey(
                    'jwk',
                    parsed.publicKeyJwk,
                    { name: 'ECDSA', namedCurve: 'P-256' },
                    true,
                    ['verify']
                );
                return { privateKey, publicKey, publicKeyJwk: parsed.publicKeyJwk };
            } catch (error) {
                console.warn('Failed to load signing keys:', error);
            }
        }

        try {
            const keyPair = await window.crypto.subtle.generateKey(
                { name: 'ECDSA', namedCurve: 'P-256' },
                true,
                ['sign', 'verify']
            );
            const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
            const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
            localStorage.setItem(SIGNING_KEY_KEY, JSON.stringify({ privateKeyJwk, publicKeyJwk }));
            return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, publicKeyJwk };
        } catch (error) {
            console.warn('Failed to generate signing keys:', error);
            return null;
        }
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function signPayload(payload) {
        const keys = await loadSigningKeys();
        if (!keys) {
            return { signature: null, publicKeyJwk: null };
        }
        const data = new TextEncoder().encode(stableStringify(payload));
        const signatureBuffer = await window.crypto.subtle.sign(
            { name: 'ECDSA', hash: { name: 'SHA-256' } },
            keys.privateKey,
            data
        );
        return {
            signature: arrayBufferToBase64(signatureBuffer),
            publicKeyJwk: keys.publicKeyJwk
        };
    }

    async function verifySignature(payload, signature, publicKeyJwk) {
        if (!window.crypto || !window.crypto.subtle || !signature || !publicKeyJwk) {
            return false;
        }
        try {
            const publicKey = await window.crypto.subtle.importKey(
                'jwk',
                publicKeyJwk,
                { name: 'ECDSA', namedCurve: 'P-256' },
                true,
                ['verify']
            );
            const data = new TextEncoder().encode(stableStringify(payload));
            const signatureBuffer = base64ToArrayBuffer(signature);
            return await window.crypto.subtle.verify(
                { name: 'ECDSA', hash: { name: 'SHA-256' } },
                publicKey,
                signatureBuffer,
                data
            );
        } catch (error) {
            console.warn('Signature verification failed:', error);
            return false;
        }
    }

    async function prepareSaveData(saveData) {
        const validation = validateSaveData(saveData);
        const securityState = loadState();
        const security = {
            version: SIGNATURE_VERSION,
            deviceId: getDeviceId(),
            signedAt: Date.now(),
            signature: null,
            signatureAlgorithm: 'ECDSA_P256_SHA256',
            publicKey: null,
            flagged: securityState.flagged,
            flags: securityState.flags || [],
            legacy: !saveData.security
        };

        const payload = { ...saveData, security };
        const payloadForSignature = { ...payload, security: { ...security, signature: null } };
        const signatureResult = await signPayload(payloadForSignature);
        payload.security.signature = signatureResult.signature;
        payload.security.publicKey = signatureResult.publicKeyJwk;
        payload.security.validationIssues = validation.issues;
        payload.security.recentTransactions = loadTransactionLog().slice(-50);

        updateBaseline(saveData);
        return { payload, validation };
    }

    async function verifyLoadedSave(saveData) {
        if (!saveData?.security?.signature) {
            if (saveData) {
                addFlag('missing_signature', { timestamp: Date.now() });
            }
            return { valid: false, reason: 'missing_signature' };
        }
        const payloadForSignature = { ...saveData, security: { ...saveData.security, signature: null } };
        const valid = await verifySignature(payloadForSignature, saveData.security.signature, saveData.security.publicKey);
        if (!valid) {
            addFlag('invalid_signature', { timestamp: Date.now() });
        }
        return { valid, reason: valid ? null : 'invalid_signature' };
    }

    function canSubmitToCloud() {
        const state = loadState();
        const now = Date.now();
        if (state.lastSubmissionAt && now - state.lastSubmissionAt < CLOUD_SUBMISSION_INTERVAL_MS) {
            return { ok: false, retryInMs: CLOUD_SUBMISSION_INTERVAL_MS - (now - state.lastSubmissionAt) };
        }
        state.lastSubmissionAt = now;
        saveState(state);
        return { ok: true };
    }

    function getSecuritySummary() {
        const state = loadState();
        return {
            flagged: state.flagged,
            flags: state.flags || []
        };
    }

    function resetSubmissionTimer() {
        const state = loadState();
        state.lastSubmissionAt = 0;
        saveState(state);
    }

    function getRecentTransactions(count = 10) {
        const log = loadTransactionLog();
        return log.slice(-count);
    }

    function detectTampering() {
        // Check if SecurityService functions have been overridden
        const functionsToCheck = ['validateSaveData', 'addFlag', 'logTransaction'];
        const tampered = [];

        for (const funcName of functionsToCheck) {
            if (typeof SecurityService[funcName] !== 'function') {
                tampered.push(`${funcName} is not a function`);
            }
        }

        // Check if localStorage keys are being modified externally
        const securityState = loadState();
        const expectedKeys = ['lastSaveAt', 'lastBankBalance', 'lastTotalEarnings', 'lastBalance', 'lastSubmissionAt', 'flagged', 'flags'];
        const actualKeys = Object.keys(securityState);
        
        for (const key of expectedKeys) {
            if (!(key in securityState) && securityState.lastSaveAt > 0) {
                tampered.push(`Missing security state key: ${key}`);
            }
        }

        if (tampered.length > 0) {
            addFlag('tampering_detected', { issues: tampered });
            return { tampered: true, issues: tampered };
        }

        return { tampered: false, issues: [] };
    }

    // Run tampering check periodically
    if (typeof window !== 'undefined') {
        setInterval(() => {
            detectTampering();
        }, 10000); // Check every 10 seconds
    }

    return {
        logTransaction,
        addFlag,
        validateTransaction,
        validateSaveData,
        prepareSaveData,
        verifyLoadedSave,
        canSubmitToCloud,
        getSecuritySummary,
        resetSubmissionTimer,
        getRecentTransactions,
        detectTampering
    };
})();

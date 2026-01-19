const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

if (!admin.apps.length) {
  admin.initializeApp();
}

const LIMITS = {
  maxBalance: 1_000_000_000,
  maxTotalEarnings: 5_000_000_000,
  maxLifetimeSpendings: 5_000_000_000,
  maxTradingRounds: 250_000,
  maxEarningsPerSecond: 200_000,
  maxBankDeltaPerSecond: 250_000
};

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

function verifySignature(payload, signature, publicKeyJwk) {
  if (!signature || !publicKeyJwk) {
    return false;
  }
  const verifier = crypto.createVerify('SHA256');
  verifier.update(stableStringify(payload));
  verifier.end();
  try {
    const keyObject = crypto.createPublicKey({ key: publicKeyJwk, format: 'jwk' });
    return verifier.verify(keyObject, Buffer.from(signature, 'base64'));
  } catch (error) {
    console.warn('Signature verification failed:', error);
    return false;
  }
}

function validateRange(label, value, min, max) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return `${label} is invalid`;
  }
  if (value < min) {
    return `${label} below minimum`;
  }
  if (value > max) {
    return `${label} above maximum`;
  }
  return null;
}

exports.validateSubmission = functions.https.onCall(async (data, context) => {
  const { userId, payload } = data || {};
  if (!context.auth || context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid auth.');
  }

  const issues = [];
  issues.push(validateRange('Bank balance', payload.bankBalance, 0, LIMITS.maxBalance));
  issues.push(validateRange('Trading balance', payload.balance, 0, LIMITS.maxBalance));
  issues.push(validateRange('Total earnings', payload.totalEarnings, 0, LIMITS.maxTotalEarnings));
  issues.push(validateRange('Lifetime spendings', payload.lifetimeSpendings, 0, LIMITS.maxLifetimeSpendings));
  issues.push(validateRange('Trading rounds', payload.tradingRounds, 0, LIMITS.maxTradingRounds));

  const cleanIssues = issues.filter(Boolean);

  const security = payload.security || {};
  const payloadForSignature = { ...payload, security: { ...security, signature: null } };
  const signatureValid = verifySignature(payloadForSignature, security.signature, security.publicKey);
  if (!signatureValid) {
    cleanIssues.push('Invalid signature');
  }

  const userRef = admin.firestore().collection('users').doc(userId);
  const snapshot = await userRef.get();
  if (snapshot.exists) {
    const existing = snapshot.data();
    const lastTimestamp = existing.timestamp || 0;
    const secondsElapsed = Math.max(1, (payload.timestamp - lastTimestamp) / 1000);
    const earningsDelta = (payload.totalEarnings || 0) - (existing.totalEarnings || 0);
    const bankDelta = (payload.bankBalance || 0) - (existing.bankBalance || 0);
    if (earningsDelta > LIMITS.maxEarningsPerSecond * secondsElapsed) {
      cleanIssues.push('Earnings progression too fast');
    }
    if (bankDelta > LIMITS.maxBankDeltaPerSecond * secondsElapsed) {
      cleanIssues.push('Bank balance progression too fast');
    }
  }

  if (cleanIssues.length) {
    await userRef.set({ securityStatus: { flagged: true, flags: cleanIssues.slice(-10) } }, { merge: true });
    throw new functions.https.HttpsError('failed-precondition', 'Validation failed.', { issues: cleanIssues });
  }

  return { ok: true };
});

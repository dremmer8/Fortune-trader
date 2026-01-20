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
  try {
    // ECDSA verification with P-256 curve
    const keyObject = crypto.createPublicKey({ 
      key: publicKeyJwk, 
      format: 'jwk' 
    });
    
    // Prepare the data
    const dataString = stableStringify(payload);
    const dataBuffer = Buffer.from(dataString, 'utf8');
    
    // WebCrypto outputs IEEE P1363 format (64 bytes for P-256)
    // Tell Node.js crypto to expect IEEE P1363 format instead of DER
    const signatureBuffer = Buffer.from(signature, 'base64');
    
    // Verify with dsaEncoding set to ieee-p1363 to match WebCrypto format
    const isValid = crypto.verify(
      'sha256',
      dataBuffer,
      {
        key: keyObject,
        dsaEncoding: 'ieee-p1363'  // This tells crypto.verify to expect WebCrypto format!
      },
      signatureBuffer
    );
    
    return isValid;
  } catch (error) {
    console.warn('Signature verification error:', error.message);
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

function stripNonSignedFields(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const {
    playerName,
    gameUserId,
    firebaseUid,
    lastUpdated,
    syncedAt,
    securityStatus,
    ...signedPayload
  } = payload;

  return signedPayload;
}

exports.validateSubmission = functions.https.onCall(async (data, context) => {
  const { userId, payload } = data || {};
  
  // Require Firebase Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // userId format: gameUserId_firebaseUid
  // Extract Firebase UID and verify it matches the authenticated user
  const parts = userId.split('_');
  const firebaseUid = parts.length > 1 ? parts[parts.length - 1] : null;
  
  if (!firebaseUid || context.auth.uid !== firebaseUid) {
    throw new functions.https.HttpsError('permission-denied', 'Auth UID mismatch.');
  }

  const issues = [];
  issues.push(validateRange('Bank balance', payload.bankBalance, 0, LIMITS.maxBalance));
  issues.push(validateRange('Trading balance', payload.balance, 0, LIMITS.maxBalance));
  issues.push(validateRange('Total earnings', payload.totalEarnings, 0, LIMITS.maxTotalEarnings));
  issues.push(validateRange('Lifetime spendings', payload.lifetimeSpendings, 0, LIMITS.maxLifetimeSpendings));
  issues.push(validateRange('Trading rounds', payload.tradingRounds, 0, LIMITS.maxTradingRounds));

  const cleanIssues = issues.filter(Boolean);

  // Check signature if present (legacy saves might not have it)
  const security = payload.security || {};
  if (security.signature && security.publicKey) {
    const signedPayload = stripNonSignedFields(payload);
    // Recreate the exact payload that was signed on the client
    // Client signs BEFORE adding validationIssues and recentTransactions
    const securityForSignature = {
      version: security.version,
      deviceId: security.deviceId,
      signedAt: security.signedAt,
      signature: null,
      signatureAlgorithm: security.signatureAlgorithm,
      publicKey: null,
      flagged: security.flagged,
      flags: security.flags || [],
      legacy: security.legacy
    };
    const payloadForSignature = { ...signedPayload, security: securityForSignature };
    const signatureValid = verifySignature(payloadForSignature, security.signature, security.publicKey);
    if (!signatureValid) {
      cleanIssues.push('Invalid signature');
      console.error('Signature verification failed for user:', userId, {
        hasSignature: !!security.signature,
        hasPublicKey: !!security.publicKey,
        securityVersion: security.version
      });
    }
  } else if (!security.legacy) {
    // Warn but don't fail for missing signature (transition period)
    console.warn('Save missing security signature', { userId, hasSignature: !!security.signature });
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
    console.error('Validation failed for user:', userId, { issues: cleanIssues });
    await userRef.set({ securityStatus: { flagged: true, flags: cleanIssues.slice(-10) } }, { merge: true });
    throw new functions.https.HttpsError('failed-precondition', 'Validation failed: ' + cleanIssues.join(', '), { issues: cleanIssues });
  }

  console.log('Validation passed for user:', userId);
  return { ok: true };
});

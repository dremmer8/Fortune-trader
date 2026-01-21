# Signature Validation Fix

## Issue
New accounts that take a loan and refresh the page encounter a cloud validation error:
```
POST https://us-central1-fortunetrader-c4841.cloudfunctions.net/validateSubmission 400 (Bad Request)
⚠️ Cloud validation failed: Validation failed: Invalid signature
```

## Root Cause

There was a mismatch between what the client signs and what the server verifies:

### What Was Happening (BROKEN):

**Client Side (firebase.js saveUserData):**
1. Creates payload with game data + Firebase metadata:
   ```javascript
   let payload = {
       ...gameData,           // Game state
       playerName,            // Metadata
       gameUserId,            // Metadata
       firebaseUid,           // Metadata
       lastUpdated,           // Metadata
       syncedAt,              // Metadata
       securityStatus         // Metadata
   };
   ```
2. Signs the entire payload (including metadata)
3. Sends to cloud function

**Server Side (validateSubmission cloud function):**
1. Receives payload with metadata
2. Strips metadata using `stripNonSignedFields()`:
   ```javascript
   const { playerName, gameUserId, firebaseUid, 
           lastUpdated, syncedAt, securityStatus, 
           ...signedPayload } = payload;
   ```
3. Tries to verify signature on stripped payload
4. ❌ **Signature fails** because it was signed WITH metadata but verified WITHOUT it

### Why This Affected New Accounts Taking Loans:

1. New account takes a loan → state changes
2. `saveGameState()` creates signed pending snapshot (game data only)
3. User refreshes page
4. `syncPendingSaveSnapshot()` loads pending snapshot
5. Re-signs the game data correctly
6. Calls `saveUserData()` which adds metadata THEN signs again
7. Sends double-wrapped signed data with metadata to cloud
8. Cloud validation fails because signature includes metadata

## Fix Applied

### Changed Signing Order (firebase.js)

**Before:**
```javascript
// Added metadata first
let payload = {
    ...gameData,
    playerName: playerName,
    gameUserId: userId,
    firebaseUid: firebaseUser?.uid,
    lastUpdated: timestamp,
    syncedAt: Date.now(),
    securityStatus: {...}
};

// Then signed (signature includes metadata)
const signed = await SecurityService.prepareSaveData(payload);
payload = signed.payload;
```

**After:**
```javascript
// Sign ONLY the game data first
let payload = gameData;

const signed = await SecurityService.prepareSaveData(gameData);
payload = signed.payload;

// Add metadata AFTER signing (not included in signature)
payload = {
    ...payload,
    playerName: playerName,
    gameUserId: userId,
    firebaseUid: firebaseUser?.uid,
    lastUpdated: timestamp,
    syncedAt: Date.now(),
    securityStatus: {...}
};
```

## How It Works Now

### Signing Flow:
1. **Game data** (state, balance, loans, etc.) is signed with ECDSA signature
2. **Firebase metadata** (playerName, timestamps, etc.) is added AFTER signing
3. Payload sent to cloud contains: `{ ...signedGameData, signature, ...metadata }`

### Verification Flow (Cloud Function):
1. Receives payload with metadata
2. Strips metadata to get original signed data
3. Verifies signature on game data only
4. ✅ **Signature matches** because both client and server work with same data structure

### Benefits:
- ✅ Signature validation now works correctly
- ✅ New accounts can take loans and refresh without errors
- ✅ Pending snapshot sync works properly
- ✅ Cloud validation passes
- ✅ Security is maintained (game data is still signed and verified)

## Technical Details

### Fields Included in Signature:
- `version`, `timestamp`
- `bankBalance`, `balance`, `totalEarnings`, `lifetimeSpendings`, `tradingRounds`
- `initialDeposit`, `lastExpenseDate`
- `ownedItems`, `customExpenseAmounts`, `activeLoan`
- `spendingHistory`, `earningsHistory`
- `stockHoldings`, `streakCount`, `betIndex`
- `purchasedUpgrades`, `cookieInventory`
- `security` object (with signature, publicKey, flags)

### Fields NOT Included in Signature (Added After):
- `playerName` - Firebase metadata
- `gameUserId` - Firebase metadata
- `firebaseUid` - Firebase auth ID
- `lastUpdated` - Server timestamp
- `syncedAt` - Client timestamp
- `securityStatus` - Validation status

This separation ensures that the signature covers the critical game state while allowing metadata to be added for database management without affecting signature verification.

## Files Modified
- `js/firebase.js` - Changed saveUserData to sign game data before adding metadata

## Testing

To verify the fix works:
1. Create a new account and log in
2. Take a loan from the banker
3. Refresh the page (F5) immediately
4. Log back in
5. Verify:
   - No signature validation errors in console
   - Loan is still active
   - Cloud validation passes (✅ Cloud validation passed)
   - Pending snapshot syncs successfully

## Related Fixes
This fix works in conjunction with:
- **LOAN_SYNC_FIX.md** - Ensures loan state is saved before refresh
- **GAME_RESET_FIX.md** - Ensures clean reset without permission errors

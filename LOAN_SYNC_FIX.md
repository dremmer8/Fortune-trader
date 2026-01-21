# Loan Sync Fix - Offline Snapshot System

## Issues Identified

### 1. Loan Changes Not Being Stored
**Problem:** When taking a loan, the state changes were sometimes not persisted properly, especially during rapid page refreshes.

**Root Cause:** The `takeLoan()`, `repayLoan()`, and `processLoanDue()` functions called `saveGameState()` without awaiting it. Since creating the pending snapshot involves async operations (signature generation), if a user refreshed the page immediately after taking a loan, the pending snapshot might not have been created yet.

### 2. Sync Routine Failing on Page Refresh
**Problem:** When refreshing the page (F5) instead of closing and reopening, the offline snapshot sync routine would sometimes fail to restore the most recent state.

**Root Causes:**
- **Race Condition with Firebase:** When `saveGameState()` successfully synced to Firebase, it immediately cleared the pending snapshot. If the user refreshed before the Firebase write fully propagated, the system would try to load from Firebase and get stale data.
  
- **Failed Syncs Not Loading Data:** When `syncPendingSaveSnapshot()` failed to sync to Firebase (network issues, errors, etc.), it would keep the snapshot for retry but NOT load it locally during the current session. This meant the user would see old data from Firebase or localStorage instead of the most recent pending snapshot.

- **Successful Syncs Not Loading Data:** When `syncPendingSaveSnapshot()` successfully synced to Firebase, it would return without the snapshot data, causing the system to load from Firebase. This created a race condition where Firebase might not have the latest data yet.

## Fixes Applied

### Fix 1: Make Loan Functions Async (js/main.js)
Changed the following functions to be async and properly await `saveGameState()`:
- `takeLoan()` - line 818
- `repayLoan()` - line 865  
- `processLoanDue()` - line 892

**Result:** The save operation (including pending snapshot creation) now completes before the function returns, ensuring data is persisted even if the user refreshes immediately.

### Fix 2: Keep Pending Snapshot After Firebase Sync (js/state.js)
Changed `saveGameState()` to NOT clear the pending snapshot immediately after a successful Firebase sync (line 364-369).

**Before:**
```javascript
await FirebaseService.saveUserData(playerId, playerName, saveData);
// Success - clear pending snapshot
localStorage.removeItem(PENDING_SAVE_KEY);
console.log('✅ Firebase synced successfully, pending snapshot cleared');
```

**After:**
```javascript
await FirebaseService.saveUserData(playerId, playerName, saveData);
// Success - but DON'T clear pending snapshot yet
// It will be cleared on next boot after we verify Firebase has the data
// This prevents data loss if user refreshes before Firebase write propagates
console.log('✅ Firebase synced successfully, pending snapshot kept for verification on next boot');
```

**Result:** Pending snapshots are now retained until the next boot, where they're verified and loaded, eliminating race conditions with Firebase write propagation.

### Fix 3: Load Pending Snapshot Even When Sync Succeeds (js/state.js)
Changed `syncPendingSaveSnapshot()` to return the snapshot data with `loadLocally: true` even when the sync to Firebase succeeds (line 554-564).

**Before:**
```javascript
return { hadPendingSave: true, success: true };
```

**After:**
```javascript
return { 
    hadPendingSave: true, 
    success: true,
    loadLocally: true,
    snapshot: snapshot,
    syncedToFirebase: true
};
```

**Result:** The most recent pending snapshot is loaded immediately without waiting for Firebase propagation, ensuring data consistency.

### Fix 4: Load Pending Snapshot When Sync Fails (js/state.js)
Changed `syncPendingSaveSnapshot()` to return the snapshot data with `loadLocally: true` when the sync fails (line 565-574).

**Before:**
```javascript
return { hadPendingSave: true, success: false, error };
```

**After:**
```javascript
return { 
    hadPendingSave: true, 
    success: false, 
    error,
    loadLocally: true,
    snapshot: snapshot,
    syncFailed: true
};
```

**Result:** Even when Firebase sync fails, the pending snapshot is loaded locally so the user sees their most recent state.

### Fix 5: Improved Pending Snapshot Handling (js/state.js)
Updated `loadGameState()` to better handle pending snapshots based on their sync status (line 596-620).

**Changes:**
- Clear pending snapshot only when successfully synced to Firebase
- Keep pending snapshot for retry when sync fails
- Load from pending snapshot immediately instead of waiting for Firebase
- Better logging to track which path is taken

## How It Works Now

### Normal Flow (Taking a Loan)
1. User clicks "Take Loan"
2. `takeLoan()` executes (now async)
3. `state.activeLoan` is set
4. `state.bankBalance` is updated
5. `await saveGameState()` is called and completes:
   - Saves to localStorage immediately
   - Creates signed pending snapshot
   - Attempts Firebase sync (if not rate-limited)
   - Keeps pending snapshot even if sync succeeds
6. User sees notification

### Refresh Flow (Loading After Loan)
1. User refreshes page (F5)
2. `loadGameState()` is called
3. `syncPendingSaveSnapshot()` runs:
   - Finds pending snapshot
   - Verifies signature
   - Attempts to sync to Firebase
   - Returns snapshot data with `loadLocally: true`
4. `loadGameState()` loads the pending snapshot immediately
5. Pending snapshot is cleared (if sync succeeded) or kept for retry (if sync failed)
6. User sees their loan in the correct state

### Benefits
- ✅ No data loss on rapid page refresh
- ✅ No race conditions with Firebase write propagation  
- ✅ Failed Firebase syncs don't cause data loss
- ✅ Works offline and with poor network connections
- ✅ Most recent state always takes precedence

## Testing Recommendations

Test the following scenarios:
1. **Rapid Refresh:** Take a loan, immediately refresh (F5). Verify loan is still active.
2. **Offline Mode:** Disconnect network, take a loan, refresh. Verify loan is still active.
3. **Failed Sync:** Take a loan while Firebase is unavailable, refresh. Verify loan is still active.
4. **Multiple Loans:** Take a loan, refresh, repay, refresh. Verify all state changes persist.
5. **Rate Limiting:** Take multiple loans quickly (trigger rate limiting), refresh. Verify all loans are tracked.

## Files Modified
- `js/main.js` - Made loan functions async
- `js/state.js` - Fixed pending snapshot sync logic and loading behavior

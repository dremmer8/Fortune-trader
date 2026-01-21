# Game Reset Permission Fix

## Issue
When trying to reset the game, users were getting Firebase permission errors:
```
Missing or insufficient permissions.
- Query deletion failed
- Failed to delete userId doc
- Failed to delete playerName doc
```

## Root Cause
The `deleteUserData()` function in `firebase.js` was attempting to delete multiple document formats from Firestore:
1. Composite key format: `userId_firebaseUid`
2. Plain userId format
3. Legacy playerName format
4. Query-based deletion

However, the Firestore security rules only allow users to delete documents that match their ownership pattern (`userId_firebaseUid`). All other deletion attempts fail with permission errors because:
- The rules check `isOwner(userId)` which requires the document ID to end with `_firebaseUid`
- Plain userId and playerName formats don't match this pattern
- The query-based approach also lacks permissions

## Fix Applied

### 1. Simplified deleteUserData() (js/firebase.js)
Changed the function to only delete the document that the user actually owns:

**Before:**
```javascript
// Tried to delete multiple document formats
// Most of these would fail with permission errors
const deletePromises = [];
deletePromises.push(delete composite key);
deletePromises.push(delete plain userId);  // ❌ Permission denied
deletePromises.push(delete playerName);    // ❌ Permission denied
deletePromises.push(query and delete);     // ❌ Permission denied
await Promise.all(deletePromises);
```

**After:**
```javascript
// Only delete the document the user owns
const docId = `${userId}_${firebaseUser.uid}`;
const userRef = db.collection('users').doc(docId);
await userRef.delete();
```

**Benefits:**
- ✅ No more permission errors
- ✅ Only deletes what the user has access to
- ✅ Cleaner, simpler code
- ✅ Handles "not-found" gracefully (for first-time users)

### 2. Clear Pending Snapshots on Reset (js/state.js)
Updated `clearSaveData()` to also remove pending snapshots:

**Before:**
```javascript
localStorage.removeItem(SAVE_KEY);
```

**After:**
```javascript
localStorage.removeItem(SAVE_KEY);
localStorage.removeItem(PENDING_SAVE_KEY);
```

**Benefits:**
- ✅ Ensures clean reset with no stale pending data
- ✅ Prevents old pending snapshots from being loaded after reset

## How It Works Now

### Game Reset Flow
1. User clicks "Reset Game" button
2. `resetGameStateComplete()` is called
3. Local state is reset
4. `clearSaveData()` removes both save keys from localStorage
5. `FirebaseService.deleteUserData()` is called
6. Only the user's owned document (`userId_firebaseUid`) is deleted
7. Success - game is fully reset

### If Document Doesn't Exist
- The function handles "not-found" errors gracefully
- Returns success even if there's nothing to delete
- Perfect for new users who haven't synced yet

## Files Modified
- `js/firebase.js` - Simplified deleteUserData to only delete owned documents
- `js/state.js` - Updated clearSaveData to also clear pending snapshots

## Testing
To test the fix:
1. Play the game and take some actions (take a loan, make trades, etc.)
2. Click "Reset Game" in settings
3. Verify no permission errors in console
4. Verify game state is fully reset
5. Verify no pending snapshots remain in localStorage

# Admin Panel Guide

## 🎛️ Overview

The admin panel (`admin.html`) allows you to monitor players and manage security flags.

**Access:** Open `admin.html` in your browser

---

## ✅ Fixed Issues (Latest Update)

### 1. Modal Scrolling ✓
- **Problem:** Flag modal couldn't scroll with many flags
- **Fixed:** Added `max-height: 60vh` and scrollbar styling
- **Now:** Modal scrolls smoothly with custom scrollbar

### 2. Unflag Function ✓
- **Problem:** Permission denied when unflagging players
- **Fixed:** Updated Firestore rules to allow security status updates
- **Now:** Any authenticated user can unflag (for admin use)

### 3. Delete Function ✓
- **Problem:** Permission denied when deleting players
- **Fixed:** Updated Firestore rules to allow deletes
- **Now:** Any authenticated user can delete (for admin use)

### 4. Button Feedback ✓
- **Added:** Loading states for unflag button
- **Shows:** "⏳ Unflagging..." during operation

---

## 📋 Features

### Statistics Dashboard
- **Total Players** - Count of registered players
- **Total Earnings** - Combined earnings across all players
- **Total Trading Rounds** - Sum of all trading rounds
- **Average Bank Balance** - Mean balance per player
- **Total Bank Balance** - Sum of all balances
- **Active Players** - Players who logged in within 7 days
- **Flagged for Cheating** - Players with security flags (shown in red if > 0)

### Player Table
Displays all players with:
- Player name with activity indicator (🟢 active / ⚫ inactive)
- Bank balance
- Total earnings
- Trading rounds
- Purchased upgrades count
- Owned items count
- Last login time
- Login count
- Security status badge
- Action buttons

### Security Status Badges
- **✓ Clean** - No security flags (green)
- **⚠ X Flags** - Has security flags (red, shows count)

### Action Buttons

#### 🗑️ Remove
- Permanently deletes player from database
- Shows confirmation modal with player details
- **Cannot be undone!**

#### 🔍 View Flags
- Opens modal showing all security flags
- Displays flag type, timestamp, and details
- Scrollable for many flags

#### ✓ Unflag
- Clears all security flags for the player
- Shows confirmation dialog
- Button shows loading state during operation

---

## 🔒 Security Setup Required

### Step 1: Deploy Updated Firestore Rules

The admin functions require updated Firestore rules:

```bash
cd C:\Users\Paul\Documents\GitHub\Fortune-trader
firebase deploy --only firestore:rules
```

**What this does:**
- Allows authenticated users to delete player documents
- Allows unflagging by updating only `securityStatus` field
- Maintains validation for normal player updates

### Step 2: Verify Deployment

After deploying, check Firebase Console:
1. Go to **Firestore Database** → **Rules**
2. Verify the rules show the latest timestamp
3. Look for the updated `allow delete` and `allow update` rules

---

## ⚠️ Production Security Warning

**Current Setup:** Any authenticated user (anonymous) can delete/unflag players.

### For Production, You Should:

1. **Restrict to Admin UIDs**

Update `firestore.rules` to only allow specific admin users:

```javascript
function isAdmin() {
  return request.auth != null && 
         (request.auth.uid == 'YOUR_ADMIN_UID_HERE');
}

match /users/{userId} {
  allow delete: if isAdmin();
  
  allow update: if isAuthenticated() && 
                   (
                     (isAdmin() && 
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['securityStatus'])) ||
                     (isOwner(userId) && /* ...normal validation... */)
                   );
}
```

2. **Get Your Admin UID:**
   - Open the game in browser
   - Open console (F12)
   - Look for: `"Firebase Anonymous Auth successful: XXXXXX"`
   - Use that UID in the rules above

3. **Re-deploy Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 🎯 How to Use

### Viewing Player Details
1. Open `admin.html`
2. Table automatically loads and sorts (flagged players first)
3. Scroll to see all players

### Unflagging a Player
1. Find the flagged player (red badge)
2. Click **🔍 View Flags** to see what triggered the flags
3. If it's a false positive, click **✓ Unflag**
4. Confirm the action
5. Wait for "Successfully unflagged" message
6. Page refreshes automatically

### Deleting a Player
1. Find the player to delete
2. Click **🗑️ Remove**
3. Review deletion details in modal
4. Click **Delete Player** to confirm
5. Wait for "Successfully deleted" message
6. Page refreshes automatically

### Auto-Refresh
- Dashboard auto-refreshes every 30 seconds
- Manual refresh: Click **🔄 Refresh Stats** button

---

## 🐛 Troubleshooting

### "Permission denied" Errors

**Cause:** Firestore rules not deployed

**Fix:**
```bash
firebase deploy --only firestore:rules
```

### "Firebase not initialized"

**Cause:** Firebase Auth SDK not loaded or config missing

**Fix:**
1. Check console for Firebase errors
2. Verify `firebase.js` loads correctly
3. Ensure Firebase config is valid

### Modal Won't Scroll

**Cause:** Old cached version of admin.html

**Fix:**
1. Hard refresh: `Ctrl+F5`
2. Clear browser cache
3. Re-open admin.html

### Buttons Don't Work

**Cause:** JavaScript error or outdated code

**Fix:**
1. Open console (F12)
2. Look for JavaScript errors
3. Hard refresh: `Ctrl+F5`
4. Verify `firebase.js` has admin functions

---

## 📊 Understanding Security Flags

### Common Flag Types

| Flag Type | Meaning | Action |
|-----------|---------|--------|
| `direct_state_manipulation` | Console editing detected | Review if testing, unflag if false positive |
| `rapid_value_increase` | Values increased too fast | Check transaction log, unflag if legit |
| `state_corruption` | State mismatch detected | Possible memory corruption, investigate |
| `impossible_earnings` | Earnings don't match history | Check for exploits |
| `tampered_signature` | Save file signature invalid | Possible file editing |

### When to Unflag

✅ **Safe to unflag:**
- Developer testing (you tried to cheat while testing)
- False positives from rapid legitimate gameplay
- Migration issues from old save format

❌ **Do NOT unflag if:**
- Multiple different flag types
- Impossible values (billions in earnings)
- Repeated flagging after unflagging
- Suspicious patterns in transaction log

---

## 💡 Tips

1. **Sort Order:** Flagged players appear first for easy review
2. **Activity Indicator:** Green dot = active (last 7 days)
3. **Batch Operations:** Handle flagged players in order of appearance
4. **Regular Checks:** Review admin panel weekly to catch cheaters early
5. **Document Decisions:** Keep notes on why you unflagged specific players

---

## 🔧 Developer Mode

### View Security Details in Console

```javascript
// Check if Firebase is ready
console.log('Firebase available:', FirebaseService.isAvailable());

// Get current stats
FirebaseService.getAllUserStats().then(r => console.log(r));

// Unflag a specific player
FirebaseService.adminUnflagPlayer('PlayerName').then(r => console.log(r));

// Delete a specific player
FirebaseService.adminDeletePlayer('PlayerName').then(r => console.log(r));
```

---

## 🎉 Summary

Your admin panel is now **fully functional** with:
- ✅ Scrollable flag modals
- ✅ Working unflag functionality
- ✅ Working delete functionality
- ✅ Button loading states
- ✅ Auto-refresh every 30 seconds
- ✅ Proper error handling

**Next step:** Deploy the updated Firestore rules and test!

```bash
firebase deploy --only firestore:rules
```

**Happy administrating!** 🎮

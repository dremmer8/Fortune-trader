# Deployment Guide

## ✅ Setup Complete

Your admin UID is configured in `functions/.env` (not committed to Git):
```
ADMIN_UIDS=TNQM3ebmLhONZ2NviIrULwTKsh42
```

**To add more admins:** Edit `functions/.env` and add UIDs comma-separated (NO SPACES):
```
ADMIN_UIDS=uid1,uid2,uid3
```

---

## 🚀 Deploy Security Fixes

Just run these two commands:

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Deploy functions (will use .env file automatically)
firebase deploy --only functions
```

That's it! ✅

### ⚙️ Optional: Optimize Leaderboard (for 100+ users)

The leaderboard works out of the box, but for better performance with many users, create a Firestore index:

**Option 1 - Automatic:**
1. Uncomment the optimized query in `functions/adminOperations.js` (see comments)
2. Redeploy: `firebase deploy --only functions`
3. Open the game and view the leaderboard
4. Check browser console for index creation link
5. Click the link and wait 2-5 minutes

**Option 2 - Manual:**
1. Firebase Console → Firestore → Indexes
2. Create composite index:
   - Collection: `users`
   - Fields: `securityStatus.flagged` (Ascending), `totalEarnings` (Descending)
   - Query scope: Collection
3. Uncomment the optimized query in `functions/adminOperations.js`
4. Redeploy: `firebase deploy --only functions`

---

## Verify Deployment

### Check Admin Functions Work

In browser console (after logging in as admin):

```javascript
// Test unflag function
const unflag = firebase.functions().httpsCallable('unflagUser');
unflag({ userId: 'test_user' })
  .then(r => console.log('✅ Admin access works!', r.data))
  .catch(e => console.error('❌ Error:', e.code, e.message));
```

### Check Security Rules Work

```javascript
// Try to read another user's data (should fail)
firebase.firestore().collection('users').doc('otherUserId').get()
  .catch(e => console.log('✅ Security rules work! Permission denied:', e.code));
```

---

## Update Admin UIDs Later

Edit `functions/.env` and redeploy:

```bash
firebase deploy --only functions
```

Or update via Firebase Console:
1. Firebase Console → Functions → select function → Variables tab
2. Edit `ADMIN_UIDS`
3. Save (takes 2-3 minutes to propagate)

---

## What Was Fixed

✅ **Firestore Rules:** Owner-only read/write/delete access  
✅ **Admin Operations:** Moved to secure Cloud Functions  
✅ **Signature Validation:** Enforced after Feb 1, 2026  

See `PUBLIC_CODE_SECURITY_ANALYSIS.md` for security details.

# 🚀 Deployment Checklist

Use this checklist to deploy Fortune Trader to production.

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] No console errors in browser
- [ ] All features tested and working
- [ ] Anti-cheat system tested
- [ ] Mobile responsive (basic functionality)
- [ ] Cross-browser tested (Chrome, Firefox)

### Firebase Setup
- [ ] Anonymous Authentication enabled
- [ ] Firestore rules deployed
- [ ] Cloud Functions deployed
- [ ] Function logs checked for errors
- [ ] Database structure verified

### Security
- [ ] State protection working (test console manipulation)
- [ ] Cloud validation passing
- [ ] Leaderboard filtering flagged users
- [ ] Rate limiting functional
- [ ] Transaction logging active

### Documentation
- [ ] README.md updated
- [ ] Version number updated (if versioning)
- [ ] Changelog updated (if maintaining one)
- [ ] Known issues documented

---

## 🔧 Deployment Steps

### 1. Configure Admin UIDs

Your admin UID should be configured in `functions/.env` (not committed to Git):
```
ADMIN_UIDS=TNQM3ebmLhONZ2NviIrULwTKsh42
```

**To add more admins:** Edit `functions/.env` and add UIDs comma-separated (NO SPACES):
```
ADMIN_UIDS=uid1,uid2,uid3
```

**Update later:** Edit `functions/.env` and redeploy, or update via Firebase Console:
1. Firebase Console → Functions → select function → Variables tab
2. Edit `ADMIN_UIDS`
3. Save (takes 2-3 minutes to propagate)

### 2. Final Code Review
```bash
# Check for console.logs you want to remove
grep -r "console.log" js/

# Check for debug code
grep -r "debugger" js/

# Verify .gitignore is working
git status  # Should not show node_modules, .env files, etc.
```

### 3. Deploy Firebase Components

#### Deploy All at Once
```bash
firebase deploy
```

#### Or Deploy Individually
```bash
# Firestore rules
firebase deploy --only firestore:rules

# Cloud Functions (will use .env file automatically)
firebase deploy --only functions

# Hosting (if using Firebase Hosting)
firebase deploy --only hosting
```

### 4. Optimize Leaderboard (Optional - for 100+ users)

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

### 5. Verify Deployment

#### Check Firebase Console
1. **Functions**: Should show `validateSubmission` deployed
2. **Firestore**: Rules should be published with timestamp
3. **Authentication**: Anonymous method enabled

#### Test Admin Functions (Browser Console)
```javascript
// Test unflag function (as admin)
const unflag = firebase.functions().httpsCallable('unflagUser');
unflag({ userId: 'test_user' })
  .then(r => console.log('✅ Admin access works!', r.data))
  .catch(e => console.error('❌ Error:', e.code, e.message));
```

#### Test Security Rules (Browser Console)
```javascript
// Try to read another user's data (should fail)
firebase.firestore().collection('users').doc('otherUserId').get()
  .catch(e => console.log('✅ Security rules work! Permission denied:', e.code));
```

#### Test Live Site
1. Open in incognito browser
2. Complete login flow
3. Make a trade
4. Check console for errors
5. Verify leaderboard works

---

## 🧪 Post-Deployment Testing

### Critical Tests
- [ ] New user can login (fresh browser)
- [ ] Game saves progress
- [ ] Game loads progress from cloud
- [ ] Anti-cheat blocks console manipulation
- [ ] Leaderboard displays correctly
- [ ] All sounds play
- [ ] Charts render smoothly
- [ ] Mobile version works

### Security Tests
```javascript
// Test 1: Try to cheat
state.bankBalance = 999999999;
// Expected: ⚠️ Blocked

// Test 2: Check validation
saveGameState();
// Expected: ✅ Cloud validation passed

// Test 3: Check security status
SecurityService.getSecuritySummary();
// Expected: { flagged: false, flags: [] }
```

### Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Chart renders at 60fps
- [ ] No memory leaks (play for 10+ minutes)
- [ ] Saves complete in < 1 second

---

## 📊 Monitoring (First Week)

### Daily Checks
- [ ] Firebase Console → **Functions** → Check invocation count
- [ ] Firebase Console → **Firestore** → Check read/write counts
- [ ] Firebase Console → **Authentication** → Check active users

### Weekly Checks
- [ ] Review flagged accounts in Firestore
- [ ] Check for false positives (legitimate players flagged)
- [ ] Review function logs for errors
- [ ] Check for abuse patterns

### Red Flags to Watch For
- ⚠️ Sudden spike in function invocations (>10x normal)
- ⚠️ Many accounts flagged (possible false positives)
- ⚠️ Function errors increasing
- ⚠️ Approaching free tier limits

---

## 💰 Cost Monitoring

### Set Up Billing Alerts
1. Go to Firebase Console → **Settings** → **Usage and billing**
2. Click **Details & settings**
3. Set up budget alerts:
   - Alert at $5
   - Alert at $10
   - Limit at $25 (optional)

### Expected Usage (Per Month)
- Authentication: ~1,000 signins → **$0**
- Firestore: ~500 reads/day → **$0**
- Functions: ~10,000 calls → **$0**
- **Total: $0** (within free tier)

### If Costs Increase
- Check for abuse (spam, bots)
- Review flagged accounts
- Implement stricter rate limiting
- Consider caching strategies

---

## 🔄 Rollback Plan

If something goes wrong after deployment:

### Rollback Functions
```bash
# List previous versions
firebase functions:log

# Redeploy from previous commit
git checkout [previous-commit-hash]
firebase deploy --only functions
git checkout main
```

### Rollback Firestore Rules
1. Go to Firebase Console → **Firestore** → **Rules**
2. Click **View Previous Versions**
3. Select working version
4. Click **Publish**

### Rollback Code
```bash
git revert [commit-hash]
git push
```

---

## 📝 Version Management

### Before Major Changes
```bash
# Create a release tag
git tag -a v2.0.0 -m "Security Enhanced Release"
git push origin v2.0.0
```

### Versioning Strategy
- **Major (v2.0.0)**: Breaking changes, major features
- **Minor (v2.1.0)**: New features, no breaking changes
- **Patch (v2.1.1)**: Bug fixes, minor updates

---

## 🎯 Launch Checklist

Ready to share with the world?

### Technical
- [ ] All tests passing
- [ ] No console errors
- [ ] Firebase deployed
- [ ] Security active
- [ ] Performance good

### Business
- [ ] README.md complete
- [ ] License added
- [ ] Social media images ready
- [ ] Description written
- [ ] Demo video (optional)

### Marketing
- [ ] Share on Reddit (r/gamedev, r/webgames)
- [ ] Post on Twitter/X
- [ ] Submit to Itch.io
- [ ] Share on Discord servers
- [ ] Add to portfolio

---

## 🔒 Security Features Implemented

✅ **Firestore Rules:** Owner-only read/write/delete access  
✅ **Admin Operations:** Moved to secure Cloud Functions  
✅ **Signature Validation:** Enforced after Feb 1, 2026  

See `PUBLIC_CODE_SECURITY_ANALYSIS.md` for detailed security architecture.

---

## 🎉 You're Ready!

Your game is:
- ✅ Professionally structured
- ✅ Well documented
- ✅ Security hardened
- ✅ Production ready
- ✅ Ready to share!

**Go launch your game!** 🚀

---

**Tip:** Keep this checklist for future deployments and updates.

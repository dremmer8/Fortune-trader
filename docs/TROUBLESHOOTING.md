# Troubleshooting Guide

This guide helps you fix common issues with Fortune Trader.

---

## 🔍 Quick Diagnostics

### Check Console Messages
Press **F12** to open Developer Console. Look for:
- ✅ `"Firebase initialized successfully"`
- ✅ `"Firebase Anonymous Auth successful"`  
- ✅ `"🔒 State protection enabled"`
- ✅ `"Cloud validation passed"` (when saving)

If you see all 4 → System is working perfectly! 🎉

---

## 🐛 Common Issues

### Issue: "Firebase Auth not available"

**Symptoms:**
- Game won't save to cloud
- Leaderboard doesn't load
- Console shows Firebase errors

**Solutions:**
1. **Clear browser cache** and reload
   - Chrome: `Ctrl+Shift+Del` → Clear cache
   - Try incognito mode: `Ctrl+Shift+N`

2. **Check Firebase SDK is loaded**
   - Open console, type: `firebase`
   - Should show an object, not "undefined"
   - If undefined → Check index.html has Firebase scripts

3. **Verify Anonymous Auth is enabled**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - **Authentication** → **Sign-in method**
   - Ensure **Anonymous** is enabled

---

### Issue: "Cloud validation failed"

**Symptoms:**
- Warning: `"⚠️ Cloud validation failed"`
- HTTP 400 or 401 errors in console
- Saves work but show warnings

**Solutions:**

#### Option 1: Deploy Cloud Functions
```bash
cd C:\Users\Paul\Documents\GitHub\Fortune-trader
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Check deployment:**
```bash
firebase functions:list
```
Should show: `validateSubmission(us-central1)`

#### Option 2: Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Functions** section
3. Look for `validateSubmission`
4. Check **Logs** tab for errors

#### Option 3: Verify Firebase CLI
```bash
firebase --version  # Should be 13.x or higher
firebase login:list  # Verify logged in
firebase use  # Should show your project
```

---

### Issue: "Permission denied" in Firestore

**Symptoms:**
- Error: `"Missing or insufficient permissions"`
- Can't save/load game data
- Console shows Firestore errors

**Solutions:**

1. **Deploy Firestore Rules**
   ```bash
   cd C:\Users\Paul\Documents\GitHub\Fortune-trader
   firebase deploy --only firestore:rules
   ```

2. **Verify rules are published**
   - Go to Firebase Console → **Firestore Database** → **Rules**
   - Click **Publish** to ensure rules are live
   - Rules should match content of `firestore.rules` file

3. **Check user is authenticated**
   - Console should show: `"Firebase Anonymous Auth successful"`
   - If not, see "Firebase Auth not available" section above

---

### Issue: "state is not defined" or console errors

**Symptoms:**
- Game won't load
- Console shows JavaScript errors
- White screen or partial loading

**Solutions:**

1. **Check script load order**
   - Open `index.html`
   - Verify scripts load in this order:
     1. Firebase SDKs
     2. config.js
     3. audio.js
     4. firebase.js
     5. security.js
     6. state.js
     7. state-protected.js (AFTER state.js)
     8. ui.js, chart.js, trading.js
     9. main.js (LAST)

2. **Clear browser cache completely**
   - Old cached scripts can cause issues
   - Try incognito mode

3. **Check for file corruption**
   - Re-download from GitHub
   - Verify files aren't truncated

---

### Issue: Anti-Cheat Not Working

**Symptoms:**
- Can change `state.bankBalance` in console
- No warning messages when cheating
- Values change without validation

**Solutions:**

1. **Verify state-protected.js is loaded**
   ```javascript
   // In console, type:
   StateProtection
   // Should show an object, not "undefined"
   ```

2. **Check load order**
   - `state-protected.js` MUST load AFTER `state.js`
   - Check `index.html` script tags

3. **Try changing a value**
   ```javascript
   state.bankBalance = 999999999;
   // Should see: ⚠️ Blocked suspicious change
   // Value should NOT change
   ```

4. **Reload the page**
   - Protection activates on page load
   - Hard refresh: `Ctrl+F5`

---

### Issue: Game Doesn't Save

**Symptoms:**
- Progress lost on reload
- "Game saved" message doesn't appear
- Console shows save errors

**Solutions:**

1. **Check localStorage is enabled**
   ```javascript
   // In console:
   localStorage.setItem('test', '1');
   console.log(localStorage.getItem('test'));
   // Should show: "1"
   ```

2. **Clear localStorage corruption**
   ```javascript
   // WARNING: This deletes your save!
   localStorage.removeItem('fortuneTrader_save');
   ```

3. **Check for quota errors**
   - localStorage is limited to ~5-10MB
   - Console may show quota exceeded errors
   - Clear old saves or browser data

4. **Verify save function works**
   ```javascript
   // In console:
   saveGameState();
   // Should see: "Game saved to localStorage"
   ```

---

### Issue: Leaderboard Not Loading

**Symptoms:**
- "Leaderboard unavailable (offline)" message
- Empty leaderboard
- Loading spinner forever

**Solutions:**

1. **Check internet connection**
   - Leaderboard requires internet
   - Test: Can you load other websites?

2. **Verify Firebase project**
   - Check Firebase Console → **Firestore Database**
   - Ensure database exists
   - Check for "users" collection

3. **Check for blocked requests**
   - Some ad-blockers block Firebase
   - Try disabling ad-blocker temporarily
   - Check browser console for CORS errors

4. **Refresh leaderboard**
   - Close and reopen leaderboard app
   - Wait 5-10 seconds for loading

---

### Issue: Charts Not Rendering

**Symptoms:**
- Blank white rectangle where chart should be
- No price line visible
- Chart area exists but empty

**Solutions:**

1. **Check canvas element**
   ```javascript
   // In console:
   document.getElementById('priceChart');
   // Should show a <canvas> element
   ```

2. **Verify chart.js is loaded**
   ```javascript
   // In console:
   typeof initChart
   // Should show: "function"
   ```

3. **Check browser canvas support**
   - Very old browsers may not support Canvas
   - Try Chrome/Firefox/Edge (latest versions)

4. **Look for JavaScript errors**
   - Open console (F12)
   - Look for errors in red
   - Chart errors usually appear early

---

### Issue: Sounds Not Playing

**Symptoms:**
- No audio when trading
- Clicks are silent
- Audio toggle doesn't work

**Solutions:**

1. **Check audio permission**
   - Modern browsers require user interaction first
   - Click anywhere in the game before expecting sound
   - Check browser address bar for microphone/speaker icon

2. **Verify audio files exist**
   - Check `audio/` folder
   - Files should include: click.ogg, succesfullDeal.ogg, etc.

3. **Check volume**
   - Browser volume
   - System volume
   - Game volume slider (in settings)

4. **Test in console**
   ```javascript
   // In console:
   AudioManager.playClick();
   // Should hear a click sound
   ```

---

## 🔧 Advanced Troubleshooting

### Reset Everything (Nuclear Option)

⚠️ **WARNING: This deletes your save data!**

```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Check Firebase Connection

```javascript
// In browser console:
firebase.firestore().collection('users').limit(1).get()
  .then(() => console.log('✅ Firestore connected'))
  .catch(e => console.error('❌ Firestore error:', e));
```

### View Current State

```javascript
// In browser console:
console.log('Bank Balance:', state.bankBalance);
console.log('Trading Balance:', state.balance);
console.log('Total Earnings:', state.totalEarnings);
console.log('Trading Rounds:', state.tradingRounds);
```

### Check Security Flags

```javascript
// In browser console (if SecurityService exists):
SecurityService.getSecuritySummary();
// Shows if you've been flagged
```

---

## 📋 Installation Issues

### Firebase CLI Not Found

**Error:** `firebase: command not found`

**Solution:**
```bash
# Install Node.js first from https://nodejs.org
# Then install Firebase CLI:
npm install -g firebase-tools

# Verify:
firebase --version
```

### npm Not Found

**Error:** `npm: command not found`

**Solution:**
- Download Node.js from https://nodejs.org
- Install it (includes npm)
- Restart your terminal
- Try again

### Permission Denied (Mac/Linux)

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Use sudo (not recommended) OR fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile

# Then install without sudo:
npm install -g firebase-tools
```

---

## 📞 Still Stuck?

### Before Asking for Help

1. ✅ Checked console for errors (F12)
2. ✅ Tried in incognito mode
3. ✅ Cleared browser cache
4. ✅ Tested in different browser
5. ✅ Read this entire guide

### How to Ask for Help

**Good question:**
```
I'm getting "Permission denied" when saving. I've:
- Deployed Firestore rules (firebase deploy --only firestore:rules)
- Verified Anonymous Auth is enabled
- Checked console - shows: [paste exact error]
- Tested in Chrome 120 on Windows 11

What else should I check?
```

**Bad question:**
```
it doesnt work help pls
```

### Where to Get Help

- **GitHub Issues**: [Your repo]/issues
- **Firebase Support**: https://firebase.google.com/support
- **Stack Overflow**: Tag with `firebase` and `javascript`

---

## 🎯 Diagnostic Checklist

Copy this to help debug issues:

```
## System Info
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Game Version: [check version stamp in game]

## Console Messages
- [ ] Firebase initialized successfully
- [ ] Firebase Anonymous Auth successful
- [ ] State protection enabled
- [ ] Cloud validation passed (or error message)

## What I Tried
- [ ] Cleared browser cache
- [ ] Tested in incognito mode
- [ ] Checked console for errors
- [ ] Deployed Firebase (if applicable)

## Error Messages
[Paste exact error messages here]

## Steps to Reproduce
1. Open game
2. [Your steps]
3. Error appears

## Expected vs Actual
Expected: [What should happen]
Actual: [What actually happens]
```

---

**Most issues are solved by:**
1. Clearing browser cache
2. Deploying Cloud Functions
3. Enabling Anonymous Auth
4. Reloading the page

Good luck! 🎮

# Firebase Setup Instructions for Fortune Trader

This guide will help you set up Firebase Authentication, Firestore Database, and Cloud Functions for the anti-cheat system.

---

## 📋 Prerequisites

- A Google account
- Your existing Firebase project (fortunetrader-c4841)
- Node.js installed (for deploying Cloud Functions)

---

## 🔐 Step 1: Enable Firebase Authentication

### 1.1 Go to Firebase Console
1. Visit https://console.firebase.google.com
2. Select your project: **fortunetrader-c4841**

### 1.2 Enable Anonymous Authentication
1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get Started"** (if not already enabled)
3. Go to the **"Sign-in method"** tab
4. Click on **"Anonymous"**
5. Toggle the **"Enable"** switch to ON
6. Click **"Save"**

✅ **Why Anonymous Auth?**
- Works without user registration
- Provides Firebase Auth tokens for Cloud Functions
- Each device gets a unique anonymous UID
- Free tier: 10,000 monthly active users

---

## 🗄️ Step 2: Configure Firestore Database Rules

### 2.1 Update Firestore Rules
1. In Firebase Console, go to **"Build"** → **"Firestore Database"**
2. Click the **"Rules"** tab
3. Replace the existing rules with the content from `firebase-security-rules.json`:

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && ($userId.contains(auth.uid) || !$userId.contains('_'))",
        "bankBalance": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1000000000"
        },
        "balance": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1000000000"
        },
        "totalEarnings": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 5000000000"
        },
        "lifetimeSpendings": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 5000000000"
        },
        "tradingRounds": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 250000"
        },
        "timestamp": {
          ".validate": "newData.isNumber() && newData.val() <= now + 60000"
        },
        "security": {
          ".validate": "newData.hasChildren(['signature', 'publicKey', 'signedAt'])"
        },
        "securityStatus": {
          "flagged": {
            ".validate": "newData.isBoolean()"
          }
        }
      }
    }
  }
}
```

4. Click **"Publish"**

---

## ☁️ Step 3: Deploy Cloud Functions

### 3.1 Install Firebase CLI
Open your terminal and run:
```bash
npm install -g firebase-tools
```

### 3.2 Login to Firebase
```bash
firebase login
```
- This will open a browser window
- Sign in with your Google account

### 3.3 Initialize Firebase Functions (if not already done)
Navigate to your project directory:
```bash
cd C:\Users\Paul\Documents\GitHub\Fortune-trader
firebase init functions
```

When prompted:
- **Select a project:** Choose **"fortunetrader-c4841"**
- **Language:** Choose **JavaScript** (or TypeScript if you prefer)
- **ESLint:** Choose **Yes** or **No** (your preference)
- **Install dependencies:** Choose **Yes**

### 3.4 Copy the Cloud Function
The Cloud Function is already in `functions/validateSubmission.js`. Make sure it's in the correct location:
```
Fortune-trader/
  functions/
    index.js          ← Should export the function
    validateSubmission.js
    package.json
```

### 3.5 Update functions/index.js
Create or update `functions/index.js` to export the validation function:

```javascript
const { validateSubmission } = require('./validateSubmission');

exports.validateSubmission = validateSubmission;
```

### 3.6 Install Required Packages
```bash
cd functions
npm install firebase-admin firebase-functions
cd ..
```

### 3.7 Deploy the Function
```bash
firebase deploy --only functions
```

You should see:
```
✔ functions[validateSubmission(us-central1)] Successful update operation.
```

---

## 🧪 Step 4: Test the Setup

### 4.1 Test Authentication
1. Open your game in a browser
2. Open Developer Console (F12)
3. Look for: `"Firebase Anonymous Auth successful: [UID]"`
4. If you see this, authentication is working! ✅

### 4.2 Test Cloud Function
1. Play the game and make a save
2. In the console, look for: `"✅ Cloud validation passed"`
3. If you see this, Cloud Functions are working! ✅

### 4.3 Test Anti-Cheat
Try to cheat (in console):
```javascript
state.bankBalance = 999999999;
saveGameState();
```

Expected behavior:
- ⚠️ Console warning about blocked change
- 🚩 Save gets flagged
- ❌ Firebase rejects or flags the data

---

## 🎯 Step 5: Verify Everything Works

### Checklist:
- [ ] Firebase Authentication enabled (Anonymous)
- [ ] Firestore rules updated and published
- [ ] Cloud Functions deployed successfully
- [ ] Game shows Firebase Auth success message
- [ ] Cloud validation passes on legitimate saves
- [ ] Cheating attempts are blocked/flagged
- [ ] Leaderboard filters out flagged accounts

---

## 🐛 Troubleshooting

### Issue: "Firebase Auth not available"
**Solution:** Make sure Firebase Auth SDK is loaded in index.html:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
```

### Issue: "Cloud validation failed: UNAUTHENTICATED"
**Solution:** 
- Check that Anonymous Auth is enabled
- Clear browser cache and reload
- Check browser console for auth errors

### Issue: "Permission denied" in Firestore
**Solution:**
- Verify Firestore rules are published
- Check that `auth != null` in rules
- Make sure user is signed in (check console)

### Issue: Cloud Function not found
**Solution:**
```bash
# Check deployed functions
firebase functions:list

# Redeploy if needed
firebase deploy --only functions
```

### Issue: "CORS error" with Cloud Functions
**Solution:** Cloud Functions are automatically CORS-enabled for Firebase domains. If you get CORS errors:
1. Make sure you're using `firebase.functions().httpsCallable()`
2. Not using direct HTTP fetch/axios

---

## 💰 Firebase Pricing (Free Tier Limits)

### Authentication
- **50,000 anonymous auths/month** - FREE
- Your game usage: ~1,000-5,000/month (well within limits)

### Firestore Database
- **1 GB storage** - FREE
- **50,000 reads/day** - FREE
- **20,000 writes/day** - FREE
- Your game usage: ~100-500 writes/day (well within limits)

### Cloud Functions
- **2 million invocations/month** - FREE
- **400,000 GB-seconds compute time** - FREE
- Your game usage: ~5,000-10,000 invocations/month (well within limits)

**Estimated monthly cost: $0** (unless you get 10,000+ daily active users)

---

## 📊 Monitoring

### Check Function Logs
```bash
firebase functions:log
```

Or in Firebase Console:
1. Go to **Functions** section
2. Click on `validateSubmission`
3. View **Logs** tab

### Check Firestore Usage
Firebase Console → Firestore Database → Usage tab

### Check Auth Users
Firebase Console → Authentication → Users tab

---

## 🔒 Security Best Practices

1. **Never commit Firebase secrets** to Git
2. **Rotate API keys** if exposed
3. **Monitor function logs** for abuse patterns
4. **Set up billing alerts** (optional but recommended)
5. **Regularly review flagged accounts** in your admin dashboard

---

## ✅ You're Done!

Your anti-cheat system is now fully operational with:
- ✅ Protected state object (console tampering detection)
- ✅ Firebase Anonymous Authentication
- ✅ Server-side validation via Cloud Functions
- ✅ Cryptographic signature verification
- ✅ Transaction logging and audit trails
- ✅ Rate limiting
- ✅ Leaderboard filtering

### Next Steps:
1. Test thoroughly in different browsers
2. Monitor for false positives
3. Adjust rate limits if needed
4. Consider adding IP-based throttling for production

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Check browser console for client-side errors
3. Review function logs: `firebase functions:log`
4. Verify all steps in this guide were completed

Common issues are usually:
- Firestore rules not published
- Cloud Functions not deployed
- Anonymous Auth not enabled
- Browser cache (try incognito mode)

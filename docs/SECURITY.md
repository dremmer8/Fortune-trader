# Fortune Trader Anti-Cheat Overview

## Goals
- Reduce casual console tampering by logging transactions and signing saves.
- Detect impossible progression spikes.
- Reject suspicious data in Firebase and hide flagged accounts from the leaderboard.
- Keep offline play intact via localStorage.

## Security Layers
1. **Client-side validation and transaction logging**  
   - Every financial action writes to a rolling transaction log in localStorage.
   - Save data is validated against configurable limits and progression rates.
   - Flags are stored locally and synced to Firebase for moderation.  
   See `js/security.js`, `js/state.js`, and `js/trading.js`.  

2. **Cryptographic signing of saves**  
   - Client generates an ECDSA P-256 keypair in WebCrypto.
   - Save payloads are signed and verified on load.
   - Signature metadata is stored in the `security` block.  
   See `js/security.js`.  

3. **Firebase Security Rules**  
   - Enforces numeric ranges and the presence of security data.
   - Rejects obviously invalid values before write.  
   See `firebase-security-rules.json`.  

4. **Firebase Cloud Function validation**  
   - Verifies signature server-side.
   - Checks progression rates using the last stored document.
   - Flags and rejects suspicious submissions.  
   See `functions/validateSubmission.js`.  

5. **Leaderboard filtering**  
   - Entries flagged by security checks are excluded from the leaderboard.  
   See `js/main.js`.  

## Migration Strategy
- Existing saves without a `security` block are still loadable.
- On next save, the client signs the payload and attaches `security.legacy = true`.
- If signatures are missing or invalid, the save is flagged locally and on next sync.

## Testing Strategy
1. **Local unit sanity checks**
   - Modify balances in DevTools and confirm saves are flagged and rejected by cloud validation.
2. **Rate limiting**
   - Attempt multiple rapid saves and verify cloud submission throttling.
3. **Signature verification**
   - Manually alter saved payload in localStorage and verify load flags signature mismatch.
4. **Leaderboard filtering**
   - Force a flagged status and ensure the player no longer appears on the leaderboard.
5. **Offline mode**
   - Disable network and confirm local saves still succeed and load properly.

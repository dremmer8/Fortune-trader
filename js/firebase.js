// Firebase Configuration and Service
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCuBxU5HNVB3swbPjX7I1uIFtUu4VTOfjc",
    authDomain: "fortunetrader-c4841.firebaseapp.com",
    projectId: "fortunetrader-c4841",
    storageBucket: "fortunetrader-c4841.firebasestorage.app",
    messagingSenderId: "997153385201",
    appId: "1:997153385201:web:c5b4de881ec0b7290a1750",
    measurementId: "G-1JWRVBJPEQ"
  };

// Initialize Firebase (only if Firebase is loaded)
let db = null;
let functions = null;
let auth = null;
let currentFirebaseUser = null;

function normalizeNameKey(name) {
    return (name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        functions = firebase.functions ? firebase.functions() : null;
        auth = firebase.auth ? firebase.auth() : null;
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
}

// Firebase Anonymous Authentication for Cloud Functions
async function ensureFirebaseAuth() {
    if (!auth) {
        console.warn('Firebase Auth not available');
        return null;
    }

    try {
        // Check if already signed in
        if (auth.currentUser) {
            currentFirebaseUser = auth.currentUser;
            return auth.currentUser;
        }

        // Sign in anonymously
        const userCredential = await auth.signInAnonymously();
        currentFirebaseUser = userCredential.user;
        console.log('Firebase Anonymous Auth successful:', currentFirebaseUser.uid);
        return currentFirebaseUser;
    } catch (error) {
        console.error('Firebase Auth failed:', error);
        return null;
    }
}

// Listen for auth state changes
if (auth) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentFirebaseUser = user;
            console.log('Firebase Auth state: signed in', user.uid);
        } else {
            currentFirebaseUser = null;
            console.log('Firebase Auth state: signed out');
        }
    });
}

// Firebase Service Functions
const FirebaseService = {
    // Check if Firebase is available
    isAvailable() {
        return db !== null && typeof firebase !== 'undefined';
    },

    // Save user game data to Firebase (cloud backup)
    async saveUserData(userId, playerName, gameData) {
        if (!this.isAvailable()) {
            console.warn('Firebase not available, skipping cloud sync');
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            if (!userId) {
                return { success: false, error: 'Missing user ID' };
            }

            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                console.warn('Firebase Auth unavailable, saving without validation');
            }

            if (typeof SecurityService !== 'undefined') {
                const gate = SecurityService.canSubmitToCloud();
                if (!gate.ok) {
                    return { success: false, error: 'Rate limited' };
                }
            }

            // Use stable hash-based userId across devices
            const docId = userId;
            const userRef = db.collection('users').doc(docId);
            
            // Sign ONLY the game data (without Firebase metadata)
            // This matches what the cloud function expects to verify
            let payload = gameData;
            
            if (typeof SecurityService !== 'undefined') {
                const signed = await SecurityService.prepareSaveData(gameData);
                payload = signed.payload;
                if (!signed.validation.ok) {
                    console.warn('Save validation issues detected:', signed.validation.issues);
                }
            }
            
            // Add Firebase metadata AFTER signing (these fields are not included in signature)
            payload = {
                ...payload,
                playerName: playerName,
                nameKey: normalizeNameKey(playerName),
                gameUserId: userId, // Store the game's user ID separately
                firebaseUid: firebaseUser ? firebaseUser.uid : null,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                syncedAt: Date.now(),
                securityStatus: typeof SecurityService !== 'undefined' ? SecurityService.getSecuritySummary() : { flagged: false, flags: [] }
            };

            // Validate with Cloud Function if available
            if (functions && firebaseUser) {
                try {
                    const validate = firebase.functions().httpsCallable('validateSubmission');
                    const result = await validate({ userId: docId, payload });
                    console.log('✅ Cloud validation passed');
                    
                    // After successful validation, clear security flags (but don't re-sign)
                    payload.securityStatus = { flagged: false, flags: [] };
                } catch (error) {
                    const errorMessage = error?.message || String(error);
                    const errorDetails = error?.details || {};
                    console.warn('⚠️ Cloud validation failed:', errorMessage, errorDetails);
                    
                    // Flag but don't block - offline mode should still work
                    if (typeof SecurityService !== 'undefined') {
                        SecurityService.addFlag('cloud_validation_failed', { 
                            error: errorMessage,
                            details: errorDetails,
                            timestamp: Date.now()
                        });
                    }
                }
            }

            await userRef.set(payload, { merge: true });
            console.log('Game data synced to Firebase');
            return { success: true };
        } catch (error) {
            console.error('Error syncing to Firebase:', error);
            // Don't fail the save - localStorage is primary
            return { success: false, error: error.message };
        }
    },

    // Load user game data from Firebase (for cross-device access)
    async loadUserData(userId, playerName) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            // Ensure Firebase Auth
            const firebaseUser = await ensureFirebaseAuth();

            // Try to load with stable userId first
            if (userId) {
                const userRef = db.collection('users').doc(userId);
                const doc = await userRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data?.securityStatus?.flagged) {
                        console.warn('⚠️ Loaded data flagged by security rules.');
                    }
                    // Remove Firebase metadata
                    const cleanData = { ...data };
                    delete cleanData.lastUpdated;
                    delete cleanData.syncedAt;
                    delete cleanData.firebaseUid;
                    delete cleanData.gameUserId;
                    return { success: true, data: cleanData };
                }
            }

            // Fallback: Try to find by querying for gameUserId (legacy composite docs)
            if (userId) {
                const querySnapshot = await db.collection('users')
                    .where('gameUserId', '==', userId)
                    .limit(1)
                    .get();
                
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    if (data?.securityStatus?.flagged) {
                        console.warn('⚠️ Loaded data flagged by security rules.');
                    }
                    const cleanData = { ...data };
                    delete cleanData.lastUpdated;
                    delete cleanData.syncedAt;
                    delete cleanData.firebaseUid;
                    delete cleanData.gameUserId;
                    return { success: true, data: cleanData };
                }
            }

            // Legacy fallback: Try old userId format
            if (userId) {
                const userRef = db.collection('users').doc(userId);
                const doc = await userRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    const cleanData = { ...data };
                    delete cleanData.lastUpdated;
                    delete cleanData.syncedAt;
                    return { success: true, data: cleanData };
                }
            }

            // Final fallback: Legacy playerName lookup
            if (playerName) {
                const legacyRef = db.collection('users').doc(playerName);
                const legacyDoc = await legacyRef.get();
                if (legacyDoc.exists) {
                    const data = legacyDoc.data();
                    const cleanData = { ...data };
                    delete cleanData.lastUpdated;
                    delete cleanData.syncedAt;
                    return { success: true, data: cleanData };
                }
            }

            return { success: false, data: null };
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if cloud data is newer than local
    async checkCloudSyncStatus(userId, localTimestamp) {
        if (!this.isAvailable()) {
            return { hasCloudData: false };
        }

        try {
            if (!userId) {
                return { hasCloudData: false };
            }
            const userRef = db.collection('users').doc(userId);
            const doc = await userRef.get();
            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTimestamp = cloudData.timestamp || 0;
                // Return true if cloud is newer
                return { 
                    hasCloudData: true, 
                    isNewer: cloudTimestamp > localTimestamp,
                    cloudTimestamp: cloudTimestamp
                };
            }
            return { hasCloudData: false };
        } catch (error) {
            console.error('Error checking sync status:', error);
            return { hasCloudData: false };
        }
    },

    // Update user login timestamp
    async updateLoginTime(userId, playerName) {
        if (!this.isAvailable()) {
            return;
        }

        try {
            if (!userId) {
                return;
            }

            // Ensure Firebase Auth is ready before updating
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                console.warn('Cannot update login time: Auth not ready');
                return;
            }

            // Use stable hash-based userId across devices
            const docId = userId;
            const userRef = db.collection('users').doc(docId);
            
            await userRef.set({
                playerName: playerName,
                nameKey: normalizeNameKey(playerName),
                gameUserId: userId,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                loginCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        } catch (error) {
            console.warn('Error updating login time:', error.message);
        }
    },

    // Find account by name key (case-insensitive)
    async findUserByNameKey(nameKey, playerName = '') {
        if (!this.isAvailable()) {
            return { success: false, found: false, error: 'Firebase not initialized' };
        }

        try {
            if (!nameKey) {
                return { success: false, found: false, error: 'Missing name key' };
            }

            // Ensure Firebase Auth is ready before querying
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                console.warn('Firebase Auth unavailable, lookup may be limited');
            }

            const querySnapshot = await db.collection('users')
                .where('nameKey', '==', nameKey)
                .limit(1)
                .get();

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { success: true, found: true, docId: doc.id, data: doc.data() };
            }

            // Legacy fallback: exact playerName match (case-sensitive)
            if (playerName) {
                const legacySnapshot = await db.collection('users')
                    .where('playerName', '==', playerName)
                    .limit(1)
                    .get();

                if (!legacySnapshot.empty) {
                    const doc = legacySnapshot.docs[0];
                    return { success: true, found: true, docId: doc.id, data: doc.data() };
                }
            }

            return { success: true, found: false };
        } catch (error) {
            console.error('Error finding user by name key:', error);
            return { success: false, found: false, error: error.message };
        }
    },

    // Get all user statistics (for admin dashboard)
    // Get all user stats (ADMIN ONLY - uses Cloud Function)
    async getAllUserStats() {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Call admin Cloud Function
            const getAllStats = firebase.functions().httpsCallable('getAllUserStats');
            const result = await getAllStats();
            
            if (result.data.success) {
                // Convert lastLogin timestamps if needed
                const stats = result.data.stats.map(stat => ({
                    ...stat,
                    lastLogin: stat.lastLogin ? new Date(stat.lastLogin._seconds * 1000) : null
                }));
                return { success: true, stats };
            } else {
                return { success: false, error: result.data.message || 'Failed to get stats' };
            }
        } catch (error) {
            console.error('Error getting stats:', error);
            if (error.code === 'permission-denied') {
                return { success: false, error: 'Admin permissions required' };
            }
            return { success: false, error: error.message };
        }
    },

    // Get public leaderboard data (available to all authenticated users)
    async getLeaderboard() {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Call public Cloud Function
            const getLeaderboardFunc = firebase.functions().httpsCallable('getLeaderboard');
            const result = await getLeaderboardFunc();
            
            if (result.data.success) {
                return { success: true, leaderboard: result.data.leaderboard };
            } else {
                return { success: false, error: result.data.message || 'Failed to get leaderboard' };
            }
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete user game data from Firebase (for reset/account deletion)
    async deleteUserData(userId, playerName) {
        if (!this.isAvailable()) {
            console.warn('Firebase not available, skipping cloud deletion');
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            if (!userId) {
                return { success: false, error: 'Missing user ID' };
            }

            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            
            if (!firebaseUser) {
                console.warn('Cannot delete: Firebase Auth not available');
                return { success: false, error: 'Authentication required' };
            }

            // Only delete the document that matches the current ownership pattern
            // This is the only document the user has permission to delete
            const docId = `${userId}_${firebaseUser.uid}`;
            const userRef = db.collection('users').doc(docId);
            
            try {
                await userRef.delete();
                console.log(`✅ User data deleted from Firebase: ${docId}`);
                return { success: true };
            } catch (err) {
                // If the document doesn't exist or permission denied, that's okay for reset
                if (err.code === 'not-found' || err.code === 'permission-denied') {
                    console.log('No cloud data to delete or already deleted');
                    return { success: true };
                }
                throw err;
            }
        } catch (error) {
            console.error('Error deleting from Firebase:', error);
            return { success: false, error: error.message };
        }
    },

    // Admin function: Delete player by playerName (for admin dashboard)
    // SECURITY: Uses Cloud Function with server-side authorization
    async adminDeletePlayer(playerIdentifier) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            const identifier = typeof playerIdentifier === 'string'
                ? { playerName: playerIdentifier }
                : (playerIdentifier || {});
            const { docId } = identifier;

            if (!docId) {
                return { success: false, error: 'Document ID required' };
            }

            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Call secure Cloud Function instead of direct Firestore access
            const deleteUser = firebase.functions().httpsCallable('deleteUser');
            const result = await deleteUser({ userId: docId });
            
            if (result.data.success) {
                console.log(`Admin deleted player: ${docId}`);
                return { success: true };
            } else {
                return { success: false, error: result.data.message || 'Delete failed' };
            }
        } catch (error) {
            console.error('Error deleting player:', error);
            // Handle specific error codes
            if (error.code === 'permission-denied') {
                return { success: false, error: 'Admin permissions required' };
            }
            return { success: false, error: error.message };
        }
    },

    // Admin function: Unflag player (clear security flags)
    // SECURITY: Uses Cloud Function with server-side authorization
    async adminUnflagPlayer(playerIdentifier) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            const identifier = typeof playerIdentifier === 'string'
                ? { playerName: playerIdentifier }
                : (playerIdentifier || {});
            const { docId } = identifier;

            if (!docId) {
                return { success: false, error: 'Document ID required' };
            }

            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Call secure Cloud Function instead of direct Firestore access
            const unflagUser = firebase.functions().httpsCallable('unflagUser');
            const result = await unflagUser({ userId: docId });
            
            if (result.data.success) {
                console.log(`Admin unflagged player: ${docId}`);
                return { success: true };
            } else {
                return { success: false, error: result.data.message || 'Unflag failed' };
            }
        } catch (error) {
            console.error('Error unflagging player:', error);
            // Handle specific error codes
            if (error.code === 'permission-denied') {
                return { success: false, error: 'Admin permissions required' };
            }
            return { success: false, error: error.message };
        }
    }
};

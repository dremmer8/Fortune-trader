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

            // Use composite key: hash-based userId + Firebase auth UID
            const docId = firebaseUser ? `${userId}_${firebaseUser.uid}` : userId;
            const userRef = db.collection('users').doc(docId);
            
            const payload = {
                ...gameData,
                playerName: playerName,
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

            // Try to load with composite key first
            if (userId && firebaseUser) {
                const docId = `${userId}_${firebaseUser.uid}`;
                const userRef = db.collection('users').doc(docId);
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

            // Fallback: Try to find by querying for gameUserId
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

            // Use composite key format
            const docId = `${userId}_${firebaseUser.uid}`;
            const userRef = db.collection('users').doc(docId);
            
            await userRef.set({
                playerName: playerName,
                gameUserId: userId,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                loginCount: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        } catch (error) {
            console.warn('Error updating login time:', error.message);
        }
    },

    // Get all user statistics (for admin dashboard)
    async getAllUserStats() {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            const usersRef = db.collection('users');
            const snapshot = await usersRef.get();
            const stats = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                stats.push({
                    playerName: data.playerName || doc.id,
                    bankBalance: data.bankBalance || 0,
                    totalEarnings: data.totalEarnings || 0,
                    tradingRounds: data.tradingRounds || 0,
                    lastLogin: data.lastLogin?.toDate() || null,
                    loginCount: data.loginCount || 0,
                    purchasedUpgrades: data.purchasedUpgrades?.length || 0,
                    ownedItems: data.ownedItems?.length || 0,
                    lastSynced: data.syncedAt || null,
                    securityStatus: data.securityStatus || { flagged: false, flags: [] }
                });
            });
            return { success: true, stats: stats };
        } catch (error) {
            console.error('Error getting stats:', error);
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

            // Delete all possible document locations for this user
            const deletePromises = [];

            // 1. Try composite key format (userId_firebaseUid)
            if (firebaseUser) {
                const docId = `${userId}_${firebaseUser.uid}`;
                const userRef = db.collection('users').doc(docId);
                deletePromises.push(userRef.delete().catch(err => {
                    console.warn(`Failed to delete composite key doc: ${err.message}`);
                }));
            }

            // 2. Try plain userId format
            const userRef = db.collection('users').doc(userId);
            deletePromises.push(userRef.delete().catch(err => {
                console.warn(`Failed to delete userId doc: ${err.message}`);
            }));

            // 3. Try legacy playerName format
            if (playerName) {
                const legacyRef = db.collection('users').doc(playerName);
                deletePromises.push(legacyRef.delete().catch(err => {
                    console.warn(`Failed to delete playerName doc: ${err.message}`);
                }));
            }

            // 4. Query and delete any documents with matching gameUserId
            if (userId) {
                try {
                    const querySnapshot = await db.collection('users')
                        .where('gameUserId', '==', userId)
                        .get();
                    
                    querySnapshot.forEach(doc => {
                        deletePromises.push(doc.ref.delete().catch(err => {
                            console.warn(`Failed to delete queried doc: ${err.message}`);
                        }));
                    });
                } catch (queryError) {
                    console.warn('Query deletion failed:', queryError.message);
                }
            }

            // Wait for all deletions to complete
            await Promise.all(deletePromises);
            
            console.log('User data deleted from Firebase (all possible locations)');
            return { success: true };
        } catch (error) {
            console.error('Error deleting from Firebase:', error);
            return { success: false, error: error.message };
        }
    },

    // Admin function: Delete player by playerName (for admin dashboard)
    async adminDeletePlayer(playerName) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Query for all documents with this player name
            const querySnapshot = await db.collection('users')
                .where('playerName', '==', playerName)
                .get();

            if (querySnapshot.empty) {
                return { success: false, error: 'Player not found' };
            }

            // Delete all matching documents
            const deletePromises = [];
            querySnapshot.forEach(doc => {
                deletePromises.push(doc.ref.delete());
            });

            await Promise.all(deletePromises);
            
            console.log(`Admin deleted player: ${playerName}`);
            return { success: true, deletedCount: deletePromises.length };
        } catch (error) {
            console.error('Error deleting player:', error);
            return { success: false, error: error.message };
        }
    },

    // Admin function: Unflag player (clear security flags)
    async adminUnflagPlayer(playerName) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            // Ensure Firebase Auth is set up
            const firebaseUser = await ensureFirebaseAuth();
            if (!firebaseUser) {
                return { success: false, error: 'Authentication required' };
            }

            // Query for all documents with this player name
            const querySnapshot = await db.collection('users')
                .where('playerName', '==', playerName)
                .get();

            if (querySnapshot.empty) {
                return { success: false, error: 'Player not found' };
            }

            // Update all matching documents
            const updatePromises = [];
            querySnapshot.forEach(doc => {
                updatePromises.push(doc.ref.update({
                    securityStatus: { flagged: false, flags: [] }
                }));
            });

            await Promise.all(updatePromises);
            
            console.log(`Admin unflagged player: ${playerName}`);
            return { success: true, updatedCount: updatePromises.length };
        } catch (error) {
            console.error('Error unflagging player:', error);
            return { success: false, error: error.message };
        }
    }
};

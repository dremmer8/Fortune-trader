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
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization failed:', error);
    }
}

// Firebase Service Functions
const FirebaseService = {
    // Check if Firebase is available
    isAvailable() {
        return db !== null && typeof firebase !== 'undefined';
    },

    // Save user game data to Firebase (cloud backup)
    async saveUserData(playerName, gameData) {
        if (!this.isAvailable()) {
            console.warn('Firebase not available, skipping cloud sync');
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            const userRef = db.collection('users').doc(playerName);
            await userRef.set({
                ...gameData,
                playerName: playerName,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                syncedAt: Date.now()
            }, { merge: true });
            console.log('Game data synced to Firebase');
            return { success: true };
        } catch (error) {
            console.error('Error syncing to Firebase:', error);
            // Don't fail the save - localStorage is primary
            return { success: false, error: error.message };
        }
    },

    // Load user game data from Firebase (for cross-device access)
    async loadUserData(playerName) {
        if (!this.isAvailable()) {
            return { success: false, error: 'Firebase not initialized' };
        }

        try {
            const userRef = db.collection('users').doc(playerName);
            const doc = await userRef.get();
            if (doc.exists) {
                const data = doc.data();
                // Remove Firebase metadata
                const cleanData = { ...data };
                delete cleanData.lastUpdated;
                delete cleanData.syncedAt;
                return { success: true, data: cleanData };
            } else {
                return { success: false, data: null };
            }
        } catch (error) {
            console.error('Error loading from Firebase:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if cloud data is newer than local
    async checkCloudSyncStatus(playerName, localTimestamp) {
        if (!this.isAvailable()) {
            return { hasCloudData: false };
        }

        try {
            const userRef = db.collection('users').doc(playerName);
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
    async updateLoginTime(playerName) {
        if (!this.isAvailable()) {
            return;
        }

        try {
            const userRef = db.collection('users').doc(playerName);
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                loginCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error updating login time:', error);
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
                    lastSynced: data.syncedAt || null
                });
            });
            return { success: true, stats: stats };
        } catch (error) {
            console.error('Error getting stats:', error);
            return { success: false, error: error.message };
        }
    }
};

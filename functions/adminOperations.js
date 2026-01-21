const { onCall } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

// Define admin UIDs parameter (loaded securely from environment, not hardcoded)
// Set via: firebase deploy --only functions --set-env-var ADMIN_UIDS="uid1,uid2,uid3"
// Or use .env file for local development: ADMIN_UIDS="uid1,uid2,uid3"
const adminUidsParam = defineString('ADMIN_UIDS', {
  description: 'Comma-separated list of Firebase UIDs with admin permissions',
  default: ''
});

// Parse admin UIDs from parameter
function getAdminUids() {
  const uidsString = adminUidsParam.value();
  return uidsString
    .split(',')
    .map(uid => uid.trim())
    .filter(Boolean);
}

// Helper function to check if user is admin
function isAdmin(uid) {
  const adminUids = getAdminUids();
  
  // Log warning if no admins configured (only on first call)
  if (adminUids.length === 0) {
    console.warn('⚠️ No admin UIDs configured. Set ADMIN_UIDS environment variable.');
  }
  
  return adminUids.includes(uid);
}

/**
 * Unflag a user account
 * Only accessible by authorized admins
 */
exports.unflagUser = onCall(async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new Error('Must be authenticated.');
  }

  // Check if caller is an admin
  if (!isAdmin(request.auth.uid)) {
    throw new Error('Only administrators can unflag users.');
  }

  const { userId } = request.data || {};

  if (!userId) {
    throw new Error('userId is required.');
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      throw new Error('User not found.');
    }

    // Unflag the user
    await userRef.update({
      'securityStatus.flagged': false,
      'securityStatus.unflaggedBy': request.auth.uid,
      'securityStatus.unflaggedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Admin ${request.auth.uid} unflagged user: ${userId}`);

    return {
      success: true,
      message: 'User successfully unflagged'
    };
  } catch (error) {
    console.error('Error unflagging user:', error);
    throw new Error(error.message);
  }
});

/**
 * Delete a user account
 * Only accessible by authorized admins
 */
exports.deleteUser = onCall(async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new Error('Must be authenticated.');
  }

  // Check if caller is an admin
  if (!isAdmin(request.auth.uid)) {
    throw new Error('Only administrators can delete users.');
  }

  const { userId } = request.data || {};

  if (!userId) {
    throw new Error('userId is required.');
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      throw new Error('User not found.');
    }

    // Delete the user document
    await userRef.delete();

    console.log(`Admin ${request.auth.uid} deleted user: ${userId}`);

    return {
      success: true,
      message: 'User successfully deleted'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }
});

/**
 * Get list of flagged users
 * Only accessible by authorized admins
 */
exports.getFlaggedUsers = onCall(async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new Error('Must be authenticated.');
  }

  // Check if caller is an admin
  if (!isAdmin(request.auth.uid)) {
    throw new Error('Only administrators can view flagged users.');
  }

  try {
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('securityStatus.flagged', '==', true).get();

    const flaggedUsers = [];
    snapshot.forEach(doc => {
      flaggedUsers.push({
        userId: doc.id,
        ...doc.data()
      });
    });

    console.log(`Admin ${request.auth.uid} retrieved ${flaggedUsers.length} flagged users`);

    return {
      success: true,
      users: flaggedUsers
    };
  } catch (error) {
    console.error('Error getting flagged users:', error);
    throw new Error(error.message);
  }
});

/**
 * Get all user stats for admin panel
 * Only accessible by authorized admins
 */
exports.getAllUserStats = onCall(async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new Error('Must be authenticated.');
  }

  // Check if caller is an admin
  if (!isAdmin(request.auth.uid)) {
    throw new Error('Only administrators can view all user stats.');
  }

  try {
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.get();

    const stats = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      stats.push({
        docId: doc.id,
        gameUserId: data.gameUserId || null,
        firebaseUid: data.firebaseUid || null,
        playerName: data.playerName || doc.id,
        bankBalance: data.bankBalance || 0,
        totalEarnings: data.totalEarnings || 0,
        tradingRounds: data.tradingRounds || 0,
        lastLogin: data.lastLogin || null,
        loginCount: data.loginCount || 0,
        lifetimeSpendings: data.lifetimeSpendings || 0,
        securityStatus: data.securityStatus || { flagged: false, flags: [] }
      });
    });

    console.log(`Admin ${request.auth.uid} retrieved stats for ${stats.length} users`);

    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw new Error(error.message);
  }
});

/**
 * Get public leaderboard data
 * Accessible by any authenticated user
 */
exports.getLeaderboard = onCall(async (request) => {
  // Require Firebase Authentication
  if (!request.auth) {
    throw new Error('Must be authenticated.');
  }

  try {
    const usersRef = admin.firestore().collection('users');
    
    // Get all users and filter/sort in memory
    // This avoids needing a Firestore index initially
    // For production with many users, create the index and use the optimized query below
    const snapshot = await usersRef.get();

    const leaderboard = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter out flagged users
      if (data.securityStatus?.flagged !== true) {
        leaderboard.push({
          playerName: data.playerName || 'Anonymous',
          totalEarnings: data.totalEarnings || 0,
          tradingRounds: data.tradingRounds || 0,
          bankBalance: data.bankBalance || 0
        });
      }
    });

    // Sort by totalEarnings descending
    leaderboard.sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0));
    
    // Return top 100
    const topLeaderboard = leaderboard.slice(0, 100);

    console.log(`Leaderboard requested by ${request.auth.uid}, returning ${topLeaderboard.length} entries`);

    return {
      success: true,
      leaderboard: topLeaderboard
    };

    // OPTIMIZED VERSION (requires Firestore index):
    // Uncomment this and comment out the above code once you create the index:
    // Collection: users
    // Fields: securityStatus.flagged (Ascending), totalEarnings (Descending)
    /*
    const snapshot = await usersRef
      .where('securityStatus.flagged', '==', false)
      .orderBy('totalEarnings', 'desc')
      .limit(100)
      .get();

    const leaderboard = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        playerName: data.playerName || 'Anonymous',
        totalEarnings: data.totalEarnings || 0,
        tradingRounds: data.tradingRounds || 0,
        bankBalance: data.bankBalance || 0
      });
    });

    return {
      success: true,
      leaderboard: leaderboard
    };
    */
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw new Error(error.message);
  }
});

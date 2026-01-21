// Firebase Cloud Functions Entry Point
// This file exports all cloud functions for Fortune Trader

const { validateSubmission } = require('./validateSubmission');
const { unflagUser, deleteUser, getFlaggedUsers, getAllUserStats, getLeaderboard } = require('./adminOperations');

// Export the validation function
exports.validateSubmission = validateSubmission;

// Export admin functions
exports.unflagUser = unflagUser;
exports.deleteUser = deleteUser;
exports.getFlaggedUsers = getFlaggedUsers;
exports.getAllUserStats = getAllUserStats;

// Export public functions
exports.getLeaderboard = getLeaderboard;

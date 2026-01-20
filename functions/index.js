// Firebase Cloud Functions Entry Point
// This file exports all cloud functions for Fortune Trader

const { validateSubmission } = require('./validateSubmission');

// Export the validation function
exports.validateSubmission = validateSubmission;

/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  userId: { type: String },
  sessionId: { type: String },
  taskId: { type: String },
  trackings: { type: Array },
});

// Duplicate the ID field.
// eslint-disable-next-line
consentSchema.virtual('id').get(function() {
  // eslint-disable-next-line
  return this._id.toString();
});

// Ensure virtual fields are serialised.
consentSchema.set('toJSON', {
  getters: true,
  virtuals: true,
});
consentSchema.set('toObject', {
  getters: true,
  virtuals: true,
});

module.exports = mongoose.model('Consent', consentSchema);

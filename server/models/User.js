/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  created: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  username: { type: String },
  password: { type: String },
  fullName: { type: String },
  oauthId: { type: String },
  reference: { type: String, index: { unique: true } }, // This should be sent to the client rather than _id
  tokens: {
    access_token: { type: String },
    id_token: { type: String },
    csrf_token: { type: String },
    viva_token: { type: String }
  },
  encryptionKey: { type: String },
  draftMetadataIDs: { type: Array, default: [] },
  provider: { type: String }, // Dataporten groups
  datasett: {
    id: { type: String },
    utvalg: { type: Array },
    locks: { type: mongoose.Mixed, default: {} } // { [datasetID]: { date: Date.now(), keyName: String }
  },
  isAdmin: { type: Boolean, default: false },
  stats: {
    totalDrafts: { type: Number, default: 0 },
    totalUploads: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 }
  }
})

// Choose what attributes will be returned with the user object
// Note: user ID is NOT sent
// ** These attributes should be matched in the front end model **
userSchema.methods.redacted = function () {
  return {
    username: this.username,
    fullName: this.fullName,
    reference: this.reference, // This is used instead of DB id
    encryptionKey: this.encryptionKey,
    draftMetadataIDs: this.draftMetadataIDs,
    datasett: this.datasett
  }
}

// Duplicate the ID field.
// eslint-disable-next-line
/* userSchema.virtual("id").get(function() {
  // eslint-disable-next-line
  return this._id.toString();
}) */

// Ensure virtual fields are serialised.
userSchema.set('toJSON', {
  getters: true,
  virtuals: true
})
userSchema.set('toObject', {
  getters: true,
  virtuals: true
})

module.exports = mongoose.model('User', userSchema)

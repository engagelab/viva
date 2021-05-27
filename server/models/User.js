/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')
const userRoles = require('../constants').userRoles

const userSchema = new mongoose.Schema({
  status: {
    role: {
      type: String,
      enum : Object.values(userRoles),
      default: userRoles.user
    },
    created: { type: Date, default: Date.now },
    provider: { type: String }, // Dataporten or Canvas ?
    lastLogin: { type: Date, default: Date.now },
    totalDrafts: { type: Number, default: 0 },
    totalUploads: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 }
  },
  profile: {
    username: { type: String, default: '' },
    password: { type: String },
    fullName: { type: String, default: '' },
    oauthId: { type: String },
    reference: { type: String, index: { unique: true } }, // This should be sent to the client rather than _id
    groups: { type: Array }, // Groups this user is a member of
  },
  tokens: {
    access_token: { type: String },
    id_token: { type: String },
    csrf_token: { type: String },
    viva_token: { type: String },
    encryptionKey: { type: String },
  },
  datasett: {
    id: { type: String },
    utvalg: { type: Array },
    locks: { type: mongoose.Mixed, default: {} } // { [datasetID]: { date: Date.now(), keyName: String }
  },
  videos: {
    draftIDs: { type: Array, default: [] },
  }
})


// Choose what attributes will be returned with the user object
// ** These attributes should be matched in the front end model **
userSchema.methods.redacted = function () {
  const redacted = this.toObject()
  delete redacted.tokens
  delete redacted.profile.oauthId
  delete redacted.profile.password
  return redacted
}

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

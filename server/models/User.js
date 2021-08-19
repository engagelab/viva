/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')
const userRoles = require('../constants').userRoles

const userSchema = new mongoose.Schema({
  status: {
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.user,
    },
    created: { type: Date, default: Date.now },
    provider: { type: String }, // Dataporten or Canvas ?
    lastLogin: { type: Date, default: Date.now },
    totalDrafts: { type: Number, default: 0 },
    totalUploads: { type: Number, default: 0 },
    totalTransfers: { type: Number, default: 0 },
    prerequisiteCompleted: { type: Boolean, default: false },
  },
  profile: {
    username: { type: String, default: '' },
    password: { type: String },
    fullName: { type: String, default: '' },
    provider_id: { type: String },
    lti_id: { type: String },
    email: { type: String },
    reference: { type: String }, // This should be sent to the client rather than _id
    organization: { type: String },
    groups: [
      {
        // Canvas Courses or Dataporten Groups this User is a member of
        _id: false,
        id: { type: String },
        name: { type: String },
        role: { type: String },
      },
    ],
    ltiUserId: { type: String },
  },
  tokens: {
    access_token: { type: String },
    id_token: { type: String },
    csrf_token: { type: String },
    viva_token: { type: String },
    encryptionKey: { type: String },
  },
  datasetConfig: {
    id: { type: String }, // Currently selected dataset
    currentSelection: { type: Array }, // Currently selected 'utvalg'
    locks: { type: mongoose.Mixed, default: {} }, // { [datasetID]: { date: Date.now(), keyName: String }
  },
  videos: {
    draftIDs: { type: Array, default: [] },
  },
})

// Choose what attributes will be returned with the user object
// ** These attributes should be matched in the front end model **
userSchema.methods.redacted = function () {
  const redacted = this.toObject()
  delete redacted.tokens
  delete redacted.profile.oauthId
  delete redacted.profile.organization
  delete redacted.profile.password
  return redacted
}

// Ensure virtual fields are serialised.
userSchema.set('toJSON', {
  getters: true,
  virtuals: true,
})
userSchema.set('toObject', {
  getters: true,
  virtuals: true,
})

module.exports = mongoose.model('User', userSchema)

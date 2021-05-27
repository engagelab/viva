/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */
const videoStorageTypes = require('../constants').videoStorageTypes
const consentTypes = require('../constants').consentTypes
const mongoose = require('mongoose')

const storageSchema = {
  name: {
    type: String,
    enum: Object.values(videoStorageTypes),
    default: videoStorageTypes.educloud,
  },
  groupId: { type: String },
  storagePath: {
    path: { type: Array },
    fileName: { type: Array },
  },
  category: { type: Array },
}

const datasettSchema = new mongoose.Schema({
  name: { type: String },
  description: { type: String },
  created: { type: Date, default: Date.now },
  formId: { type: String }, // Nettskjema form ID
  status: {
    lastUpdated: { type: Date, default: Date.now }, // Last time this Dataset was changed
    active: { type: Boolean }, // Only active datasetts who will be fetched
    lockedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }  // Who has locked the datasett for editing
  },
  consent: {
    type: {
      type: String,
      enum: Object.values(consentTypes),
      default: consentTypes.manual,
    },
  },
  users: {
    dataManager: {
      oauthId: { type: String },
      name: { type: String },
    },
    adminGroup: { type: String },
    dataportenGroups: { type: Array },
    canvasGroups: { type: Array }  // Canvas course IDs
  },
  selectionPriority: { type: Array, default: [] }, // Order of appearance of the utvalg categories
  selection: { type: Object, default: {}}, //  'utvalg' selection
  storages: {
    type: Array,
    of: storageSchema,
  },
})

// Choose what attributes will be returned with the setting object
// ** These attributes should be matched in the front end model **
datasettSchema.methods.redacted = function () {
  const d = {
    id: this._id.toString(),
    name: this.name,
    description: this.description,
    created: this.created,
    formId: this.formId,
    selectionPriority: this.selectionPriority,
    selection: this.utvalg,
    status: {
      lastUpdated: this.lastUpdated,
      lockedBy: this.lock,
    },
    consent: this.consent,
    users: {
      dataManager: this.dataManager,
    },
    storages: this.storages,
  }
  delete d.storages.path
  return d
}
// Duplicate the ID field.
// eslint-disable-next-line
datasettSchema.virtual('id').get(function () {
  // eslint-disable-next-line
  return this._id.toString()
})

// Ensure virtual fields are serialised.
datasettSchema.set('toJSON', {
  getters: true,
  virtuals: true,
})
datasettSchema.set('toObject', {
  getters: true,
  virtuals: true,
})

module.exports = mongoose.model('Datasett', datasettSchema)

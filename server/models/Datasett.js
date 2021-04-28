/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */
const videoStorageTypes = require('../constants').videoStorageTypes
const samtykkeValg = require('../constants').samtykke
const mongoose = require('mongoose')

const pathSchema = {
  path: { type: Array },
  fileName: { type: Array },
}
const storageSchema = {
  name: {
    type: String,
    enum: Object.values(videoStorageTypes),
    default: videoStorageTypes.google,
  },
  groupId: { type: String },
  storagePath: {
    type: Object,
    of: pathSchema,
  },
  category: { type: Array },
}

const datasettSchema = new mongoose.Schema({
  navn: { type: String },
  created: { type: Date },
  lastUpdated: { type: Date, default: Date.now },
  elementer: { type: String },
  dataManager: {
    oauthID: { type: String },
    name: { type: String },
  },
  active: { type: Boolean }, // active datasetts who will be fetch in app
  accessGroupId: { type: String }, // Super Admin group who access to all the datasetts and videos
  lock: { type: Object }, // lock the datasett if someone else is editing
  description: { type: String },
  utvalgtPriority: { type: Array },
  utvalg: { type: Object },
  dataportenGroups: { type: Array },
  storages: {
    type: Array,
    of: storageSchema,
  },
  samtykkeHandling: { type: Object },
  samtykke: {
    type: String,
    enum: Object.values(samtykkeValg),
    default: samtykkeValg.manual,
  },
  formId: { type: String },
  canvasCourseIds: { type: Array }, // Canvas course IDs
})

// Choose what attributes will be returned with the setting object
// ** These attributes should be matched in the front end model **
datasettSchema.methods.redacted = function () {
  const d = {
    id: this._id.toString(),
    navn: this.navn,
    storages: this.storages,
    description: this.description,
    utvalgtPriority: this.utvalgtPriority,
    created: this.created,
    lastUpdated: this.lastUpdated,
    elementer: this.elementer,
    utvalg: this.utvalg,
    samtykke: this.samtykke,
    samtykkeHandling: this.samtykkeHandling,
    dataManager: this.dataManager,
    formId: this.formId,
    active: this.active,
    accessGroupId: this.accessGroupId,
    lock: this.lock,
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

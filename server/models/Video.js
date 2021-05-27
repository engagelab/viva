/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')
const videoStatusTypes = require('../constants').videoStatusTypes

// Sharing schema (a sub schema of video schema)
const sharingSchema = {
  users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  access: { type: Boolean, default: false },
  edl: {
    start: { type: String },
    end: { type: String },
  },
  description: { type: String },
}
const videoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.ObjectId, ref: 'User' }, // Back end only.
  datasetId: { type: mongoose.Schema.ObjectId, ref: 'Datasett' },
  fileType: { type: String, default: '' }, // File extension to use e.g. mp4  Assigned by FFMPEG, back end only.
  fileId: { type: String }, // Used instead of video._id front end, and for QR Code.
  filename: { type: String }, // The name of the file stored server-side by TUS
  name: { type: String }, // A human-readable string for naming this file
  status: {
    type: String,
    enum: Object.values(videoStatusTypes),
    default: videoStatusTypes.uploaded, // Current status of this video
  },
  errorInfo: { type: String }, // Error report. Back end only.
  errorDebug: { type: String },
  pipelineInProgress: { type: Boolean, default: false }, // true if a pipeline is currently working on this file
  isEncrypted: { type: Boolean, default: false }, // true if this video is encrypted
  isEdited: { type: Boolean, default: false }, // true if this video has edits to perform
  isConsented: { type: Boolean, default: false }, // true if user has given consent before submitting
  encryptionKey: { type: String },
  encryptionIV: { type: {} }, // Mixed type. Mongoose has no type for UInt8Array..
  edl: { type: {} },
  mimeType: { type: String }, // mime type e.g. video/mp4  Assigned by recorder at front end.
  datasetInfo: {
    name: { type: String },
    utvalg: { type: Array },
  },
  description: { type: String },
  consents: { type: Array }, // These are the consents confirmed by the teacher in this recording
  category: { type: String },
  duration: { type: Number }, // Seconds  created: { type: Date },
  storages: { type: Array, default: [] },
  storagePath: { type: Array, default: [] },
  samtykkeId: { type: String },
  sharing: {
    type: Array,
    of: sharingSchema,
  },
})

// Choose what attributes will be returned with the video object
// Note: video ID is NOT sent
// ** These attributes should be read by the front end model **
videoSchema.methods.redacted = function () {
  return {
    status: this.status,
    fileId: this.fileId,
    datasetId: this.datasetId,
    pipelineInProgress: this.pipelineInProgress,
    isEncrypted: this.isEncrypted,
    isEdited: this.isEdited,
    storages: this.storages,
    created: this.created,
    description: this.description,
    category: this.category,
    name: this.name,
    datasetInfo: this.datasetInfo,
    duration: this.duration,
    errorInfo: this.errorInfo,
    consents: this.consents, // Array of consenters
    sharing :this.sharing,
  }
}

// Duplicate the ID field.
// eslint-disable-next-line
videoSchema.virtual('id').get(function () {
  // eslint-disable-next-line
  return this._id.toString()
})

// Ensure virtual fields are serialised.
videoSchema.set('toJSON', {
  getters: true,
  virtuals: true,
})
videoSchema.set('toObject', {
  getters: true,
  virtuals: true,
})

module.exports = mongoose.model('Video', videoSchema)

/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')
const videoStatusTypes = require('../constants').videoStatusTypes

const editDecriptionList = {
  trim: { type: Array, default: [] },
  blur: { type: Array, default: [] }
}

const videoSchema = new mongoose.Schema({
  file: { // For Back-End use only
    type: { type: String, default: '' }, // File extension to use e.g. mp4  Assigned by FFMPEG, back end only.
    name: { type: String }, // The name of the file stored server-side by TUS
    mimeType: { type: String }, // mime type e.g. video/mp4  Assigned by recorder at front end.
  },
  details: {
    id: { type: String }, // Used instead of video._id front end, and for QR Code.
    name: { type: String }, // A human-readable string for naming this video
    category: { type: String }, // green, yellow, red
    created: { type: Date },
    description: { type: String },
    duration: { type: Number }, // Seconds  created: { type: Date },
    edl: editDecriptionList,
    encryptionKey: { type: String },
    encryptionIV: { type: {} }, // Mixed type. Mongoose has no type for UInt8Array..
  },
  status: {
    main: {
      type: String,
      enum: Object.values(videoStatusTypes),
      default: videoStatusTypes.uploaded, // Current status of this video
    },
    error: {
      errorInfo: { type: String },
      errorDebug: { type: String }, // debug error report. Back end only.
    },
    inPipeline: { type: Boolean, default: false }, // true if a pipeline is currently working on this file
    isEncrypted: { type: Boolean, default: false }, // true if this video is encrypted
    isEdited: { type: Boolean, default: false }, // true if this video has edits to perform
    isConsented: { type: Boolean, default: false }, // true if user has given consent before submitting
  },
  users: {
    owner: { type: mongoose.Schema.ObjectId, ref: 'User' },
    sharedWith: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], // Users who can see this video. Used for easier searching
    sharing: [ // Each entry is a share for a particular set of users, and particular EDL of this video
      {
        users: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
        access: { type: Boolean, default: false },
        description: { type: String },
        edl: editDecriptionList,
      }
    ]
  },
  dataset: {
    id: { type: mongoose.Schema.ObjectId, ref: 'Dataset' },
    name: { type: String },
    selection: { type: Array }, // 'utvalg' setting
  },
  consents: { type: Array }, // These are the consents confirmed by the teacher in this recording
  storages: [{
    type: { type: String }, // 'lagringshotell', 'educloud', etc..
    path: { type: Array },
  }],
})

// Choose what attributes will be returned with the video object
// Note: video ID is NOT sent
// ** These attributes should be read by the front end model **
videoSchema.methods.redacted = function () {
  const v = {
    details: this.details,
    status: this.status,
    users: this.users,
    dataset: this.dataset,
    consents: this.consents,
    storages: this.storages.map((s) => s.type)
  }
  delete v.status.error.errorDebug
  return v
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

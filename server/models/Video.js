/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
 */

const mongoose = require('mongoose')
const videoStatusTypes = require('../constants').videoStatusTypes
const videoSharingStatusTypes = require('../constants').videoSharingStatusTypes

const editDecriptionList = {
  trim: { type: Array, default: [] },
  blur: { type: Array, default: [] },
}

const annotationSchema = new mongoose.Schema({
  created: { type: Date, default: Date.now },
  creator: { type: String }, // LTI ID
  comment: { type: String },
  time: { type: Array, default: [] }, // e.g [2.35, 10.04] or just [2.35]
})

const sharingSchema = new mongoose.Schema({
  creator: { type: String }, // LTI ID of the creator
  users: { type: Array },
  access: { type: Boolean, default: false },
  title: { type: String },
  description: { type: String },
  edl: editDecriptionList,
  tags: [{ type: String }],
  annotations: {
    type: Array,
    of: annotationSchema,
    default: []
  },
  comment: [{
    created: { type: Date, default: Date.now },
    creator: { type: String }, // LTI ID
    comment: { type: String },
  }],
  status: [{
    created: { type: Date, default: Date.now },
    user: { type: String }, // LTI ID
    status: {
      type: String,
      enum: Object.values(videoSharingStatusTypes),
      default: videoSharingStatusTypes.uploaded, // Status of this change to the share
    },
  }]
})

const videoSchema = new mongoose.Schema({
  file: {
    // For Back-End use only
    extension: { type: String }, // File extension to use e.g. mp4  Assigned by FFMPEG, back end only.
    name: { type: String }, // The name of the file stored server-side by TUS
    mimeType: { type: String }, // mime type e.g. video/mp4  Assigned by recorder at front end.
    encryptionKey: { type: String },
    encryptionMD5: { type: String },
  },
  details: {
    id: { type: String }, // Used instead of video._id front end, and for QR Code.
    name: { type: String }, // A human-readable string for naming this video
    category: { type: String }, // green, yellow, red
    created: { type: Date, default: Date.now },
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
    isClassified: { type: Boolean, default: false }, // true if this video is sensitivity colour-rated
    isConsented: { type: Boolean, default: false }, // true if user has given consent before submitting
    isEdited: { type: Boolean, default: false }, // true if this video has edits to perform
  },
  users: {
    owner: { type: mongoose.Schema.ObjectId, ref: 'User' },
    sharing: {
      type: Array,
      of: sharingSchema,
      default: []
    },
  },
  dataset: {
    id: { type: mongoose.Schema.ObjectId, ref: 'Dataset' },
    name: { type: String },
    selection: { type: Array }, // 'utvalg' setting
  },
  consents: { type: Array }, // These are the consents confirmed by the teacher in this recording
  storages: [
    {
      kind: { type: String }, // 'lagringshotell', 'educloud', etc..
      path: { type: String },
    },
  ],
})

// Choose what attributes will be returned with the video object
// Note: video ID is NOT sent
// ** These attributes should be read by the front end model **
videoSchema.methods.redacted = function () {
  const v = {
    file: {
      mimeType: this.file.mimeType,
    },
    details: this.details,
    status: this.status,
    users: this.users,
    dataset: this.dataset,
    consents: this.consents,
    storages: this.storages.map((s) => s),
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

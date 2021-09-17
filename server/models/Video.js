/*
 Designed and developed by Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see <http://www.gnu.org/licenses/>.
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
  text: { type: String },
  time: { type: Array, default: [] }, // e.g [2.35, 10.04] or just [2.35]
  comments: { type: Array, default: [] }, // e.g { created: Date, creator: string, text: string }
})

const shareSchema = new mongoose.Schema({
  creator: { type: String }, // LTI ID of the creator
  created: { type: Date, default: Date.now },
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
  comments: {
    type: [
      {
        created: { type: Date, default: Date.now },
        creator: { type: String }, // LTI ID
        text: { type: String },
      }
    ],
    default: [],
  },
  status: {
    type: [
      {
        created: { type: Date, default: Date.now },
        user: { type: String }, // LTI ID
        status: {
          type: String,
          enum: Object.values(videoSharingStatusTypes),
          default: videoSharingStatusTypes.uploaded, // Status of this change to the share
        },
      }
    ],
    default: [],
  }
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
      of: shareSchema,
      default: []
    },
  },
  dataset: {
    id: { type: mongoose.Schema.ObjectId, ref: 'Dataset' },
    name: { type: String },
    selection: { type: Array }, // 'utvalg' setting
    groups: { type: Array }, // Canvas / Dataporten groups given access to this video by the Dataset
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

module.exports = {
  Video: mongoose.model('Video', videoSchema)
}

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
const videoStorageTypes = require('../constants').videoStorageTypes
const consentTypes = require('../constants').consentTypes
const mongoose = require('mongoose')

const storageSchema = {
  kind: {
    type: String,
    enum: Object.values(videoStorageTypes),
    default: videoStorageTypes.educloud,
  },
  groupId: { type: String },
  file: {
    // Path and name will be constructed from attributes from Video and Dataset based on these array entries
    path: { type: Array },
    name: { type: Array },
  },
  category: { type: Array },
}

const datasetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // name of dataset must be unique
  description: { type: String, default: '' },
  created: { type: Date, default: Date.now },
  formId: { type: String }, // Nettskjema form ID
  status: {
    lastUpdated: { type: Date, default: Date.now }, // Last time this Dataset was changed
    active: { type: Boolean, default: false }, // Only active datasetts who will be fetched
    lockedBy: { type: mongoose.Schema.ObjectId, ref: 'User' }, // Who has locked the datasett for editing
  },
  consent: {
    kind: {
      type: String,
      enum: Object.values(consentTypes),
      default: consentTypes.manual,
    },
    value: { type: String },
    formId: { type: Number },
  },

  users: {
    owner: { type: mongoose.Schema.ObjectId, ref: 'User' }, // The 'creator' of this dataset
    adminGroup: { type: String },
    groups: { type: Array, of: String }, // Canvas or Dataporten Course/Group IDs (groups of users) who will receive this dataset
  },
  selectionPriority: { type: Array, default: [] }, // Order of appearance of the utvalg categories
  selection: { type: Object, default: {} }, //  'utvalg' selection
  storages: {
    type: Array,
    of: storageSchema,
  },
})

// Choose what attributes will be returned with the setting object
// ** These attributes should be matched in the front end model **
datasetSchema.methods.redacted = function () {
  const data = this.toObject()
  return {
    _id: this._id.toString(),
    name: data.name,
    description: data.description,
    created: data.created,
    formId: data.formId,
    selectionPriority: data.selectionPriority,
    selection: data.selection,
    status: {
      lastUpdated: data.status.lastUpdated,
      lockedBy: data.status.lockedBy,
      active: data.status.active,
    },
    consent: {
      kind: data.consent ? data.consent.kind : undefined,
      value: data.consent ? data.consent.value : undefined,
      formId: data.consent ? data.consent.formId : undefined,
    },
    users: {
      owner: data.users.owner,
      groups: data.users.groups,
    },
    storages: data.storages.map((store) => {
      const s = { ...store }
      //delete s.file.path // Commented by SM,reason:Admin  may need to change the path
      return s
    }),
  }
}
// Duplicate the ID field.
// eslint-disable-next-line
datasetSchema.virtual('id').get(function () {
  // eslint-disable-next-line
  return this._id.toString()
})

// Ensure virtual fields are serialised.
datasetSchema.set('toJSON', {
  getters: true,
  virtuals: true,
})
datasetSchema.set('toObject', {
  getters: true,
  virtuals: true,
})

module.exports = mongoose.model('Dataset', datasetSchema)

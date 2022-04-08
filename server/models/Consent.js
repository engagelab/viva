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
const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  userId: { type: String },
  sessionId: { type: String },
  taskId: { type: String },
  trackings: { type: Array },
});

// Duplicate the ID field.
// eslint-disable-next-line
consentSchema.virtual('id').get(function() {
  // eslint-disable-next-line
  return this._id.toString();
});

// Ensure virtual fields are serialised.
consentSchema.set('toJSON', {
  getters: true,
  virtuals: true,
});
consentSchema.set('toObject', {
  getters: true,
  virtuals: true,
});

module.exports = mongoose.model('Consent', consentSchema);

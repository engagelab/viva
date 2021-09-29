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
const { httpRequest } = require('../utilities')

// Get list of user's groups from Dataporten using the user's access_token
// Returns a Promise
const groupsForUser = (user) => {
  let options = {
    host: 'groups-api.dataporten.no',
    port: 443,
    path: '/groups/me/groups',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.tokens.access_token}`,
    },
  }
  return httpRequest(options, '')
}

module.exports = { groupsForUser }

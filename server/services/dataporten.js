
const { httpRequest } = require('../utilities')

// Get list of user's groups from Dataporten
// Returns a Promise
const groupsForUser = (dpAccessToken) => {
  let options = {
    host: 'groups-api.dataporten.no',
    port: 443,
    path: '/groups/me/groups',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${dpAccessToken}`,
    },
  }
  return httpRequest(options, '')
}

module.exports = { groupsForUser }

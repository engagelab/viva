
const { httpRequest } = require('../utilities')

// Get list of user's groups from Canvas
// Returns a Promise
const groupsForUser = (user) => {
  let options = {
    host: '',
    port: 443,
    path: '',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.tokens.access_token}`,
    },
  }
  return httpRequest(options, '')
}

module.exports = { groupsForUser }


const { httpRequest } = require('../utilities')

// Get list of user's groups from Canvas
// Returns a Promise
const coursesForUser = (canvasAccessToken) => {
  let options = {
    host: 'uio.instructure.com',
    port: 443,
    path: '/api/v1/courses',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken}`,
    },
  }
  return httpRequest(options, '')
}

const userDetails = (canvasAccessToken, canvasUserId) => {
  let options = {
    host: 'uio.instructure.com',
    port: 443,
    path: `/api/v1/users/${canvasUserId}/profile`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken}`,
    },
  }
  return httpRequest(options, '')
}

module.exports = { coursesForUser, userDetails }

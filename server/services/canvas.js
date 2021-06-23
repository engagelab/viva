
const { httpRequest } = require('../utilities')
const host = process.env.CANVAS_ENDPOINT_DOMAIN
const superToken = process.env.CANVAS_VIVA_ACCESS_TOKEN

// Get list of user's Courses (including enrolment roles) from Canvas
// https://canvas.instructure.com/doc/api/courses.html#method.courses.index
// Returns a Promise
const coursesForUser = (canvasAccessToken) => {
  let options = {
    host,
    port: 443,
    path: `/api/v1/users/:user_id/courses`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken || superToken}`,
    },
  }
  return httpRequest(options, '')
}

// Get list of the current user's Groups from Canvas
// https://canvas.instructure.com/doc/api/groups.html#method.groups.index
// Returns a Promise
const usersForGroup = (groupId, canvasAccessToken) => {
  let options = {
    host,
    port: 443,
    path: `/api/v1/groups/${groupId}/users`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken || superToken}`,
    },
  }
  return httpRequest(options, '')
}

// Get list of user's CourseProgress (including enrolment roles) from Canvas
// https://canvas.instructure.com/doc/api/courses.html#method.courses.user_progress
// Returns a Promise
const courseProgress = (canvasAccessToken, canvasUserId, canvasCourseId) => {
  let options = {
    host,
    port: 443,
    path: `/api/v1/courses/${canvasCourseId}/users/${canvasUserId}/progress`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken || superToken}`,
    },
  }
  return httpRequest(options, '')
}

// Get user's Profile
// https://canvas.instructure.com/doc/api/users.html#method.profile.settings
const userDetails = (canvasAccessToken, canvasUserId) => {
  let options = {
    host,
    port: 443,
    path: `/api/v1/users/${canvasUserId}/profile?include[]=account`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken || superToken}`,
    },
  }
  return httpRequest(options, '')
}

module.exports = { coursesForUser, userDetails, courseProgress, usersForGroup }

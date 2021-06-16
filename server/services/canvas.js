
const { httpRequest } = require('../utilities')

// Get list of user's Courses (including enrolment roles) from Canvas
// https://canvas.instructure.com/doc/api/courses.html#method.courses.index
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

// Get list of user's CourseProgress (including enrolment roles) from Canvas
// https://canvas.instructure.com/doc/api/courses.html#method.courses.user_progress
// Returns a Promise
const courseProgress = (canvasAccessToken, canvasUserId, canvasCourseId) => {
  let options = {
    host: 'uio.instructure.com',
    port: 443,
    path: `/api/v1/courses/${canvasCourseId}/users/${canvasUserId}/progress`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${canvasAccessToken}`,
    },
  }
  return httpRequest(options, '')
}

// Get user's Profile
// https://canvas.instructure.com/doc/api/users.html#method.profile.settings
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

module.exports = { coursesForUser, userDetails, courseProgress }

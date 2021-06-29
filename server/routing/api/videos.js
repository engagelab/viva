/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const { userRoles } = require('../../constants')
const videoStatusTypes = require('../../constants').videoStatusTypes
const Video = require('../../models/Video')

/* ---------------- Video activities ---------------- */

/**
 * Get the calling User's videos
 * If User is admin, get all videos
 * Else get User's videos only
 */
router.get('/videos', utilities.authoriseUser, (request, response) => {
  const u = response.locals.user
  const isAdmin = utilities.hasMinimumUserRole(u, userRoles.admin)

  let query = {}
  if (isAdmin) {
    query = {}
  } else {
    query = { 'users.owner': response.locals.user._id }
  }

  Video.find(query, (error, videos) => {
    let videosToReturn = []
    if (error) {
      console.error(error)
      return response.status(400).end()
    } else {
      videosToReturn = videos.map((v) => v.redacted())
      response.send(videosToReturn).status(200).end()
    }
  })
})

// Get a single video by fileId to determine changing status
router.get('/video', utilities.authoriseUser, (request, response) => {
  Video.findOne({ 'details.id': request.query.videoref }, (error, v) => {
    if (error) {
      return response.status(403).end()
    } else if (!v) {
      return response.status(200).end()
    } else {
      response.send(v.redacted()).status(200).end()
    }
  })
})

// Upload a single video metadata to be combined with an uploaded video file
router.post('/video', utilities.authoriseUser, async (request, response) => {
  const query = { 'details.id': request.body.details.id }
  Video.findOne(query, (error, v) => {
    if (error || !v) {
      return response.status(400).end()
    } else {
      const update = { ...request.body }
      update.status.main = videoStatusTypes.uploaded
      update.file.name = v.file.name
      update.file.extension = v.file.extension
      v.updateOne(update, {}, () => response.status(200).end())
    }
  })

})

module.exports = router

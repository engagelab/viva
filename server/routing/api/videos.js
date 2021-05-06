/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../utilities')
const videoStatusTypes = require('../../constants').videoStatusTypes;
const Video = require('../../models/Video')


/* ---------------- Video activities ---------------- */

// Get the status of a User's videos for the app client
// This route is used also for viva_inCanvas to fetch all user's videos
router.get('/videos'/*, utilities.authoriseUser*/, (request, response) => {
  Video.find({ userId: request.session.ref }, (error, videos) => {
    let videosToReturn = []
    if (error) {
      console.error(error)
      return response.status(400).end()
    } else {
      videosToReturn = videos.map(v => v.redacted())
      response
        .send(videosToReturn)
        .status(200)
        .end()
    }
  })
})

// Get a single video by fileId to determine changing status
router.get('/video', utilities.authoriseUser, (request, response) => {
  Video.findOne({ fileId: request.query.videoref }, (error, v) => {
    if (error) {
      return response.status(403).end()
    } else if (!v) {
      return response.status(200).end()
    } else {
      response
        .send(v.redacted())
        .status(200)
        .end()
    }
  })
})

// Upload a single video metadata to be combined with an uploaded video file
router.post('/video', utilities.authoriseUser, async (request, response) => {
  const query = { fileId: request.body.fileId }
  const update = { ...request.body }
  update.status = videoStatusTypes.uploaded
  // https://mongoosejs.com/docs/api.html#model_Model.update
  const res = await Video.updateOne(query, update) // Mongoose update() returns updateWriteOpResult with 'ok'
  if (!res || res.ok !== 1) return response.status(403).end()
  else response.status(200).end()
})

module.exports = router

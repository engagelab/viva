/*
 Designed and developed by Richard Nesnass & Sharanya Manivasagam
*/

const router = require('express').Router()
const utilities = require('../../utilities')
const { downloadS3File, deleteS3File } = require('../../services/storage')
const { userRoles } = require('../../constants')
const videoStatusTypes = require('../../constants').videoStatusTypes
const Video = require('../../models/Video').Video

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
  // first do a api call to filter datasets for a canvas course
  if (isAdmin) {
    query = {}
  } else {
    query = {
      $and: [
          {
            $or: [
              {
                'users.sharing.users': {
                  $in: [response.locals.user.profile.ltiID],
                },
              },
              { 'users.owner': response.locals.user._id },
            ],
          },
          {
            'status.main': { $ne: videoStatusTypes.deleted }
          }
      ]
    }
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

// Get a video file from S3 (Educloud)
// set request.query.mode to 'thumbnail' to get a thumbnail instead of the video file
router.get('/video/file', utilities.authoriseUser, (request, response, next) => {
  Video.findOne({ 'details.id': request.query.videoref }, (error, video) => {
    if (error) return response.status(403).end()
    else if (!video) {
      console.log(`DB video not found. "details.id": "${request.query.videoref}"`)
      return response.status(200).end()
    }
    else {
      if (!video.users.owner) {
        const error2 = new Error(`Bad owner! ${video.id}`)
        console.error(error2)
        return next(error2)
      }
      let extension = request.query.mode === 'thumbnail' ? 'jpg' : video.file.extension
      const keyname = `${video.users.owner.toString()}/${video.file.name}.${extension}`
      const sseKey = video.file.encryptionKey
      const sseMD5 = video.file.encryptionMD5
      downloadS3File({ keyname, sseKey, sseMD5 }).then((file) => {
        console.log(`S3 Video success: ${keyname}`)
        // These headers are required to enable seeking `currentTime` in Chrome browser
        if (request.query.mode !== 'thumbnail') {
          // response.setHeader('Content-Type', headers['content-type']);
          response.setHeader('content-type', 'video/mp4')
          response.setHeader('Accept-Ranges', 'bytes')
          response.setHeader('Content-Length', file.ContentLength)
          response.setHeader('Content-Range', `0-${file.ContentLength}`)
        } else {
          response.setHeader('content-type', 'image/jpeg')
        }
        file.Body.pipe(response)
      }).catch((error2) => {
        console.log(`S3 Video error for key: ${keyname} error: ${error2.toString()}`)
        response.status(404).send(error2)
      })
    }
  })
})

// Remove a video
// - delete the data file from S3 (Educloud)
// - mark the video metadata as 'status.main: deleted'
router.delete('/video', utilities.authoriseUser, (request, response, next) => {
  Video.findOne({ 'details.id': request.query.id }, (error, video) => {
    if (error) return response.status(403).end()
    else if (!video) {
      console.log(`DB video not found. "details.id": "${request.query.id}"`)
      return response.status(200).end()
    }
    else {
      if (!video.users.owner) {
        const error3 = new Error(`Bad owner! ${video.id}`)
        console.error(error3)
        return next(error3)
      }
      let keyname = `${video.users.owner.toString()}/${video.file.name}.${video.file.extension}`
      const sseKey = video.file.encryptionKey
      const sseMD5 = video.file.encryptionMD5
      deleteS3File({ keyname, sseKey, sseMD5 }).then(() => {
        console.log(`S3 DELETE Video success: ${keyname}`)
        video.status.main = videoStatusTypes.deleted
        video.save((saveError) => {
          if (saveError) return next(saveError)
          keyname = `${video.users.owner.toString()}/${video.file.name}.jpg`
          return deleteS3File({ keyname, sseKey, sseMD5 }).then(() => {
            console.log(`S3 DELETE Thumbnail success: ${keyname}`)
            response.status(200).end()
          })
        })
      }).catch((error2) => {
        console.log(`S3 Video error for key: ${keyname} error: ${error2.toString()}`)
        response.status(404).send(error2)
      })
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
      update.users.sharing = v.users.sharing
      v.updateOne(update, {}, () => response.status(200).end())
    }
  })
})

// To update a video details for a given video ID
router.put(
  '/video/details',
  utilities.authoriseUser,
  async (request, response, next) => {
    const updatedVideo = request.body
    Video.findOne({ 'details.id': request.query.id }, (error, v) => {
      if (error || !v) {
        return response.status(400).end()
      } else {
        v.details.name = updatedVideo.name
        v.details.description = updatedVideo.description
        v.save((saveError) => {
          if (saveError) return next(saveError)
          response.send(v.details)
        })
      }
    })
  }
)

module.exports = router

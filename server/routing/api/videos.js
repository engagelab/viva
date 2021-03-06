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
  Video.findOne({ 'details.id': request.query.videoref }, async (error, video) => {
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
      try {
        const file = await downloadS3File({ keyname, sseKey, sseMD5 })
        if (file) {
          // These headers are required to enable seeking `currentTime` in Chrome browser
          if (request.query.mode !== 'thumbnail') {
            // response.setHeader('Content-Type', headers['content-type']);
            response.setHeader('content-type', 'video/mp4')
            //response.setHeader('Accept-Ranges', 'bytes')
            //response.setHeader('Content-Length', file.ContentLength)
            //response.setHeader('Content-Range', `0-${file.ContentLength}`)
            console.log(`S3 get Video success: ${keyname}`)
          } else {
            response.setHeader('content-type', 'image/jpeg')
            console.log(`S3 get Thumbnail success: ${keyname}`)
          }
          file.Body.pipe(response)
        } else {
          response.status(404).send(new Error('Error downloading video'))
        }
      } catch (error) {
        console.log(error)
        response.status(404).send(error)
      }
    }
  })
})

// Remove a video
// - delete the data file from S3 (Educloud)
// - mark the video metadata as 'status.main: deleted'
router.delete('/video', utilities.authoriseUser, (request, response, next) => {
  Video.findOne({ 'details.id': request.query.id }, async (error, video) => {
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
      try {
        await deleteS3File({ keyname, sseKey, sseMD5 })
        console.log(`S3 DELETE Video success: ${keyname}`)
        video.status.main = videoStatusTypes.deleted
        const saveError = await video.save()
        if (saveError) return next(saveError)
        keyname = `${video.users.owner.toString()}/${video.file.name}.jpg`
        await deleteS3File({ keyname, sseKey, sseMD5 })
        console.log(`S3 DELETE Thumbnail success: ${keyname}`)
        response.status(200).end()
      } catch(error2) {
        console.log(`S3 delete Video error for key: ${keyname} error`)
        response.status(404).send(error2)
      }
    }
  })
})

// Update a single video metadata to be combined with an uploaded video file
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
        v.save().then((savedVideo) => {
          response.send(savedVideo.details)
        }).catch((saveError) => {
          return next(saveError)
        })
      }
    })
  }
)

module.exports = router

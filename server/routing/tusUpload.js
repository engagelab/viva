// Resumable upload
const router = require('express').Router()
const utilities = require('./utilities')
const Video = require('../models/Video')
const User = require('../models/User')
const tus = require('tus-node-server')
const tusMetadata = require('tus-metadata')

const tusServer = new tus.Server()

const EVENTS = require('tus-node-server').EVENTS
const videoStatusTypes = require('../constants').videoStatusTypes

tusServer.datastore = new tus.FileStore({
  path: '/videos/uploaded',
  relativeLocation: false,
})

// After a file is saved successfully, make a corresponding DB entry
tusServer.on(EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
  const str = event.file.upload_metadata
  const metadataDecoded = tusMetadata.decode(str)
  //tusMetaData decodes to string rather than array of objects
  const metadata = JSON.parse(metadataDecoded.video)
  const videoMetadata = Object.assign({}, metadata)
  videoMetadata.status = videoStatusTypes.premeta
  videoMetadata.filename = event.file.id

  // remove draftId from user after a successful upload and create server video
  User.findOne({ reference: videoMetadata.userRef }, (error, user) => {
    if (error) {
      console.log('Unknown User')
    } else {
      const u = user
      const i = u.draftMetadataIDs.indexOf(videoMetadata.fileId)
      if (i > -1) {
        videoMetadata.userId = user.id
        Video.create(videoMetadata, (error2) => {
          if (error2) {
            console.log('Error creating DB entry for file upload')
          }
          u.draftMetadataIDs.splice(i, 1)
          if (!u.stats.totalUploads) u.stats.totalUploads = 0
          u.stats.totalUploads += 1
          u.save()
        })
      }
      console.log(
        `${new Date().toUTCString()} Upload received for user: ${user.id} id: ${
          user.username
        } filename: ${videoMetadata.filename}`
      )
    }
  })
})

// Prevent GET requests
tusServer.get('/upload', utilities.authoriseUser, (request, response, next) => {
  next(new Error({ status: 401, message: 'Unauthorised' }))
})

// Create an Express router instance to service video uploads
router.all('*', utilities.authoriseUser, tusServer.handle.bind(tusServer))

module.exports = router

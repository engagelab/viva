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
const utilities = require('../utilities')
const Video = require('../models/Video').Video
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
  const videoMetadata = {
    ...metadata,
    status: { main: videoStatusTypes.premeta },
    file: { name: event.file.id }
  }

  // remove draftId from user after a successful upload and create server video
  User.findById(videoMetadata.users.owner, (error, u) => {
    if (error) {
      console.log('Unknown User')
    } else {
      const i = u.videos.draftIDs.indexOf(videoMetadata.details.id)
      if (i > -1) {
        videoMetadata.users.owner = u._id
        Video.create(videoMetadata, (videoCreateError) => {
          if (videoCreateError) console.log('Error creating DB entry for file upload')
          u.videos.draftIDs.splice(i, 1)
          if (!u.status.totalUploads) u.status.totalUploads = 0
          u.status.totalUploads += 1
          u.save()
        })
      }
      console.log(
        `${new Date().toUTCString()} Upload received for user: ${u.profile.username} id: ${
          u._id
        } filename: ${videoMetadata.file.name} file ID: ${videoMetadata.details.id}`
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

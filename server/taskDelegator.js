/*
 Designed and developed by Richard Nesnass
 Maintains a record of existing video processing tasks, and checks for new videos to process
*/
require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })
const nodeCleanup = require('node-cleanup')
const {
  pipelineErrorMessages,
  pipelineStates,
  videoFolderNames,
  videoStatusTypes,
  videoStorageTypes,
} = require('./constants')
const Video = require('./models/Video').Video
const db = require('./services/database')
const ffmpeg = require('./subprocesses/ffmpegOperation')
const fileOperations = require('./subprocesses/fileOperations')
const {
  fetchStorage,
  sendToLagringshotell,
  sendVideoToEducloud,
} = require('./services/storage')

// Initialise queues and populate with unfinished work
const videoBacklog = {} // Multiple arrays queuing videos for each state in the pipeline
const activelyProcessing = {} // One active video slot for each pipeline state

nodeCleanup(function (exitCode, signal) {
  console.log(
    `VIVA Task Delegator closing down. Exit code: ${exitCode} Signal: ${signal}`
  )
})

process.on('message', function (data) {
  if (data == 'exit') {
    process.exit()
  }
})

const findVideosToProcess = () => {
  pipelineStates.forEach((state) => {
    Video.find({ 'status.main': state }, (error, foundVideos) => {
      if (error) {
        console.log(error)
      } else if (foundVideos.length > 0) {
        videoBacklog[state] = [...foundVideos]
        console.log(
          `Queued ${videoBacklog[state].length} video(s) with status: ${state}`
        )
      }
    })
  })
}

// Save error message and clean up incomplete data here
const errorProcessingVideo = (error, pStatus) => {
  console.log(`Error processing video: ${error}`)
  if (pStatus) {
    const errorMessage = pipelineErrorMessages[pStatus]
    const nextVideo = activelyProcessing[pStatus]
    nextVideo.status.inPipeline = false
    nextVideo.status.error.errorDebug = error
    nextVideo.status.error.errorInfo = `${errorMessage}. Please contact support. Reference: ${nextVideo.filename}`
    nextVideo.status.main = videoStatusTypes.error
    delete activelyProcessing[pStatus]
    nextVideo.save()
  }
}

// Update the state of the video metadata for the next pipeline stage
const advanceVideoStatus = (video, pStatus) => {
  const stateIndex = pipelineStates.indexOf(pStatus)
  // Increment video state (refer to constants.pipelineStates) and update pipeline progress
  if (stateIndex == pipelineStates.length - 1) {
    video.status.main = videoStatusTypes.complete // Pipeline is finished
  } else {
    video.status.main = pipelineStates[stateIndex + 1]
  }
  video.status.inPipeline = false
  video.status.error.errorDebug = ''
  video.status.error.errorInfo = ''
  video.save((error) => {
    if (error) {
      console.log(
        `Error saving Video to DB. Video details ID: ${
          video.details.id
        } Error: ${error.toString()}`
      )
    }
    delete activelyProcessing[pStatus]
  })
}

// Decide which kind of child task to use to process the video based on its queue
const beginProcessingVideo = (pStatus) => {
  const nextVideo = activelyProcessing[pStatus]
  // Update pipeline in progress for this video
  nextVideo.status.inPipeline = true
  nextVideo.save((error) => {
    if (error) {
      return console.log(
        `Error saving Video to DB during begin processing. Video fileId: ${
          nextVideo.details.id
        } Error: ${error.toString()}`
      )
    }

    switch (pStatus) {
      // The first stage after metadata and video data have been uploaded
      // For now decryption is not active, move the video directly to the next state
      case videoStatusTypes.uploaded: {
        if (nextVideo.status.isEncrypted) {
          fileOperations
            .moveFile(
              nextVideo,
              videoFolderNames.uploaded,
              videoFolderNames.decrypted
            )
            .then(() => advanceVideoStatus(nextVideo, pStatus))
            .catch((err) => {
              errorProcessingVideo(err, pStatus)
            })
          // ------------------
        } else {
          fileOperations
            .moveFile(
              nextVideo,
              videoFolderNames.uploaded,
              videoFolderNames.decrypted
            )
            .then(() => advanceVideoStatus(nextVideo, pStatus))
            .catch((err) => errorProcessingVideo(err, pStatus))
        }
        break
      }
      // Process the trims, blurs and watermark for this video
      case videoStatusTypes.decrypted: {
        ffmpeg
          .createFFMPEG(
            nextVideo,
            videoFolderNames.decrypted,
            videoFolderNames.edited
          ) // Edit and watermark the video, producing a new file
          .then((video) =>
            fileOperations
              // Delete the 'decrypted' video file, as we now have a new 'edited' video file
              .removeFile(video.file.name, videoFolderNames.decrypted)
              .then(() => {
                advanceVideoStatus(video, pStatus)
              })
              .catch((err) => {
                errorProcessingVideo(err, pStatus)
              })
          )
          .catch((err) => errorProcessingVideo(err, pStatus))
        break
      }
      // Here the video can be copied to a final storage location
      case videoStatusTypes.edited: {
        fetchStorage(nextVideo)
          .then((stores) => {
            const allPromises = []
            stores.forEach((store) => {
              console.log(store)
              if (store.kind == videoStorageTypes.lagringshotell) {
                const LHpromise = sendToLagringshotell({
                  video: nextVideo,
                  store,
                  subDirSrc: videoFolderNames.edited,
                })
                allPromises.push(LHpromise)
              } else if (store.kind == videoStorageTypes.educloud) {
                const ECpromise = sendVideoToEducloud({
                  video: nextVideo,
                  subDirSrc: videoFolderNames.edited,
                })
                allPromises.push(ECpromise)
              }
            })
            Promise.all(allPromises)
              .then(() => {
                console.log('Continuing after all resolved')
                fileOperations
                  .moveFile(
                    nextVideo,
                    videoFolderNames.edited,
                    videoFolderNames.stored
                  )
                  .then(() => advanceVideoStatus(nextVideo, pStatus))
                  .catch((err) => {
                    console.log(`Error after move file. Error: ${err}`)
                    errorProcessingVideo(err, pStatus)
                  })
              })
              .catch((err) => {
                console.log(`Error after all resolved. Error: ${err}`)
                errorProcessingVideo(err, pStatus)
              })
          })
          .catch((err) => {
            console.log(
              `Error finding dataset for video ${nextVideo.details.name}: ${err}`
            )
            errorProcessingVideo(err, pStatus)
          })
        break
      }
      // Decide if we keep the video ready for user-authenticated transfer to a third party
      case videoStatusTypes.stored: {
        const storageTypesRequiringTransfer = [videoStorageTypes.google]
        const keepVideo = nextVideo.storages
          .map((s) => s.kind)
          .some((kind) => storageTypesRequiringTransfer.includes(kind))
        if (!keepVideo) {
          // Remove thumbnail
          fileOperations
            .removeFile(
              `${nextVideo.file.name}.jpg`,
              videoFolderNames.thumbnails
            )
            .then(() =>
              fileOperations
                .moveFile(
                  nextVideo,
                  videoFolderNames.stored,
                  videoFolderNames.complete
                )
                .then(() => advanceVideoStatus(nextVideo, pStatus))
            )
            .catch((err) => errorProcessingVideo(err, pStatus))
        }
        break
      }
      case videoStatusTypes.complete: {
        // TODO: Delete the video file!
        // fileOperations.removeFile(nextVideo.file.name, videoFolderNames.decrypted).then(() => {})
        break
      }
      default: {
        break
      }
    }
  })
}

// Attempt to process the next video in each queue, if queue is not already busy
const runProcessing = () => {
  pipelineStates.forEach((pStatus) => {
    // An active queue is empty and videos are waiting for the given state
    if (
      !activelyProcessing[pStatus] &&
      Object.hasOwnProperty.call(videoBacklog, pStatus)
    ) {
      // Shift a video from the front of the queue, if one exists
      const nextVideo = videoBacklog[pStatus].shift()
      if (nextVideo) {
        activelyProcessing[pStatus] = nextVideo
        console.log(
          `Now processing video ${nextVideo.details.name} at status '${nextVideo.status.main}'`
        )
        beginProcessingVideo(pStatus)
      }
    }
  })

  // Once all queues are empty, search for new items in the DB
  // TODO: This is an effort to spread out computation, and should be monitored / optimised
  const videoBacklogKeys = Object.keys(videoBacklog)
  const activeQueueKeys = Object.keys(activelyProcessing)
  const count = videoBacklogKeys.reduce(
    (key, acc) => (key ? acc + videoBacklog[key].length : 0),
    0
  )
  if (count === 0 && activeQueueKeys.length === 0) {
    findVideosToProcess()
  }
}

db.connect('Task Delegator')

// Call the processing regularly
const refreshRate = parseInt(process.env.PIPELINE_REFRESH_RATE)
setInterval(() => {
  runProcessing()
}, refreshRate * 1000)
console.log('VIVA Task Delegator started')

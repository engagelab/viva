/*
 Designed and developed by Richard Nesnass
 Maintains a record of existing video processing tasks, and checks for new videos to process
*/

require('dotenv').config({ silent: process.env.NODE_ENV !== 'development' })
const nodeCleanup = require('node-cleanup')
const { pipelineErrorMessages, pipelineStates, videoFolderNames, videoStatusTypes, videoStorageTypes } = require('./constants')
const Video = require('./models/Video')
const db = require('./database')
const ffmpeg = require('./subprocesses/ffmpegOperation')
const fileOperations = require('./subprocesses/fileOperations')
const lagringshotell = require('./subprocesses/lagringshotellOperations')
const fetchStorage = require('./services/storage').fetchStorage

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
});

const findVideosToProcess = () => {
  pipelineStates.forEach(state => {
    Video.find({ 'status.main': state }, (error, foundVideos) => {
      if (error) {
        console.log(error)
      } else if (foundVideos.length > 0) {
        videoBacklog[state] = [...foundVideos]
        console.log(
          `Queued ${videoBacklog[state].length} video(s) with status: ${state}`
        )
      } else {
        console.log(
          `${new Date().toLocaleString()} Video scan: nothing new found`
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
    // Pipeline is finished. But may need to transfer the video to Google before marking as 'complete'
    // Or complete directly if we are using Canvas
    const editedTypes = [videoStorageTypes.google, videoStorageTypes.onedrive]
    const isEdited = video.storages.map((s) => s.kind).some((kind) => editedTypes.includes(kind))
    video.status.main = isEdited ? videoStatusTypes.edited : videoStatusTypes.complete
  } else {
    video.status.main = pipelineStates[stateIndex + 1]
  }
  video.status.inPipeline = false
  video.status.error.errorDebug = ''
  video.status.error.errorInfo = ''
  video.save(error => {
    if (error) {
      console.log(
        `Error saving video after completed processing. Video fileId: ${video.fileId}`
      )
    }
    delete activelyProcessing[pStatus]
  })
}

// Decide which kind of child task to use to process the video based on its queue
const beginProcessingVideo = pStatus => {
  const nextVideo = activelyProcessing[pStatus]
  // Update pipeline in progress for this video
  nextVideo.status.inPipeline = true
  nextVideo.save(error => {
    if (error) {
      return console.log(
        `Error saving after complete processing. Video fileId: ${nextVideo.details.id}`
      )
    }

    switch (pStatus) {
      case videoStatusTypes.uploaded: {
        // If status is 'UPLOADED', call decryption if needed, else move to the next queue
        if (nextVideo.status.isEncrypted) {
          fileOperations
            .moveFile(
              nextVideo,
              videoFolderNames.uploaded,
              videoFolderNames.decrypted
            )
            .then(() => advanceVideoStatus(nextVideo, pStatus))
            .catch(err => {
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
            .catch(err => errorProcessingVideo(err, pStatus))
        }
        break
      }
      case videoStatusTypes.decrypted: {
        ffmpeg
          .createFFMPEG(
            nextVideo,
            videoFolderNames.decrypted,
            videoFolderNames.edited
          ) // Edit and watermark the video, producing a new file
          .then(video =>
            fileOperations
              // Delete the 'decrypted' video file, as we now have a new 'edited' video file
              .removeFile(video.file.name, videoFolderNames.decrypted)
              .then(() => {
                advanceVideoStatus(video, pStatus)
              }).catch(err => {
                errorProcessingVideo(err, pStatus)
              })
          )
          .catch(err => errorProcessingVideo(err, pStatus))
        break
      }
      case videoStatusTypes.converted: {
        // Here the video can be copied to Lagringshotell.  After copy, the video remains in the 'edited' folder for the next stage.
        fetchStorage(nextVideo).then(stores => {
          const allPromises = []
          stores.forEach(store => {
            if (store.kind == videoStorageTypes.lagringshotell) {
              console.log(store);
              const LHpromise = lagringshotell.createVideoAtLagringshotell(
                {
                  video: nextVideo,
                  store,
                  subDirSrc: videoFolderNames.edited
                }
              )
             allPromises.push(LHpromise)
            }
          })
          Promise.all(allPromises).then(() =>
            advanceVideoStatus(nextVideo, pStatus)
          ).catch(err => {
            errorProcessingVideo(err, pStatus)
          })
        })
        break
      }
      case videoStatusTypes.edited: {
        // If we're using Dataporten:
        // The plan as at June 2019 is that the user must authorise transfer to their Google storage
        // Therefore the Dataporten pipeline stops at 'edited', it does not include a 'completed' state, that is set by the google code
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
  pipelineStates.forEach(pStatus => {
    // An active queue is empty and videos are waiting for the given state
    if (!activelyProcessing[pStatus] && Object.hasOwnProperty.call(videoBacklog, pStatus)) {
      // Shift a video from the front of the queue, if one exists
      const nextVideo = videoBacklog[pStatus].shift()
      if (nextVideo) {
        activelyProcessing[pStatus] = nextVideo
        console.log(
          `Now processing video status: ${nextVideo.status} filename: ${nextVideo.filename}`
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

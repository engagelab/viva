/*
 Copyright 2018 Richard Nesnass and Sharanya Manivasagam
*/
let tus = require('tus-js-client')
import Vue from 'vue'
import orderBy from 'lodash/orderBy'
import VideoMetadata from './VideoMetadata'
import constants from '../../constants'
import { serverService } from '../../api/communication'
import indexedDBService from '../../api/indexedDBServiceDirect'
import cordovaService from '../../api/cordovaService'
import webcryptoService from '../../api/webCryptoService'
import utilities from '../../api/utilities'
// import store from './store';

const { baseUrl, stores, strings } = constants

export default {
  namespaced: true,
  state: {
    // Videos already uploaded to server
    videos: {},
    // Videos not yet uploaded to server (loaded / saved to IndexedDB 'draftMetadata' store)
    draftVideos: {},
    // This dict holds chunks arrays of encrypted data as they are created, referenced by fileId
    videoEncryptedData: {},
    // This dict is a volatile only instance holding the decrypted video chunks arrays by fileId.
    // If using Cordova, videoUnEncryptedData[fileId] will be a fileEntry object
    videoUnEncryptedData: {},
    // on completion they are persisted to IndexedDB 'videoData' store
    selectedVideo: undefined,
    // Used to hold changes to video metadata before saving to the 'selectedVideo'
    // tempVideo: undefined,
    // Current TUS upload instances
    tusUploadInstances: {},
    recordingNow: false,
    estimatedStorageRemaining: 'unknown', // Percentage
    useCordova: false,
    storageService: undefined
  },
  getters: {
    selectedVideo: state => state.selectedVideo,
    // tempVideo: state => state.tempVideo,
    videos: state => settingid => {
      const filteredVids = Object.values(state.videos).filter(
        v => v.settingId == settingid
      )
      return orderBy(filteredVids, 'created', 'desc')
    },
    allVideos: state => {
      const v = Object.values(state.videos)
      return orderBy(v, 'created', 'desc')
    },
    draftVideos: state => settingid => {
      const filteredVids = Object.values(state.draftVideos).filter(
        v => v.settingId == settingid
      )
      return orderBy(filteredVids, 'created', 'desc')
    },
    allDraftVideos: state => {
      const v = state.draftVideos
      return orderBy(v, 'created', 'desc')
    },
    unencryptedData: state => fileId => state.videoUnEncryptedData[fileId],
    hasUnsavedChanges: state => fileId =>
      state.draftVideos[fileId].hasUnsavedChanges,
    uploadingData: state =>
      Object.values(state.draftVideos).some(v => v.uploadingData),
    recordingNow: state => state.recordingNow,
    hasTUSUploadReady: state => video =>
      Object.prototype.hasOwnProperty.call(
        state.tusUploadInstances,
        video.fileId
      ),
    estimatedStorageRemaining: state => state.estimatedStorageRemaining,
    useCordova: state => state.useCordova
  },
  mutations: {
    useCordova (state, useIt) {
      state.useCordova = useIt
      state.storageService = useIt ? cordovaService : indexedDBService
    },
    selectVideo (state, video) {
      state.selectedVideo = video
    },
    /* setTempVideo (state, video) {
      state.tempVideo = new VideoMetadata({ video })
    }, */
    setRecordingNow (state, value) {
      state.recordingNow = value
    },
    /* updateTempVideoAttribs (state, attribs) {
      if (state.tempVideo) {
        const keys = Object.keys(attribs)
        keys.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(state.tempVideo, k)) {
            Vue.set(state.tempVideo, k, attribs[k])
          }
        })
      }
    }, */
    clearAllMetadata (state) {
      state.videos = {}
      state.draftVideos = {}
    },
    addVideo (state, video) {
      if (video.status == 'draft') {
        Vue.set(state.draftVideos, video.fileId, video)
        Vue.set(state.videoEncryptedData, video.fileId, [])
        Vue.set(
          state.videoUnEncryptedData,
          video.fileId,
          state.useCordova ? undefined : []
        )
      } else {
        Vue.set(state.videos, video.fileId, video)
      }
    },
    /*     addAllVideo (state, video) {
      Vue.set(state.allVideos, video.fileId, video)
    }, */
    // Updates video attributes only by mutation, without replacing video item
    mutateVideo (state, { fileId, updates }) {
      let videoStore = state.draftVideos
      if (!videoStore[fileId]) {
        videoStore = state.videos
      }
      if (videoStore[fileId]) {
        Object.keys(updates).forEach(key => {
          Vue.set(videoStore[fileId], key, updates[key])
          // videoStore[fileId][key] = updates[key];
        })
        if (state.selectedVideo && state.selectedVideo.fileId == fileId) {
          state.selectedVideo = videoStore[fileId]
        }
      }
    },
    removeDraftVideo (state, fileId) {
      if (state.draftVideos[fileId]) {
        Vue.delete(state.draftVideos, fileId)
      }
    },
    // Add a chunk of video data to the current video
    appendChunk (state, { fileId, chunk }) {
      const a = state.videoUnEncryptedData[fileId]
      a.push(chunk)
      Vue.set(state.videoUnEncryptedData, fileId, a)
    },
    // Add an encrypted chunk of video data
    appendEncryptedChunk (state, { data, fileId }) {
      const a = state.videoEncryptedData[fileId]
      a.push(data)
      Vue.set(state.videoEncryptedData, fileId, a)
    },
    clearVolatileVideoData (state, fileId) {
      state.videoUnEncryptedData[fileId] = state.useCordova ? undefined : []
      Vue.set(state.videoEncryptedData, fileId, [])
    },
    setDecryptedVideoData (state, { fileId, data }) {
      state.videoUnEncryptedData[fileId] = data
    },
    setTUSUpload (state, { upload, fileId }) {
      Vue.set(state.tusUploadInstances, fileId, upload)
    },
    removeTUSUpload (state, fileId) {
      if (state.tusUploadInstances[fileId]) {
        Vue.delete(state.tusUploadInstances, fileId)
      }
    },
    clearDataUponLogout (state) {
      state.videoEncryptedData = {}
      state.videoUnEncryptedData = {}
      // state.tempVideo = undefined
      state.selectedVideo = undefined
      state.videos = {}
      state.draftVideos = {}
    },
    // Abort all existing TUS uploads
    abortAllUploads (state) {
      const keys = Object.keys(state.tusUploadInstances)
      keys.forEach(tu => state.tusUploadInstances[tu].abort())
    },
    setEstimateStorageRemaining (state, value) {
      state.estimatedStorageRemaining = value
    }
  },
  actions: {
    errorMessage ({ commit }, error) {
      let errorMessage = error.message || error
      errorMessage += error.code ? ` Code: ${error.code}` : ''
      console.log(`Error: ${errorMessage}`)
      commit(
        'general/setSnackbar',
        {
          visibility: true,
          text: errorMessage,
          type: 'error',
          callback: undefined
        },
        { root: true }
      )
    },
    selectVideo ({ commit }, video) {
      commit('selectVideo', video)
    },
    // This is a tracker to notify the rest of the app that something chas changed in the Editor
    // which needs to be saved after 'samtykker'
    setUnsavedChanges ({ commit }, fileId) {
      const updates = { hasUnsavedChanges: true }
      commit('mutateVideo', { fileId, updates })
    },
    estimateStorageRemaining ({ state, commit, rootGetters }) {
      const deviceStatus = rootGetters['general/deviceStatus']
      if (
        !state.useCordova &&
        (deviceStatus.browser == 'Chrome' || deviceStatus.browser == 'Firefox')
      ) {
        state.storageService.getStorageEstimate(estimate => {
          const e = (
            ((estimate.quota - estimate.usage) / estimate.quota) *
            100
          ).toFixed(2)
          commit('setEstimateStorageRemaining', e)
        })
      }
    },
    // Create a new draft metadata for the given User and Dataset
    createDraftVideo (
      { dispatch, commit, rootGetters },
      { setting, datasetInfo, user }
    ) {
      const deviceStatus = rootGetters['general/deviceStatus']
      const updatedVideoMetadata = new VideoMetadata({
        setting,
        user,
        datasetInfo,
        deviceStatus
      })
      commit('addVideo', updatedVideoMetadata)
      commit('selectVideo', updatedVideoMetadata)
      commit('general/addDraftmetadataId', updatedVideoMetadata.fileId, {
        root: true
      })
      dispatch('estimateStorageRemaining')
      dispatch('general/updateUser', user, { root: true })
      return dispatch('saveDraftMetadata', {
        user,
        setting,
        updatedVideoMetadata
      }).catch(() => dispatch('errorMessage', 'Save draft video'))
    },
    // Remove draft video
    removeDraftVideo ({ dispatch, commit }, { video, user }) {
      return new Promise(resolve => {
        // Remove draft videodata and metadata
        // Storage removal
        dispatch('removeLocalVideoData', video.fileId)
        // Storage removal
        dispatch('removeLocalMetadata', video)
          .then(() => {
            // Store removal
            commit('removeDraftVideo', video.fileId)
            commit('general/removeDraftmetadataIds', video.fileId, {
              root: true
            })
            dispatch('general/updateUser', user, { root: true }).then(() => {
              console.log(`Removed a draft video: ${video.fileId}`)
              resolve()
            })
          })
          .catch(() => dispatch('errorMessage', 'Remove video'))
      })
    },

    // Call if e.g. a draft video is recorded to replace an older draft video
    // Each time we:
    //    clear any existing video data for this metadata item
    //    generate a new IV and VIDEO ENCRYPTION KEY (best practice)
    //    save this new structure as the current metadata item
    // ** Async **
    replaceVideoData ({ state, dispatch, commit }, { setting, user, fileId }) {
      return new Promise(resolve => {
        const updates = {}
        commit('clearVolatileVideoData', fileId)
        commit('removeTUSUpload', fileId)
        dispatch('removeLocalVideoData', fileId)

        const replaceDataDone = () => {
          commit('mutateVideo', { fileId, updates })
          let updatedVideoMetadata = state.draftVideos[fileId]
          dispatch('saveDraftMetadata', {
            user,
            setting,
            updatedVideoMetadata
          })
            .then(() => resolve())
            .catch(() => dispatch('errorMessage', 'Replace draft video error'))
        }

        updates.duration = 0
        updates.edl = { trim: [], blur: [] }
        updates.hasNewDataAvailable = false
        if (state.useCordova) {
          replaceDataDone()
        } else {
          // Generate an initialisation vector to encrypt the video's data (in idb.videoStore)
          updates.encryptionIV = webcryptoService.getRandomValues()
          // Generate an encryption key, export and convert to string suitable for storage
          webcryptoService.generateKey().then(key => {
            webcryptoService.keyToString(key).then(exportedKey => {
              updates.encryptionKey = exportedKey
              replaceDataDone()
            })
          })
        }
      })
    },
    updateDraftMetadata (
      { state, dispatch, commit },
      { setting, user, fileId, updates }
    ) {
      return new Promise(resolve => {
        const updatedData = {
          ...updates,
          hasUnsavedChanges: false,
          hasNewDataAvailable: false
        }
        commit('mutateVideo', { fileId, updates: updatedData })
        let updatedVideoMetadata = state.draftVideos[fileId]
        dispatch('saveDraftMetadata', {
          user,
          setting,
          updatedVideoMetadata
        })
          .then(() => {
            resolve()
          })
          .catch(() => dispatch('errorMessage', 'Update draft video'))
      })
    },
    // Retrieve all draft video metadata from indexedDB, decrypt and add them to this store
    // ENCRYPTION KEY for metadata comes from the User model, downloaded after login
    loadDraftMetadata (
      { state, commit, dispatch, rootGetters },
      { user, setting }
    ) {
      const deviceStatus = rootGetters['general/deviceStatus']

      const createVideo = (vData, isText) => {
        let videoObject
        if (isText) {
          videoObject = vData
        } else {
          const videoString = utilities.ab2str(vData)
          try {
            videoObject = JSON.parse(videoString)
          } catch (error) {
            console.log('Error parsing video data')
            return
          }
        }
        if (videoObject.encryptionIV.length > 0) {
          videoObject.encryptionIV = utilities.str2ui8arr(
            videoObject.encryptionIV
          )
        }
        const v = new VideoMetadata({ video: videoObject })
        // v.setFromBuffer(vData)
        v.falsifyAllMonitors()
        if (v.created.getTime() + strings.videoExpiryTime < Date.now()) {
          dispatch('removeDraftVideo', { user, video: v })
        } else {
          commit('addVideo', v)
        }
      }

      state.storageService
        .getAllFromStorage(deviceStatus, {
          store: stores.metadataStore,
          index: { name: 'setting', keys: [] },
          criteria: {}
        })
        .then(foundVideos => {
          if (foundVideos) {
            if (state.useCordova) {
              const loadFilePromises = []
              const userVideos = user.draftMetadataIDs

              foundVideos
                .filter(v => userVideos.includes(v.name))
                .forEach(fileEntry => {
                  loadFilePromises.push(
                    state.storageService.readFile({
                      store: stores.metadataStore,
                      cordovaData: {
                        fileEntry
                      }
                    })
                  )
                })
              Promise.all(loadFilePromises).then(files =>
                files.forEach(videoObject => {
                  createVideo(videoObject, true)
                })
              )
            } else {
              foundVideos
                .filter(eachItem =>
                  // Only attempt to decrypt our own metadata items
                  user.draftMetadataIDs.includes(eachItem.fileId)
                )
                .forEach(item => {
                  webcryptoService
                    .keyFromString(user.encryptionKey) // <- Async
                    .then(importedKey =>
                      webcryptoService
                        .decrypt(importedKey, item.iv, item.data) // <- Async
                        .then(videoMetadataBuffer =>
                          createVideo(videoMetadataBuffer, false)
                        )
                        .catch(error => {
                          console.log(error)
                        })
                    )
                    .catch(error => {
                      console.log(error)
                    })
                })
            }
          }
        })
        .catch(error => {
          if (error.name !== 'NotFoundError') {
            () => dispatch('errorMessage', 'Get all draft videos') // Async errors bubble out here
          }
        })
    },
    // Saves an encrypted copy of draft metadata to IndexedDB
    // Call whenever the user requires updates to metadata to be saved
    // If using Cordova, save an unencrypted copy
    // ** Async **
    saveDraftMetadata (
      { state, dispatch },
      { user, setting, updatedVideoMetadata }
    ) {
      return new Promise((resolve, reject) => {
        // Initialisation Vector for encryption should be created fresh each time
        // It's reportedly ok to store anongside encrypted metadata
        const iv = webcryptoService.getRandomValues()
        // Encryption requires an ArrayBuffer. This converts Object -> JSON -> ArrayBuffer
        const videoMetadataAsBuffer = updatedVideoMetadata.getAsBuffer()

        const saveToStorage = metaData => {
          return state.storageService.saveToStorage({
            store: stores.metadataStore,
            index: stores.metadataStore.indexes.settingAndFile,
            idbData: {
              settingId: setting.id,
              fileId: updatedVideoMetadata.fileId,
              iv,
              created: new Date(),
              data: metaData
            },
            cordovaData: {
              fileName: updatedVideoMetadata.fileId,
              data: metaData
            }
          }) // <- Async
        }

        // If using Cordova, skip the encryption process
        if (state.useCordova) {
          return saveToStorage(updatedVideoMetadata)
            .then(() => resolve())
            .catch(() => dispatch('errorMessage', 'Cordova save draft'))
        }

        // Otherwise, save to IndexedDB
        // Import the CryptoKey that is stored in metadata as a string
        return webcryptoService
          .keyFromString(user.encryptionKey)
          .then(importedKey =>
            webcryptoService
              // Wait for encryption of the data
              .encrypt(importedKey, iv, videoMetadataAsBuffer) // <- Async
              .then(encryptedMetadata => saveToStorage(encryptedMetadata))
              .then(() => {
                console.log('Completed metadata encryption and save')
                resolve()
              })
          )
          .catch(() => {
            dispatch('errorMessage', 'Encrypt draft')
            reject()
          })
      })
    },
    // Fetch all video METADATA including Drafts and from server
    // Clear the existing data first
    // Load draft metadata items from local IndexedDB
    // Load previously sent (unchangable) metadata items from the server
    fetchVideoMetadata ({ dispatch, commit }, { user, setting }) {
      commit('clearAllMetadata')
      dispatch('loadDraftMetadata', { user, setting })
      return serverService
        .request({
          route: '/api/videos',
          method: 'GET',
          credentials: true,
          body: {}
        })
        .then(videos => {
          videos.forEach(v =>
            commit('addVideo', new VideoMetadata({ video: v }))
          )
          dispatch('estimateStorageRemaining')
        })
        .catch(error => {
          dispatch('errorMessage', 'Fetch server videos')
          return Promise.reject(error)
        })
    },
    // Given a video, fetch it from server (used for status update)
    // This will cause an update to the video status in store, and also return the update
    // ** Async **
    fetchVideoMetadataByReference ({ commit, dispatch }, video) {
      return serverService
        .request({
          route: '/api/video',
          method: 'GET',
          params: { videoref: video.fileId },
          credentials: true,
          body: {}
        })
        .then(v => {
          if (
            v.status !== video.status ||
            v.pipelineInProgress !== video.pipelineInProgress
          ) {
            const updates = {
              pipelineInProgress: v.pipelineInProgress,
              status: v.status,
              errorInfo: v.errorInfo,
            }
            commit('mutateVideo', { fileId: video.fileId, updates })
          }
          return v
        })
        .catch(error => {
          return Promise.reject(error)
        })
    },

    // Remove the encrypted VIDEO from IndexedDB
    // Should be called only after an upload is confirmed as completed / successful
    removeLocalVideoData ({ state, dispatch }, fileId) {
      state.storageService
        .removeFromStorage({
          store: stores.videoStore,
          index: stores.videoStore.indexes.fileId,
          criteria: { fileId },
          cordovaData: {
            fileName: fileId + '.mp4'
          }
        })
        .catch(() => dispatch('errorMessage', 'Remove local videos'))
    },
    // Remove the encrypted video METADATA from IndexedDB
    removeLocalMetadata ({ state }, video) {
      if (video) {
        return state.storageService.removeFromStorage({
          store: stores.metadataStore,
          index: stores.metadataStore.indexes.settingAndFile,
          criteria: {
            settingId: video.settingId,
            fileId: video.fileId
          },
          cordovaData: {
            fileName: video.fileId
          }
        })
      } else {
        return Promise.reject()
      }
    },
    // Check server periodically for videos that are marked 'in progress' at the *SERVER* pipeline
    checkVideoProgress ({ dispatch }, video) {
      return new Promise((resolve, reject) => {
        dispatch('fetchVideoMetadataByReference', video)
          .then(updatedVideo => resolve(updatedVideo))
          .catch(() => reject())
      })
    },
    // Create or continue a TUS upload for the encrypted video to the server
    // * Returns a promise *
    generateUpload ({ state, dispatch, commit, rootGetters }, fileId) {
      return new Promise(resolve => {
        const deviceStatus = rootGetters['general/deviceStatus']
        const remoteAddress = baseUrl()
        const token = localStorage.getItem('jwt') || ''
        const setting = rootGetters['setting/selectedDatasett']
        const user = rootGetters['general/user']

        const onSuccess = () => {
          // Send the video metadata to match with the uploaded file
          return serverService
          .request({
            route: '/api/video',
            method: 'POST',
            credentials: true,
            body: state.selectedVideo.getAsString()
          })
          .then(() => {
            // Clear all information relating to this draft video from the client
            commit('removeTUSUpload', fileId)
            commit('clearVolatileVideoData', fileId)
            dispatch('removeLocalVideoData', fileId)
            dispatch('removeLocalMetadata', state.selectedVideo)
              .then(() => {
                // After IndexedDB data removal is confirmed, also remove in-memory copies
                // then reload fresh from server
                commit('removeDraftVideo', fileId)
                return dispatch('fetchVideoMetadata', {
                  user,
                  setting
                }).then(() => {
                  const uploadedVideo = state.videos[fileId]
                  commit('selectVideo', uploadedVideo)
                })
              })
              .catch(error => dispatch('errorMessage', error))
          })
          .catch(error => {
            dispatch('errorMessage', 'Send metadata to server')
            return Promise.reject(error)
          })
        }

        const onProgress = (bytesUploaded, bytesTotal) => {
          let uploadProgress = Math.round((bytesUploaded / bytesTotal) * 100)
          uploadProgress = uploadProgress > 100 ? 100 : uploadProgress
          commit('mutateVideo', {
            fileId,
            updates: { uploadProgress }
          })
        }

        /* const onChunkComplete = (chunkSize, bytesAccepted, bytesTotal) => {
          const uploadProgress = Math.round((bytesAccepted / bytesTotal) * 100)
          commit('mutateVideo', {
            fileId,
            updates: { uploadProgress }
          })
        } */

        const options = {
          endpoint: `${remoteAddress}/upload`,
          retryDelays: [0, 1000, 3000, 5000],
          chunkSize: 512 * 1024, // 512kB
          withCredentials: true,
          headers: {
            Authorization: `jwt ${token}`
          },
          metadata: { video: state.selectedVideo.getFileUploadInfo() },
          resume: false, //! state.useCordova, // TUS resume ability requires indexedDB
          // onChunkComplete,
          onProgress,
          onSuccess,
          onError: error => dispatch('errorMessage', error)
        }

        const createTusUpload = fileObject => {
          // Establish a TUS upload instance for this item
          const upload = new tus.Upload(fileObject, options)
          commit('setTUSUpload', { upload, fileId })
          resolve(upload)
        }

        state.storageService
          .getOneFromStorage(deviceStatus, {
            store: stores.videoStore,
            index: stores.videoStore.indexes.fileId,
            criteria: { fileId },
            cordovaData: {
              fileName: fileId + '.mp4',
              readFile: false
            }
          })
          .then(data => {
            if (data) {
              if (state.useCordova) {
                data.file(fileObject => {
                  createTusUpload(fileObject)
                })
              } else {
                const fileObject = new File(
                  state.videoUnEncryptedData[fileId],
                  fileId
                )
                createTusUpload(fileObject)
              }
            } else {
              dispatch('errorMessage', 'No video data')
              resolve()
            }
          })
          .catch(error => {
            dispatch('errorMessage', error)
            resolve()
          })
      })
    },

    // Signal TUS to change upload state for a given video
    // Create a TUS object if it doesn't alrady exist
    controlUpload ({ state, commit, dispatch }, { control, fileId }) {
      const upload = state.tusUploadInstances[fileId]

      const toggleUpload = upload => {
        const updates = {}
        if (upload && control == 'start') {
          upload.start()
          updates.uploadInProgress = true
        } else if (upload && control == 'abort') {
          upload.abort()
          updates.uploadInProgress = false
        }
        commit('mutateVideo', { fileId: fileId, updates })
      }

      if (upload) {
        toggleUpload(upload)
      } else {
        dispatch('generateUpload', fileId).then(upload => toggleUpload(upload))
      }
    },
    // Add a new UNENCRYPTED piece of recorded video to the temporary chunk list
    // We need to retain unencrypted video for ONLY THE CURRENT RECORDING to allow playback
    appendChunk ({ commit }, { fileId, chunk }) {
      commit('appendChunk', { fileId, chunk })
    },
    // Encrypt a given chunk of video data
    // append it to the selected video's encrypted chunk list:  videoEncryptedData[video.fileId]
    // Assumes the recording is always happening under the currently 'selectedVideo'
    // The idea is to allow this method to be called even if video recording continues, with the aim
    // to encrypt DURING recording to prevent too much encryption delay when recording is finished
    // * Returns a promise *
    encryptChunk ({ state, commit, dispatch }, { chunk, fileId }) {
      return new Promise((resolve, reject) => {
        if (state.useCordova) {
          return resolve()
        }
        const updates = { encryptionInProgress: true }
        const video = state.draftVideos[fileId]
        commit('mutateVideo', { fileId, updates })
        return webcryptoService
          .keyFromString(video.encryptionKey) // <- Async
          .then(importedKey => {
            new Response(chunk).arrayBuffer().then(arraybuffer => {
              // <- Async
              webcryptoService
                .encrypt(importedKey, video.encryptionIV, arraybuffer) // <- Async
                .then(data => {
                  commit('appendEncryptedChunk', {
                    data,
                    fileId
                  })
                  updates.encryptionInProgress = false
                  commit('mutateVideo', { fileId, updates })
                  console.log('Completed a chunk encryption')
                  resolve()
                })
                .catch(() => {
                  dispatch('errorMessage', 'Encrypt chunk')
                  reject(error)
                })
            })
          })
          .catch(() => {
            dispatch('errorMessage', 'Key from string')
            reject(error)
          })
      })
    },
    // Saves an encrypted VIDEO DATA item to IndexedDB using the fileId from metadata as reference
    // Call after all chunks are encrypted
    // If we're using cordova, save the unencrypted video to device storage instead
    // * Async *
    saveVideo ({ dispatch, state, commit }, fileId) {
      const updates = {}
      const dataWasSaved = () => {
        updates.isEncrypted = true
        updates.hasNewDataAvailable = true
        updates.recordingExists = true
        updates.hasUnsavedChanges = true
        commit('mutateVideo', { fileId, updates })
        dispatch('estimateStorageRemaining')
        console.log('Completed video data save')
      }

      if (state.useCordova) {
        // The Cordova video saves to a temporary location, so it must be moved first to our videoStore
        return state.storageService
          .moveMediaFile({
            store: stores.videoStore,
            cordovaData: {
              fileName: fileId + '.mp4',
              fileToMove: state.videoUnEncryptedData[fileId]
            }
          })
          .then(data => {
            // What was a MediaFile will now be a FileEntry
            commit('setDecryptedVideoData', { fileId, data })
            dataWasSaved()
          })
          .catch(() => dispatch('errorMessage', 'Move file'))
      } else {
        return state.storageService
          .saveToStorage({
            store: stores.videoStore,
            index: stores.videoStore.indexes.fileId,
            idbData: {
              fileId,
              created: new Date(),
              data: state.videoEncryptedData[fileId]
            }
          })
          .then(dataWasSaved)
          .catch(() => dispatch('errorMessage', 'Save video'))
      }
    },
    // Load VIDEO DATA from storage for use in the player
    // We need to ensure the chunks are retrieved in order
    // If using Cordova, skip the decryption procedure and load directly
    // * Returns a promise *
    loadVideo ({ state, commit, dispatch, rootGetters }, video) {
      const updates = {}
      // Resolve only once finished each chunk, so the Video knows when to retrieve the data to play
      return new Promise((resolve, reject) => {
        let importedKey
        let encryptedArray
        let decryptedData = []

        const loadCompleted = () => {
          updates.decryptionInProgress = false
          updates.hasNewDataAvailable = true
          commit('mutateVideo', { fileId: video.fileId, updates })
          resolve(true)
        }

        // This recursive function serves to decrypt and append each chunk in order
        // When no more chunks, create a Blob from the array, and save to the store
        // Notify 'new data available' for any view controllers watching
        const decryptChunks = () => {
          if (encryptedArray.length > 0) {
            const chunk = encryptedArray.shift()
            webcryptoService
              .decrypt(importedKey, video.encryptionIV, chunk)
              .then(dd => {
                decryptedData.push(dd)
                decryptChunks()
              })
              .catch(() => {
                dispatch('errorMessage', 'decryption failed')
                reject()
              })
          } else {
            const dataArray = decryptedData.map(
              data =>
                new Blob([new Uint8Array(data)], {
                  type: video.mimeType
                })
            )
            commit('setDecryptedVideoData', {
              fileId: video.fileId,
              data: dataArray
            })
            loadCompleted()
          }
        }

        // Get a video DATA item from store based on fileId, then begin decryption
        const deviceStatus = rootGetters['general/deviceStatus']
        state.storageService
          .getOneFromStorage(deviceStatus, {
            store: stores.videoStore,
            index: stores.videoStore.indexes.fileId,
            criteria: { fileId: video.fileId },
            cordovaData: {
              fileName: video.fileId + '.mp4',
              readFile: false
            }
          }) // <- Async
          .then(loadedData => {
            if (loadedData) {
              if (state.useCordova) {
                commit('setDecryptedVideoData', {
                  fileId: video.fileId,
                  data: loadedData
                })
                loadCompleted()
              } else if (video.encryptionKey) {
                encryptedArray = loadedData['data']
                updates.decryptionInProgress = true
                commit('mutateVideo', { fileId: video.fileId, updates })
                webcryptoService
                  .keyFromString(video.encryptionKey)
                  .then(key => {
                    importedKey = key
                    decryptChunks()
                  })
              } else {
                console.log('No encryption key found for video')
                resolve(false)
              }
            } else {
              resolve(true)
            }
          })
          .catch(() => {
            dispatch('errorMessage', 'Storage video load')
            resolve(false)
          })
      })
    },
    // This is only for video data only.
    loadCordovaMedia (store, fileEntry) {
      const copyFile = () =>
        cordovaService.copyFileToTemp({
          cordovaData: {
            fileEntry
          }
        })

      // iOS WKWebkit can only load video from the <app_id>/tmp folder!
      // 'device' comes from cordova-plugin-device
      if (device.platform == 'iOS') {
        return cordovaService
          .clearTempFolder()
          .then(() => copyFile())
          .catch(error => copyFile(error))
      } else {
        return Promise.resolve(fileEntry)
      }
    },
    // Call the server to perform a video transfer to final storage destination
    // This redirects the user to a service login page to authorise the transfer
    // Then, redirects back to our app
    // Second redirect has enough info for router.js to open Editor view on this video
    // See also: transferSuccess()  below..
    initiateTransfer ({ state, dispatch }, { video, settingId, mode }) {
      if (video.storages.some(name => name == 'google')) {
        let route = '/api/google_transfer'
        let device = ''

        // New Google Transfer Method:  Rely on the user having a valid ID token to contact Google without an authorisation redirect
        /* if (state.useCordova) {
          device =  'mobileApp'
        } */

        // Original Google Transfer Method using OAuth plugin (problem is: unable to pass session or JWT header to OAuth plugin)
        if (state.useCordova) {
          const token = localStorage.getItem('jwt') || '';
          route = `${baseUrl()}/api/google_transfer`
          route += `?device=mobileApp&videoReference=${video.fileId}&settingId=${settingId}&mode=${mode}&jwt=${token}`
          return window.OAuth(route, 'oauth:google', 'allowinlinemediaplayback=YES')
        }

        return (
          serverService
            .request({
              route,
              method: 'GET',
              // These params are needed after possible Google auth redirect to return to the local view
              params: {
                device,
                videoReference: video.fileId,
                settingId,
                mode
              },
              credentials: true,
              body: {}
            })
            // Redirect must be done from front end to aoid CORS issues
            .then(response => (window.location.href = decodeURI(response.data)))
            .catch(error => {
              dispatch('errorMessage', error)
              return Promise.reject(error)
            })
        )
      }
    },
    // This is called after a successful redirect from the final video storage API
    // It returns the VIVA app to the state it was in before redirection
    transferSuccess (
      { state, dispatch, commit, rootGetters },
      { videoReference, settingId, error }
    ) {
      return new Promise(resolve => {
        dispatch('setting/selectSettingById', settingId, { root: true })
        const setting = rootGetters['setting/selectedDatasett']
        const user = rootGetters['general/user']
        // Return a promise that manages retrieval of videos before selecting the referenced video
        const fetchAfterTransfer = () => {
          dispatch('fetchVideoMetadata', { setting, user }).then(() => {
            const video = state.videos[videoReference]
            commit('selectVideo', video)
            if (error) {
              let errorMessage
              switch (error) {
                case 'accountdomain':
                  errorMessage = 'Transfer account is incorrect'
                  break
                case 'accountvalid':
                  errorMessage = 'Transfer account is valid'
                  break
                default:
                  errorMessage = ''
              }
              dispatch('errorMessage', errorMessage)
              resolve()
            } else {
              console.log('Transfer success!!')
              resolve()
            }
          })
        }
        if (state.useCordova || state.storageService.dbExists) {
          fetchAfterTransfer()
          console.log('Transfer success. Re-fetching metadata..')
        } else {
          state.storageService.registerOnetimeDBReadyCallback(
            fetchAfterTransfer
          )
        }
      })
    }
  }
}

import {
  VIDEO_STATUS_TYPES,
  videoExpiryTime,
  baseUrl,
  stores,
} from '../constants'
import { ref, Ref, computed, ComputedRef } from 'vue'
import orderBy from 'lodash/orderBy'
import {
  Video,
  Dataset,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  VideoSpec,
} from '../types/main'
import {
  useDeviceService,
  CordovaData,
  CordovaPathTopLevelName,
} from './useDevice'
import { Upload } from 'tus-js-client'
import { apiRequest } from '../api/apiRequest'
import cordovaService from '../api/cordovaService'
import { useDatasetStore } from './useDatasetStore'
import { useAppStore } from './useAppStore'
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
const { getters: appGetters, actions: appActions } = useAppStore()
const { actions: deviceActions } = useDeviceService()
interface State {
  selectedVideo: Video | undefined
  videos: Map<string, Video>
  draftVideos: Map<string, Video>
  // If using Cordova, videoDataFiles[fileId] will be a fileEntry object
  videoDataFiles: Map<string, FileEntry>
  // Used to hold changes to video metadata before saving to the 'selectedVideo'
  // tempVideo: undefined,
  // Current TUS upload instances
  tusUploadInstances: Map<string, Upload>
  recordingNow: boolean
  estimatedStorageRemaining: string // Percentage
  cordovaPath: string[] // Should be set to ['users', USER_ID] for VIVA
}

const state: Ref<State> = ref({
  selectedVideo: undefined,
  videos: new Map(),
  draftVideos: new Map(),
  // This dict is a volatile only instance holding the decrypted video chunks arrays by fileId.
  // If using Cordova, videoDataFiles[fileId] will be a fileEntry object
  videoDataFiles: new Map(),
  // Used to hold changes to video metadata before saving to the 'selectedVideo'
  // tempVideo: undefined,
  // Current TUS upload instances
  tusUploadInstances: new Map(),
  recordingNow: false,
  estimatedStorageRemaining: 'unknown', // Percentage
  cordovaPath: [],
})

//Getters
interface Getters {
  allVideos: ComputedRef<Video[]>
  selectedVideo: ComputedRef<Video | undefined>
  allDraftVideos: ComputedRef<Video[]>
  recordingNow: ComputedRef<boolean>
  estimatedStorageRemaining: ComputedRef<string>
  videoByID: (fileId: string) => Video | undefined
  draftVideos: (datasetId: string) => ComputedRef<Video[]>
  videoDataFile: (fileId: string) => ComputedRef<FileEntry>
  hasUnsavedChanges: (fileId: string) => ComputedRef<boolean>
  uploadingData: (fileId) => ComputedRef<boolean>
  hasTUSUploadReady: (video: Video) => ComputedRef<boolean>
}
const getters = {
  get allVideos(): ComputedRef<Video[]> {
    return computed(() => {
      const vs = Array.from(state.value.videos.values())
      return orderBy(vs, 'details.created', 'desc')
    })
  },
  get selectedVideo(): ComputedRef<Video | undefined> {
    return computed(() => state.value.selectedVideo)
  },
  get allDraftVideos(): ComputedRef<Video[]> {
    const vs = Array.from(state.value.draftVideos.values())
    return computed(() => orderBy(vs, 'details.created', 'desc'))
  },
  get recordingNow(): ComputedRef<boolean> {
    return state.value.recordingNow
  },
  get estimatedStorageRemaining(): ComputedRef<string> {
    return computed(() => state.value.estimatedStorageRemaining)
  },
  videoByID: (fileId: string): Video | undefined => {
    if (state.value.draftVideos.has(fileId))
      return state.value.draftVideos.get(fileId)
    else return state.value.videos.get(fileId)
  },
  draftVideos: (datasetId: string): ComputedRef<Video[]> => {
    const filteredVids = Array.from(state.value.videos.values()).filter(
      (v: Video) => v.dataset.id == datasetId
    )
    return orderBy(filteredVids, 'details.created', 'desc')
  },
  videoDataFile: (fileId: string): ComputedRef<FileEntry> => {
    return computed(() => state.value.videoDataFiles[fileId])
  },
  hasUnsavedChanges: (fileId: string): ComputedRef<boolean> => {
    return computed(
      () => !!state.value.draftVideos.get(fileId)?.status.hasUnsavedChanges
    )
  },
  uploadingData: (fileId: string): ComputedRef<boolean> => {
    return computed(
      () => !!state.value.draftVideos.get(fileId)?.status.uploadInProgress
    )
  },
  hasTUSUploadReady: (video: Video): ComputedRef<boolean> => {
    return state.value.tusUploadInstances.has(video.details.id)
  },
}

//Actions
interface Actions {
  setCordovaPath: (path: string[]) => void
  setRecordingNow: (value: boolean) => void
  addMetadata: (video: Video) => void
  removeDraftVideo: (fileId: string) => void
  clearVideoDataFile: (videoId: string) => void
  setDecryptedVideoData: (d: { fileId: string; data: FileEntry }) => void
  setTUSUpload: (d: { fileId: string; upload: Upload }) => void
  removeTUSUpload: (fileId: string) => void
  abortAllUploads: () => void
  clearDataUponLogout: () => void
  selectVideo: (video: Video | undefined) => void
  setUnsavedChanges: (fileId: string) => void

  controlUpload: (control: string, video: Video) => void
  fetchVideoStatus(video: Video): Promise<void>

  createMetadata: (d: VideoSpec) => Promise<void>
  loadMetadata: () => Promise<void>
  fetchMetadata: () => Promise<void>
  updateMetadata: (video: Video) => Promise<void>
  loadCordovaMedia: (fileEntry: FileEntry) => Promise<void | FileEntry>

  loadVideo(video: Video): Promise<boolean>
  removeVideo: (video: Video) => Promise<void>
  replaceDraftVideo: (videoId: string) => Promise<void>
}

const actions = {
  // ------ MUTATORS --------
  setCordovaPath: (path: string[]): void => {
    state.value.cordovaPath = path
  },
  setRecordingNow: (value: boolean): void => {
    state.value.recordingNow = value
  },
  clearVideoDataFile: (videoId: string): void => {
    if (state.value.videoDataFiles.has(videoId))
      state.value.videoDataFiles.delete(videoId)
  },
  setDecryptedVideoData: (d: { fileId: string; data: FileEntry }): void => {
    state.value.videoDataFiles.set(d.fileId, d.data)
  },
  setTUSUpload: (d: { fileId: string; upload: Upload }): void => {
    state.value.tusUploadInstances.set(d.fileId, d.data)
  },
  removeTUSUpload: (videoId: string): void => {
    if (state.value.tusUploadInstances.has(videoId))
      state.value.tusUploadInstances.delete(videoId)
  },
  // Abort all existing TUS uploads
  abortAllUploads: (): void => {
    const values = Array.from(state.value.tusUploadInstances.values())
    values.forEach((tu: Upload) => tu.abort())
  },
  clearDataUponLogout: (): void => {
    state.value.videoDataFiles.clear()
    state.value.selectedVideo = undefined
    state.value.videos.clear()
    state.value.draftVideos.clear()
  },

  // -------- ACTIONS --------

  selectVideo: (video: Video | undefined): void => {
    state.value.selectedVideo = video
  },
  // This is a tracker to notify the rest of the app that something chas changed in the Editor
  // which needs to be saved after 'samtykker'
  setUnsavedChanges: (fileId: string): void => {
    const updates = { hasUnsavedChanges: true }
    const v = getters.videoByID(fileId)
    if (v) v.updateStatus(updates)
  },
  // Signal TUS to change upload state for a given video
  // Create a TUS object if it doesn't alrady exist
  controlUpload: (control: string, video: Video): void => {
    const toggleUpload = (upload: Upload) => {
      if (video && upload) {
        if (control == 'start') {
          upload.start()
          video.status.uploadInProgress = true
        } else if (control == 'abort') {
          upload.abort()
          video.status.uploadInProgress = false
        }
        actions.updateMetadata(video)
      }
    }

    const up = state.value.tusUploadInstances.get(video.details.id)
    if (up) toggleUpload(up)
    else actions.generateUpload(video).then((upload) => toggleUpload(upload))
  },
  // Given a video, fetch it from server (used for status update)
  // This will cause an update to the video status in store, and also return the update
  // ** Async **
  fetchVideoStatus(video: Video): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/video',
      params: { videoref: video.details.id },
      credentials: true,
    }
    return apiRequest(payload)
      .then((v: Video) => {
        if (
          v.status.main !== video.status.main ||
          v.status.inPipeline !== video.status.inPipeline
        ) {
          actions.updateMetadata(v)
        }
        return v
      })
      .catch((error) => {
        return Promise.reject(error)
      })
  },
  // Create or continue a TUS upload for the encrypted video to the server
  // * Returns a promise *
  generateUpload(video: Video): void {
    return new Promise((resolve) => {
      const deviceStatus = appGetters.deviceStatus
      const token = localStorage.getItem('jwt') || ''
      const dataset = datasetGetters.selectedDataset
      const user = appGetters.user
      const fileId = video.details.id

      const onSuccess = () => {
        const payload: APIRequestPayload = {
          method: XHR_REQUEST_TYPE.POST,
          route: '/api/video',
          credentials: true,
          body: video.getAsString(),
        }
        return apiRequest(payload)
          .then(() => {
            actions.removeTUSUpload(fileId)
            actions.clearVideoDataFile(fileId)
            actions.removeVideoFile(video)
          })
          .catch((error) => {
            return Promise.reject(error)
          })
        // Send the rest of the video metadata to match with the uploaded file
        return serverService
          .request({
            route: '/api/video',
            method: 'POST',
            credentials: true,
            body: video.getAsString(),
          })
          .then(() => {
            // Clear all information relating to this draft video from the client
            commit('removeTUSUpload', fileId)
            commit('clearVideoDataFiles', fileId)
            dispatch('removeLocalVideoData', fileId)
            dispatch('removeLocalMetadata', state.value.selectedVideo)
              .then(() => {
                // After IndexedDB data removal is confirmed, also remove in-memory copies
                // then reload fresh from server
                commit('removeDraftVideo', fileId)
                return dispatch('fetchVideoMetadata', {
                  user,
                  setting,
                }).then(() => {
                  const uploadedVideo = state.value.videos[fileId]
                  commit('selectVideo', uploadedVideo)
                })
              })
              .catch((error) => dispatch('errorMessage', error))
          })
          .catch((error) => {
            dispatch('errorMessage', 'Send metadata to server')
            return Promise.reject(error)
          })
      }

      const onProgress = (bytesUploaded, bytesTotal) => {
        let uploadProgress = Math.round((bytesUploaded / bytesTotal) * 100)
        uploadProgress = uploadProgress > 100 ? 100 : uploadProgress
        video.status.uploadProgress = uploadProgress
        actions.updateMetadata(video)
      }

      const options = {
        endpoint: `${baseUrl}/upload`,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 512 * 1024, // 512kB
        onBeforeRequestSend: (req) => {
          const xhr = req.getUnderlyingObject()
          xhr.withCredentials = true
        },
        headers: {
          Authorization: `jwt ${token}`,
        },
        metadata: { video: state.value.selectedVideo.getFileUploadInfo() },
        resume: false, //! state.useCordova, // TUS resume ability requires indexedDB
        // onChunkComplete,
        onProgress,
        onSuccess,
        onError: (error) => appActions.errorMessage(error.toString()),
      }

      const createTusUpload = (fileObject: File) => {
        // Establish a TUS upload instance for this item
        const upload: Upload = new Upload(fileObject, options)
        commit('setTUSUpload', { upload, fileId })
        resolve(upload)
      }

      const cd: CordovaData = new CordovaData({
        fileName: video.details.id,
        readFile: false,
        path: state.value.cordovaPath,
      })
      deviceActions
        .loadFromStorage<FileEntry>(cd)
        .then((fileEntry: FileEntry | void) => {
          if (fileEntry) {
            fileEntry.file((fileObject) => {
              createTusUpload(fileObject)
            })
          } else {
            appActions.errorMessage('Create upload: No video data file')
            resolve()
          }
        })
    })
  },

  // -------  Video METADATA functions (.json file) ------------

  // Create a new draft metadata
  createMetadata: (d: VideoSpec): Promise<void> => {
    const newVideo = new Video({
      dataset: d.dataset,
      user: d.user,
      selection: d.selection,
      deviceStatus: d.deviceStatus,
    })
    actions.addMetadata(newVideo)
    actions.selectVideo(newVideo)
    appActions.addDraftIdToUser(newVideo.details.id)
    return appActions.updateUserAtServer(user).then(() => saveMetadata())
  },
  addMetadata: (video: Video): void => {
    if (video.status.main === VIDEO_STATUS_TYPES.draft) {
      state.value.draftVideos.set(video.details.id, video)
      state.value.videoDataFiles.delete(video.details.id)
    } else {
      state.value.videos.set(video.details.id, video)
    }
  },
  // Update the video in store with the given video (by fileId) and save to local disk
  updateMetadata: (video: Video): Promise<void> => {
    video.status.hasUnsavedChanges = false
    video.status.hasNewDataAvailable = false
    let videoToUpdate: Video
    if (state.value.draftVideos.has(video.details.id))
      videoToUpdate = state.value.draftVideos.get(video.details.id)
    else if (state.value.videos.has(video.details.id))
      videoToUpdate = state.value.videos.get(video.details.id)
    if (videoToUpdate) {
      videoToUpdate.updateAll(video)
      return actions.saveMetadata()
    } else return Promise.resolve()
  },
  // Remove the video in store (by fileId) and save to local disk
  removeMetadata: (video: Video): Promise<void> => {
    state.value.draftVideos.delete(video.details.id)
    return actions.saveMetadata()
  },
  // Save all metadata as a file to local disk
  // Draft video metadata is stored in a single JSON file
  saveMetadata: (): Promise<void> => {
    const draftArray = Array.from(state.value.draftVideos.values()).map(
      (v) => v.asPOJO
    )
    const cd: CordovaData = new CordovaData({
      fileName: 'metadata.json',
      data: draftArray,
      asText: true,
      asJSON: true,
      path: state.value.cordovaPath,
    })
    return deviceActions.saveToStorage(cd)
  },
  // Load metadata from a file on local disk
  // Draft video metadata is stored in a single JSON file
  loadMetadata: (): Promise<void> => {
    const cd: CordovaData = new CordovaData({
      fileName: 'metadata.json',
      readFile: true,
      asText: true,
      asJSON: true,
      path: state.value.cordovaPath,
    })
    deviceActions.loadFromStorage<Video[]>(cd).then((videoList) => {
      if (videoList.length) {
        videoList = videoList as Video[]
        videoList.forEach((video) => {
          const v = new Video(video)
          // If video has expired, remove it
          if (v.details.created.getTime() + videoExpiryTime < Date.now()) {
            actions.removeVideo(v)
          } else {
            actions.addMetadata(v)
          }
        })
      }
    })
  },
  // Fetch metadata from server
  fetchMetadata: (): Promise<void> => {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/videos',
      credentials: true,
    }
    return apiRequest(payload)
      .then((videos: Video[]) => {
        state.value.videos.clear()
        state.value.draftVideos.clear()
        videos.forEach((v) => actions.addMetadata(new Video(v)))
      })
      .catch((error) => {
        dispatch('errorMessage', 'Fetch server videos')
        return Promise.reject(error)
      })
  },

  // ----------   video DATA & METADATA functions ------------

  // Remove a video (data and metadata)
  removeVideo: (video: Video): Promise<void> => {
    return appActions.removeVideoFile(video.details.id).then(() => {
      actions.clearVideoDataFile(video.details.id)
      return actions
        .removeMetadata(video)
        .then(() => {
          appActions.removeDraftId(d.video.details.video.fileId)
          return appActions.updateUserAtServer().then(() => {
            console.log(
              `Removed a draft video: ${d.video.details.video.fileId}`
            )
          })
        })
        .catch(() => dispatch('errorMessage', 'Remove video'))
    })
  },

  // Call when a draft video is recorded to replace an older draft video
  replaceDraftVideo: (videoId: string): Promise<void> => {
    actions.clearVideoDataFile(videoId)
    actions.removeTUSUpload(videoId)
    actions.removeVideoFile(videoId).then(() => {
      const video = state.value.draftVideos.get(videoid)
      if (video) {
        video.details.duration = 0
        video.details.edl = { trim: [], blur: [] }
        video.status.hasNewDataAvailable = false
      }
      return actions
        .saveMetadata()
        .catch(() => appActions.errorMessage('Replace draft video error'))
    })
  },

  // ----------   video DATA functions (.mp4 file) ------------

  // Remove a video data from disk
  removeVideoFile: (videoId: string): Promise<void> => {
    const cd: CordovaData = new CordovaData({
      fileName: videoId,
      path: state.value.cordovaPath,
    })
    return cordovaService
      .removeFromStorage(cd)
      .catch(() => appActions.errorMessage('Error removing local video file'))
  },
  // This gets video data as MediaFile required for iOS
  loadCordovaMedia: (fileEntry: FileEntry): Promise<void | FileEntry> => {
    // iOS WKWebkit can only load video from the <app_id>/tmp folder!
    // 'device' comes from cordova-plugin-device
    const device: Device = device.platform
    if (device.platform === 'iOS') {
      return cordovaService
        .clearTempFolder()
        .then(() => {
          return cordovaService.copyFileToTemp({
            cordovaData: {
              fileEntry,
            },
          })
        })
        .catch((error) => appActions.errorMessage(error))
    } else {
      return Promise.resolve(fileEntry)
    }
  },
  // Load video data from storage for use in the player
  loadVideo(video: Video): Promise<boolean> {
    const newVideo = new Video(video)
    // Resolve only once finished each chunk, so the Video knows when to retrieve the data to play
    return new Promise((resolve) => {
      // Get a video DATA item from store based on fileId, then begin decryption
      const cd: CordovaData = new CordovaData({
        fileName: video.fileId,
        readFile: false,
        path: state.value.cordovaPath,
      })
      deviceActions
        .loadFromStorage<FileEntry>(cd)
        .then((loadedData) => {
          if (loadedData) {
            state.value.videoDataFiles.set(video.details.id, loadedData)
            newVideo.status.decryptionInProgress = false
            newVideo.status.hasNewDataAvailable = true
            actions.updateMetadata(newVideo)
            resolve(true)
          }
        })
        .catch(() => {
          appActions.errorMessage('Storage video load')
          resolve(false)
        })
    })
  },
}
// This defines the interface used externally
interface ServiceInterface {
  actions: Actions
  getters: Getters
}
export function useVideoStore(): ServiceInterface {
  return {
    getters,
    actions,
  }
}

export type VideoStoreType = ReturnType<typeof useVideoStore>

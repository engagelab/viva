/*
 Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam, and Ole Smørdal

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
import { VIDEO_STATUS_TYPES, videoExpiryTime, baseUrl } from '../constants'
import { ref, Ref, computed, ComputedRef } from 'vue'
import orderBy from 'lodash/orderBy'
import {
  Video,
  VideoData,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  VideoSpec,
} from '../types/main'
import { useDeviceService, CordovaData } from './useDevice'
import { Upload, HttpRequest } from 'tus-js-client'
import { apiRequest } from '../api/apiRequest'
import { useNotifyStore } from './useNotifyStore'
const { actions: notifyActions } = useNotifyStore()
const { actions: deviceActions } = useDeviceService()
interface State {
  selectedVideo: Video | undefined
  videos: Map<string, Video>
  draftVideos: Map<string, Video>
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
  uploadingData: ComputedRef<boolean>
  estimatedStorageRemaining: ComputedRef<string>
  videoByID: (fileId: string) => Video | undefined
  draftVideos: (datasetId: string) => ComputedRef<Video[]>
  hasUnsavedChanges: (fileId: string) => ComputedRef<boolean>
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
    return computed(() => state.value.recordingNow)
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
    return computed(() => {
      const filteredVids = Array.from(state.value.videos.values()).filter(
        (v: Video) => v.dataset.id == datasetId
      )
      return orderBy(filteredVids, 'details.created', 'desc')
    })
  },
  hasUnsavedChanges: (fileId: string): ComputedRef<boolean> => {
    return computed(
      () => !!state.value.draftVideos.get(fileId)?.status.hasUnsavedChanges
    )
  },
  get uploadingData(): ComputedRef<boolean> {
    return computed(() =>
      Object.values(state.value.draftVideos).some(
        (v) => v.status.uploadInProgress
      )
    )
  },
  hasTUSUploadReady: (video: Video): ComputedRef<boolean> => {
    return computed(() => state.value.tusUploadInstances.has(video.details.id))
  },
}

//Actions
interface Actions {
  setCordovaPath: (path: string[]) => void
  setRecordingNow: (value: boolean) => void
  addMetadata: (video: Video) => void
  setTUSUpload: (d: { fileId: string; upload: Upload }) => void
  removeTUSUpload: (fileId: string) => void
  abortAllUploads: () => void
  clearDataUponLogout: () => void
  selectVideo: (video: Video | undefined) => void
  setUnsavedChanges: (fileId: string) => void
  setNewDataAvailable: (fileId: string) => void

  controlUpload: (control: string, video: Video) => void
  generateUpload(video: Video): Promise<void | Upload>
  fetchVideoStatus(video: Video): Promise<void>

  createMetadata: (d: VideoSpec) => Promise<void>
  loadMetadata: () => Promise<void>
  saveMetadata: () => Promise<void>
  fetchMetadata: () => Promise<void>
  updateMetadata: (video: Video) => Promise<void>

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
  setTUSUpload: (d: { fileId: string; upload: Upload }): void => {
    state.value.tusUploadInstances.set(d.fileId, d.upload)
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
    state.value.selectedVideo = undefined
    state.value.videos.clear()
    state.value.draftVideos.clear()
  },

  // -------- ACTIONS --------

  selectVideo: (video: Video | undefined): void => {
    if (!video) state.value.selectedVideo = undefined
    else if (state.value.draftVideos.has(video.details.id))
      state.value.selectedVideo = state.value.draftVideos.get(video.details.id)
    else if (state.value.videos.has(video.details.id))
      state.value.selectedVideo = state.value.videos.get(video.details.id)
  },
  // This is a tracker to notify the rest of the app that something has changed in the Editor
  // which needs to be saved after 'samtykker'
  setUnsavedChanges: (fileId: string): void => {
    const updates = { hasUnsavedChanges: true }
    const v = getters.videoByID(fileId)
    if (v) v.updateStatus(updates)
  },
  // This is used to notify the app of new video recorer data available
  setNewDataAvailable: (fileId: string): void => {
    const updates = { hasNewDataAvailable: true }
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
    else {
      actions.generateUpload(video).then((upload) => {
        if (upload) toggleUpload(upload)
      })
    }
  },
  // Given a video, fetch it from server (used for status update)
  // This will cause an update to the video status in store, and also return the update
  // ** Async **
  fetchVideoStatus(video: Video): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/video',
      query: { videoref: video.details.id },
      credentials: true,
    }
    return apiRequest<Video>(payload)
      .then((v: Video) => {
        if (
          (v && v.status.main !== video.status.main) ||
          (v && v.status.inPipeline !== video.status.inPipeline)
        ) {
          actions.updateMetadata(v)
        }
      })
      .catch((error) => {
        return Promise.reject(error)
      })
  },
  // Create or continue a TUS upload for the encrypted video to the server
  // * Returns a promise *
  generateUpload(video: Video): Promise<void | Upload> {
    return new Promise((resolve) => {
      const token = localStorage.getItem('jwt') || ''
      const fileId = video.details.id

      const onSuccess = () => {
        const payload: APIRequestPayload = {
          method: XHR_REQUEST_TYPE.POST,
          route: '/api/video',
          credentials: true,
          body: video.asPOJO,
        }
        // Send the rest of the video metadata to match with the uploaded file
        return apiRequest(payload)
          .then(() => {
            actions.removeTUSUpload(fileId)
            deviceActions.removeVideoFile(fileId).then(() => {
              // After IndexedDB data removal is confirmed, also remove in-memory copies
              // then reload fresh from server
              state.value.draftVideos.delete(video.details.id)
              actions.fetchMetadata().then(() => {
                const uploadedVideo: Video | undefined = state.value.videos.get(
                  video.details.id
                )
                if (uploadedVideo) actions.selectVideo(uploadedVideo)
              })
            })
          })
          .catch((error) => {
            return Promise.reject(error)
          })
      }

      const onProgress = (bytesUploaded: number, bytesTotal: number) => {
        let uploadProgress = Math.round((bytesUploaded / bytesTotal) * 100)
        uploadProgress = uploadProgress > 100 ? 100 : uploadProgress
        video.status.uploadProgress = uploadProgress
        actions.updateMetadata(video)
      }

      const options = {
        endpoint: `${baseUrl}/upload`,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: 512 * 1024, // 512kB
        onBeforeRequestSend: (req: HttpRequest) => {
          const xhr = req.getUnderlyingObject()
          xhr.withCredentials = true
        },
        headers: {
          Authorization: `jwt ${token}`,
        },
        metadata: {
          video: video.getFileUploadInfo(),
        },
        // onChunkComplete,
        onProgress,
        onSuccess,
        onError: (error: Error) => notifyActions.errorMessage(error.toString()),
      }

      const createTusUpload = (fileObject: File) => {
        // Establish a TUS upload instance for this item
        const upload: Upload = new Upload(fileObject, options)
        actions.setTUSUpload({ upload, fileId })
        resolve(upload)
      }

      const cd: CordovaData = new CordovaData({
        fileName: video.details.id + '.mp4',
        readFile: false,
        create: false,
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
            notifyActions.errorMessage('Create upload: No video data file')
            resolve()
          }
        })
    })
  },

  // -------  Video METADATA functions (.json file) ------------

  // Create a new draft metadata
  createMetadata: (d: VideoSpec): Promise<void> => {
    const newVideo = new Video().updateFromVideoSpec({
      dataset: d.dataset,
      user: d.user,
      selection: d.selection,
      deviceStatus: d.deviceStatus,
    })
    actions.addMetadata(newVideo)
    actions.selectVideo(newVideo)
    return Promise.resolve()
  },
  addMetadata: (video: Video): void => {
    if (video.status.main === VIDEO_STATUS_TYPES.draft) {
      state.value.draftVideos.set(video.details.id, video)
    } else {
      state.value.videos.set(video.details.id, video)
    }
  },
  // Update the video in store with the given video (by fileId) and save to local disk
  updateMetadata: (video: Video): Promise<void> => {
    video.status.hasUnsavedChanges = false
    video.status.hasNewDataAvailable = false
    let videoToUpdate: Video | undefined = undefined
    if (state.value.draftVideos.has(video.details.id))
      videoToUpdate = state.value.draftVideos.get(video.details.id)
    else if (state.value.videos.has(video.details.id))
      videoToUpdate = state.value.videos.get(video.details.id)
    if (videoToUpdate) {
      videoToUpdate.updateFromVideo(video)
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
      create: true,
      path: state.value.cordovaPath,
    })
    return deviceActions.saveToStorage(cd)
  },
  // Load draft metadata from a file on local disk
  // Draft video metadata is stored in a single JSON file
  loadMetadata: (): Promise<void> => {
    const cd: CordovaData = new CordovaData({
      fileName: 'metadata.json',
      readFile: true,
      asText: true,
      asJSON: true,
      path: state.value.cordovaPath,
    })
    return deviceActions.loadFromStorage<VideoData[]>(cd).then((videoList) => {
      state.value.draftVideos.clear()
      if (videoList && videoList.length) {
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
  // Fetch non-draft metadata from server
  fetchMetadata: (): Promise<void> => {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/videos',
      credentials: true,
    }
    return apiRequest<VideoData[]>(payload)
      .then((videos: VideoData[]) => {
        state.value.videos.clear()
        videos.forEach((v) => actions.addMetadata(new Video(v)))
      })
      .catch((error) => {
        notifyActions.errorMessage('Fetch server videos')
        return Promise.reject(error)
      })
  },

  // ----------   video DATA & METADATA functions ------------

  // Remove a video (data and metadata)
  removeVideo: (video: Video): Promise<void> => {
    return deviceActions.removeVideoFile(video.details.id).then(() => {
      return actions
        .removeMetadata(video)
        .catch(() => notifyActions.errorMessage('Remove video'))
    })
  },

  // Call when a draft video is recorded to replace an older draft video
  replaceDraftVideo: (videoId: string): Promise<void> => {
    actions.removeTUSUpload(videoId)
    return deviceActions.removeVideoFile(videoId).then(() => {
      const video = state.value.draftVideos.get(videoId)
      if (video) {
        video.details.duration = 0
        video.details.edl = { trim: [], blur: [] }
        video.status.hasNewDataAvailable = false
      }
      return actions
        .saveMetadata()
        .catch(() => notifyActions.errorMessage('Replace draft video error'))
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

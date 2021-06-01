//Store to do student / teacher /external guest user operations
/**
 *
 TODO:
 1. fetchVideoMetadata and fetch video Data from S3 bucket
 2. savevideo Metadat()//Along with sharing info
 */
import { VIDEO_STATUS_TYPES } from '../constants'
import { ref, Ref, computed, ComputedRef } from 'vue'
import orderBy from 'lodash/orderBy'
import {
  Video,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  VideoSpec,
} from '../types/main'
import { Upload } from 'tus-js-client'
import { apiRequest } from '../api/apiRequest'
import { useDatasetStore } from './useDatasetStore'
import { useAppStore } from './useAppStore'
import { VideoData } from '@/types/main'
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
const { getters: appGetters, actions: appActions } = useAppStore()
interface State {
  selectedVideo: Video | undefined
  videos: Map<string, Video>
  draftVideos: Map<string, Video>
  // If using Cordova, videoUnEncryptedData[fileId] will be a fileEntry object
  videoUnEncryptedData: Map<string, FileEntry>
  // Used to hold changes to video metadata before saving to the 'selectedVideo'
  // tempVideo: undefined,
  // Current TUS upload instances
  tusUploadInstances: Map<string, Upload>
  recordingNow: boolean
  estimatedStorageRemaining: string // Percentage
}

const state: Ref<State> = ref({
  selectedVideo: undefined,
  videos: new Map(),
  draftVideos: new Map(),
  // This dict is a volatile only instance holding the decrypted video chunks arrays by fileId.
  // If using Cordova, videoUnEncryptedData[fileId] will be a fileEntry object
  videoUnEncryptedData: new Map(),
  // Used to hold changes to video metadata before saving to the 'selectedVideo'
  // tempVideo: undefined,
  // Current TUS upload instances
  tusUploadInstances: new Map(),
  recordingNow: false,
  estimatedStorageRemaining: 'unknown', // Percentage
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
  unencryptedData: (fileId: string) => ComputedRef<FileEntry>
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
  unencryptedData: (fileId: string): ComputedRef<FileEntry> => {
    return computed(() => state.value.videoUnEncryptedData[fileId])
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
  setRecordingNow: (value: boolean) => void
  addVideo: (video: Video) => void
  removeDraftVideo: (fileId: string) => void
  clearVolatileVideoData: (fileId: string) => void
  setDecryptedVideoData: (d: { fileId: string; data: FileEntry }) => void
  setTUSUpload: (d: { fileId: string; upload: Upload }) => void
  removeTUSUpload: (fileId: string) => void
  abortAllUploads: () => void
  clearDataUponLogout: () => void
}

const actions = {
  // ------ OLD MUTATORS --------
  setRecordingNow: (value: boolean): void => {
    state.value.recordingNow = value
  },
  addVideo: (video: Video): void => {
    if (video.status.main === VIDEO_STATUS_TYPES.draft) {
      state.value.draftVideos.set(video.details.id, video)
      state.value.videoUnEncryptedData.delete(video.details.id)
    } else {
      state.value.videos.set(video.details.id, video)
    }
  },
  removeDraftVideo: (fileId: string): void => {
    if (state.value.draftVideos.has(fileId))
      state.value.draftVideos.delete(fileId)
  },
  clearVolatileVideoData: (fileId: string): void => {
    state.value.videoUnEncryptedData.delete(fileId)
  },
  setDecryptedVideoData: (d: { fileId: string; data: FileEntry }): void => {
    state.value.videoUnEncryptedData.set(d.fileId, d.data)
  },
  setTUSUpload: (d: { fileId: string; upload: Upload }): void => {
    state.value.tusUploadInstances.set(d.fileId, d.data)
  },
  removeTUSUpload: (fileId: string): void => {
    if (state.value.tusUploadInstances.has(fileId))
      state.value.tusUploadInstances.delete(fileId)
  },
  // Abort all existing TUS uploads
  abortAllUploads: (): void => {
    const values = Array.from(state.value.tusUploadInstances.values())
    values.forEach((tu: Upload) => tu.abort())
  },
  clearDataUponLogout: (): void => {
    state.value.videoUnEncryptedData.clear()
    state.value.selectedVideo = undefined
    state.value.videos.clear()
    state.value.draftVideos.clear()
  },

  // -------- OLD ACTIONS --------
  selectVideo: (video: Video): void => {
    state.value.selectedVideo = video
  },
  // This is a tracker to notify the rest of the app that something chas changed in the Editor
  // which needs to be saved after 'samtykker'
  setUnsavedChanges: (fileId: string): void => {
    const updates = { hasUnsavedChanges: true }
    const v = getters.videoByID(fileId)
    if (v) v.updateStatus(updates)
  },
  // Create a new draft metadata for the given User and Dataset
  createDraftVideo: (d: VideoSpec): Promise<void> => {
    const deviceStatus = rootGetters['general/deviceStatus']
    const newVideo = new Video({
      dataset: d.dataset,
      user: d.user,
      selection: d.selection,
      deviceStatus,
    })
    actions.addVideo(newVideo)
    actions.selectVideo(newVideo)
    appActions.addDraftId(newVideo.details.id)
    commit('addVideo', updatedVideoMetadata)
    commit('selectVideo', updatedVideoMetadata)
    commit('general/addDraftId', updatedVideoMetadata.fileId, {
      root: true,
    })
    dispatch('estimateStorageRemaining')
    dispatch('general/updateUser', user, { root: true })
    return dispatch('saveDraftMetadata', {
      user,
      setting,
      updatedVideoMetadata,
    }).catch(() => dispatch('errorMessage', 'Save draft video'))
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

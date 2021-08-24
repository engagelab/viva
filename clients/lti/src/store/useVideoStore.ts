//Store to video operations
/**
 *
 TODO:
 1. Route call to mongoDB to fetch own and shared video metadata  for the logged in user
 2. httpsRequest to S3 bucket  fetch the video based on the video metadata
 3. Route call to canvas to  fetch users and roles for the  course ÍD
 4. Action function to play the video (if it is shared video , just play trim part of it )
 5. Action function to store the sharing info  , also  checks number of sharing possible -to check dataset
 6. Action function to retrive access to sharing
 7. Route call to mongoDB to update video metadata
 */

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Video,
  ListItem,
  StatusListItem,
  VideoData,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  VideoSharing,
} from '../types/main'
import { VIDEO_SHARING_MODE } from '@/constants'
import { apiRequest } from '../api/apiRequest'
import { useAppStore } from './useAppStore'
const { getters: appGetters, actions: appActions } = useAppStore()
//State
interface State {
  selectedItem: ListItem | undefined
  selectedVideoURL: string
  videos: Map<string, Video>
}

const state: Ref<State> = ref({
  selectedItem: undefined,
  selectedVideoURL: '',
  videos: new Map<string, Video>(),
})

//----------------- Server side functions----------------//

async function fetchVideoMetadata(): Promise<VideoData[]> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.GET,
    credentials: true,
    route: '/api/videos',
  }
  return apiRequest<VideoData[]>(payload)
}

interface Getters {
  selectedItem: ComputedRef<State['selectedItem']>
  selectedVideoURL: ComputedRef<State['selectedVideoURL']>
  feed: ComputedRef<StatusListItem[]>
  myVideos: ComputedRef<ListItem[]>
  sharedToMe: ComputedRef<ListItem[]>
}
const getters = {
  get selectedItem(): ComputedRef<State['selectedItem']> {
    return computed(() => state.value.selectedItem)
  },
  get selectedVideoURL(): ComputedRef<State['selectedVideoURL']> {
    return computed(() => state.value.selectedVideoURL)
  },
  get feed(): ComputedRef<StatusListItem[]> {
    return computed(() => [])
  },
  get myVideos(): ComputedRef<ListItem[]> {
    return computed(() => {
      const myUserID = appGetters.user.value._id
      const myLTIID = appGetters.user.value.profile.ltiUserId
      const videos = Array.from(state.value.videos.values())
      return videos
        .filter((v) => v.users.owner === myUserID)
        .map(
          (v: Video): ListItem => ({
            mode: VIDEO_SHARING_MODE.myVideos,
            video: v,
            share: undefined,
            videoOwner: appActions.nameAndRole(myLTIID),
          })
        )
    })
  },
  get sharedToMe(): ComputedRef<ListItem[]> {
    return computed(() => {
      const myUserID = appGetters.user.value._id
      const myLTIID = appGetters.user.value.profile.ltiUserId
      const videos = Array.from(state.value.videos.values())
      return videos
        .filter((v: Video) => v.users.owner !== myUserID) // Filter out my own videos
        .map((v) => {
          const sharedToMe: ListItem[] = []
          v.users.sharing
            .filter((s) => s.users.includes(myLTIID)) // Filter out shares that don't include me
            .forEach((s) => {
              sharedToMe.push({
                mode: VIDEO_SHARING_MODE.sharedToMe,
                video: v,
                share: s,
                videoOwner: appActions.nameAndRole(s.creator),
              })
            })
          return sharedToMe
        })
        .flat()
    })
  },
}

interface Actions {
  getVideoMetadata: () => Promise<void>
  selectVideo: (video: ListItem) => void
  selectNoVideo: () => void
  updateMetadata: (video: Video) => Promise<void>
  createShare: (videoID: string) => Promise<void>
  updateShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
  deleteShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
}
const actions = {
  createShare: function (videoID: string): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.POST,
      credentials: true,
      query: { id: videoID },
      route: '/api/video/share',
    }
    return apiRequest<VideoSharing>(payload).then((newShare: VideoSharing) => {
      const v = state.value.videos.get(videoID)
      if (v) v.users.sharing.push(newShare)
    })
  },

  // Update sharing for a selected video
  updateShare: function (
    videoID: string,
    videoSharing: VideoSharing
  ): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      body: videoSharing,
      query: { id: videoID },
      route: '/api/video/share',
    }
    return apiRequest<VideoSharing>(payload).then((s: VideoSharing) => {
      const v = state.value.videos.get(videoID)
      if (v) {
        v.updateSharing([s])
      }
    })
  },

  deleteShare: function (
    videoID: string,
    videoSharing: VideoSharing
  ): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.DELETE,
      credentials: true,
      body: videoSharing,
      query: { id: videoID },
      route: '/api/video/share',
    }
    return apiRequest<VideoSharing>(payload).then(() => {
      const v = state.value.videos.get(videoID)
      if (v) {
        const sIndex = v.users.sharing.findIndex(
          (share) => share._id === videoSharing._id
        )
        if (sIndex >= 0) v.users.sharing.splice(sIndex, 1)
      }
    })
  },

  //Fetch videometadata from mongoDB
  getVideoMetadata: async function (): Promise<void> {
    const response = await fetchVideoMetadata()
    response.forEach((video) => {
      const v = new Video(video)
      state.value.videos.set(v.details.id, v)
    })
    const videos = Array.from(state.value.videos.values())
    console.log(videos)
    return Promise.resolve()
  },

  selectVideo: function (video: ListItem): void {
    if (video) state.value.selectedItem = video
  },

  selectNoVideo: function (): void {
    state.value.selectedItem = undefined
  },

  // Update the video in store with the given video (by fileId) and save to local disk
  updateMetadata: (video: Video): Promise<void> => {
    video.status.hasUnsavedChanges = false
    video.status.hasNewDataAvailable = false
    let videoToUpdate: Video | undefined = undefined
    if (state.value.videos.has(video.details.id))
      videoToUpdate = state.value.videos.get(video.details.id)
    if (videoToUpdate) {
      videoToUpdate.updateFromVideo(video)
      return Promise.resolve()
    } else return Promise.resolve()
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

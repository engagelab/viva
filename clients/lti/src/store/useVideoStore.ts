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

enum PROJECT_NAME {
  viva = 'viva',
}

import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  Video,
  VideoData,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '../types/main'
import { apiRequest } from '../api/apiRequest'
//State
interface State {
  selectedVideo: Video | undefined
  selectedVideoURL: string
  videos: Map<string, Video>
}

const state: Ref<State> = ref({
  project: {
    name: PROJECT_NAME.viva,
  },
  selectedVideo: undefined,
  videos: new Map<string, Video>(),
  selectedVideoURL: '',
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

//Getters
interface Getters {
  videos: ComputedRef<Video[]>
  selectedVideo: ComputedRef<State['selectedVideo']>
  selectedVideoURL: ComputedRef<State['selectedVideoURL']>
}
const getters = {
  get videos(): ComputedRef<Video[]> {
    return computed(() => Array.from(state.value.videos.values()))
  },
  get selectedVideo(): ComputedRef<State['selectedVideo']> {
    return computed(() => state.value.selectedVideo)
  },
  get selectedVideoURL(): ComputedRef<State['selectedVideoURL']> {
    return computed(() => state.value.selectedVideoURL)
  },
}

//Actions
interface Actions {
  getVideoMetadata: () => Promise<void>
  selectVideo: (video: Video) => Promise<void>
  updateMetadata: (video: Video) => Promise<void>
  fetchVideoData: (videoId: string) => Promise<{ url: string }>
}

const actions = {
  // fetch a specific video with draft id
  fetchVideo: async function (videoId: string): Promise<Video> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      credentials: true,
      query: {
        videoref: videoId,
      },
      route: '/api/video',
    }
    return apiRequest<Video>(payload)
  },

  fetchVideoData: async function (videoId: string): Promise<{ url: string }> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      credentials: true,
      query: {
        videoref: videoId,
      },
      route: '/api/videoURL',
    }
    return apiRequest<{ url: string }>(payload)
  },

  //Fetch videometadata from mongoDB
  getVideoMetadata: async function (): Promise<void> {
    const response = await fetchVideoMetadata()
    response.forEach((video) => {
      const v = new Video(video)
      state.value.videos.set(v.details.id, v)
    })
    return Promise.resolve()
  },

  selectVideo: async function (video: Video): Promise<void> {
    // const response = await actions.fetchVideoData(video.details.id)
    state.value.selectedVideo = video
    // state.value.selectedVideoURL = response.url
    return Promise.resolve()
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

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
import { PROJECT_NAME } from '@/constants'
import { ref, Ref, computed, ComputedRef } from 'vue'
import {
  VideoData,
  Video,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '@/types/main'
import { apiRequest } from '../api/apiRequest'
//State
interface State {
  selectedVideo: Video | undefined
  videos: Map<string, Video>
}

const state: Ref<State> = ref({
  project: {
    name: PROJECT_NAME.viva,
  },
  selectedVideo: undefined,
  videos: new Map(),
})

//----------------- Server side functions----------------//

async function fetchVideoMetadata(): Promise<VideoData> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.GET,
    credentials: true,
    route: '/api/videos',
  }
  return apiRequest<VideoData>(payload)
}

//Getters
interface Getters {
  videos: ComputedRef<Video[]>
  selectedVideo: ComputedRef<State['selectedVideo']>
}
const getters = {
  get videos(): ComputedRef<Video[]> {
    return computed(() => Array.from(state.value.videos.values()))
  },
  get selectedVideo(): ComputedRef<State['selectedVideo']> {
    return computed(() => state.value.selectedVideo)
  },
}

//Actions
interface Actions {
  getVideoMetadata: () => Promise<void>
}

const actions = {
  //Fetch videometadata from mongoDB
  getVideoMetadata: async function (): Promise<void> {
    const response = await fetchVideoMetadata()
    const video = new Video(response)
    console.log(video)
    return Promise.resolve()
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

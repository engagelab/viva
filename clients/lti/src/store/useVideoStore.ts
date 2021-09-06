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
  FeedListItem,
  VideoData,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  VideoSharing,
  ListItemShare,
  VideoDetailsData,
} from '../types/main'
import { SORT_BY, VIDEO_DETAIL_MODE } from '@/constants'
import { apiRequest } from '../api/apiRequest'
import { useAppStore } from './useAppStore'
const { getters: appGetters, actions: appActions } = useAppStore()
//State
interface State {
  selectedItem: ListItem | undefined
  selectedItemShare: ListItemShare | undefined
  selectedVideoURL: string
  videos: Map<string, Video>
  detailMode: { mode: VIDEO_DETAIL_MODE; submode: VIDEO_DETAIL_MODE }
}

const state: Ref<State> = ref({
  selectedItem: undefined,
  selectedItemShare: undefined,
  selectedVideoURL: '',
  videos: new Map<string, Video>(),
  detailMode: {
    mode: VIDEO_DETAIL_MODE.none,
    submode: VIDEO_DETAIL_MODE.none,
  },
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
  selectedItemShare: ComputedRef<State['selectedItemShare']>
  selectedVideoURL: ComputedRef<State['selectedVideoURL']>
  feed: ComputedRef<FeedListItem[]>
  myVideos: ComputedRef<ListItem[]>
  sharedToMe: ComputedRef<ListItemShare[]>
  detailMode: ComputedRef<State['detailMode']>
}
const getters = {
  get selectedItem(): ComputedRef<State['selectedItem']> {
    return computed(() => state.value.selectedItem)
  },
  get selectedItemShare(): ComputedRef<State['selectedItemShare']> {
    return computed(() => state.value.selectedItemShare)
  },
  get selectedVideoURL(): ComputedRef<State['selectedVideoURL']> {
    return computed(() => state.value.selectedVideoURL)
  },
  get detailMode(): ComputedRef<State['detailMode']> {
    return computed(() => state.value.detailMode)
  },
  get feed(): ComputedRef<FeedListItem[]> {
    return computed(() => [])
  },
  get myVideos(): ComputedRef<ListItem[]> {
    return computed(() => {
      const myUserID = appGetters.user.value._id
      const myLTIID = appGetters.user.value.profile.ltiID
      const videos = Array.from(state.value.videos.values())
      return videos
        .filter((v) => v.users.owner === myUserID)
        .map(
          (v: Video): ListItem => {
            const item: ListItem = {
              video: v,
              shares: [],
              owner: appActions.nameAndRole(myLTIID),
              dataset: {
                name: v.dataset.name,
                selection: v.dataset.selection.reduce((acc, curr) => {
                  return acc + ' > ' + curr.title
                }, ''),
              },
            }
            v.users.sharing
              .filter((s) => s.creator === myLTIID)
              .forEach((s) => {
                const newShare: ListItemShare = {
                  id: s._id,
                  creator: s.creator,
                  creatorName: appActions.nameAndRole(s.creator),
                  users: s.users.map((u) => appActions.nameAndRole(u)),
                  share: s,
                  item,
                }
                item.shares.push(newShare)
              })
            return item
          }
        )
    })
  },
  get sharedToMe(): ComputedRef<ListItemShare[]> {
    return computed(() => {
      const myUserID = appGetters.user.value._id
      const myLTIID = appGetters.user.value.profile.ltiID
      const videos = Array.from(state.value.videos.values())
      const sharedWithMe: ListItemShare[] = []
      videos.forEach((v) => {
        v.users.sharing
          .filter((s) => s.creator !== myUserID && s.users.includes(myLTIID)) // Filter for shares that include me, but aren't created by me
          .forEach((s) => {
            sharedWithMe.push({
              id: s._id,
              creator: s.creator,
              creatorName: appActions.nameAndRole(s.creator),
              users: s.users.map((u) => appActions.nameAndRole(u)),
              share: s,
              item: {
                video: v,
                owner: appActions.nameAndRole(s.creator),
                shares: [],
                dataset: {
                  name: v.dataset.name,
                  selection: v.dataset.selection.reduce((acc, curr) => {
                    return acc + ' > ' + curr.title
                  }, ''),
                },
              },
            })
          })
      })
      return sharedWithMe
    })
  },
}

interface Actions {
  getVideoMetadata: () => Promise<void>
  selectOriginal: (video: ListItem) => void
  selectShare: (share: ListItemShare) => void
  deleteOriginal: (videoID: string) => Promise<void>
  selectNoOriginal: () => void
  selectNoShare: () => void
  detailMode: (mode: VIDEO_DETAIL_MODE, submode: VIDEO_DETAIL_MODE) => void
  updateLocalVideo: (video: Video) => Promise<void>
  updateVideoDetails: (id: string, details: VideoDetailsData) => Promise<void>
  createShare: (listItem: ListItem) => Promise<void>
  updateShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
  deleteShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
  sortVideos: (mode: string) => Promise<void>
}
const actions = {
  detailMode: function (
    mode: VIDEO_DETAIL_MODE,
    submode: VIDEO_DETAIL_MODE
  ): void {
    state.value.detailMode.mode = mode
    state.value.detailMode.submode = submode
  },
  createShare: function (listItem: ListItem): Promise<void> {
    const videoID = listItem.video.details.id
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.POST,
      credentials: true,
      query: { id: videoID },
      route: '/api/video/share',
    }
    return apiRequest<VideoSharing>(payload).then((newShare: VideoSharing) => {
      const v = state.value.videos.get(videoID)
      if (v) {
        const share: ListItemShare = {
          id: newShare._id,
          creator: newShare.creator,
          creatorName: appActions.nameAndRole(newShare.creator),
          users: newShare.users.map((u) => appActions.nameAndRole(u)),
          share: newShare,
          item: listItem,
        }
        state.value.selectedItemShare = share
        v.users.sharing.push(newShare)
      }
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

  deleteOriginal: function (videoID: string): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.DELETE,
      credentials: true,
      query: { id: videoID },
      route: '/api/video',
    }
    return apiRequest<void>(payload).then(() => {
      state.value.videos.delete(videoID)
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
    return Promise.resolve()
  },

  selectOriginal: function (video: ListItem): void {
    // const videos = Array.from(state.value.videos.values())
    return Promise.resolve()
  },

  sortVideos: async (mode: string) => {
    if (mode) {
      const videos = Array.from(state.value.videos.values())
      state.value.videos = new Map<string, Video>()
      if (videos && videos.length > 0) {
        videos
          .sort((v1, v2) => {
            if (mode == SORT_BY.dataset)
              return v1.dataset.name.localeCompare(v2.dataset.name)
            else if (mode == SORT_BY.date)
              return v1.details.created.getTime() - v2.details.created.getTime()
            else if (mode == SORT_BY.selection) {
              const s1 = v1.dataset.selection.reduce((acc, curr) => {
                return acc + ' > ' + curr.title
              }, '')
              const s2 = v2.dataset.selection.reduce((acc, curr) => {
                return acc + ' > ' + curr.title
              }, '')

              return s1.localeCompare(s2)
            }
            return 0
          })
          .forEach((video: Video) => {
            state.value.videos.set(video.details.id, video)
          })
      }
    }
  },

  selectVideo: function (video: ListItem): void {
    if (video) state.value.selectedItem = video
  },
  selectShare: function (share: ListItemShare): void {
    if (share) {
      state.value.selectedItemShare = share
      state.value.selectedItem = share.item
    }
  },

  selectNoOriginal: function (): void {
    state.value.selectedItem = undefined
  },
  selectNoShare: function (): void {
    state.value.selectedItemShare = undefined
  },

  // Update the video in store with the given video (by fileId) and save to local disk
  updateLocalVideo: (video: Video): Promise<void> => {
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

  updateVideoDetails: function (
    id: string, // should be video.details.id
    details: VideoDetailsData
  ): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      body: details,
      query: { id },
      route: '/api/video/details',
    }
    return apiRequest<VideoDetailsData>(payload).then((d: VideoDetailsData) => {
      const v = state.value.videos.get(id)
      if (v) {
        v.updateDetails(d)
      }
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

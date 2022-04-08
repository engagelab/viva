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
  VideoSharingData,
  VideoDetailsData,
  Annotation,
  AnnotationComment,
  ShareComment,
} from '../types/main'
import { SORT_BY, VIDEO_DETAIL_MODE, VIDEO_SHARING_MODE } from '@/constants'
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
  sortMode: { [key in VIDEO_SHARING_MODE]: SORT_BY }
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
  sortMode: {
    [VIDEO_SHARING_MODE.myVideos]: SORT_BY.date,
    [VIDEO_SHARING_MODE.sharedToMe]: SORT_BY.date,
    [VIDEO_SHARING_MODE.feed]: SORT_BY.date,
  },
})

//----------------- Server side functions----------------//

async function fetchVideoMetadata(): Promise<VideoData[]> {
  const payload: APIRequestPayload = {
    method: XHR_REQUEST_TYPE.GET,
    credentials: true,
    route: '/api/videos/share',
  }
  return apiRequest<VideoData[]>(payload)
}

// Returns a custom compare function for array.sort, based on given mode
function sortVideos(mode: VIDEO_SHARING_MODE) {
  return (l1: ListItem | ListItemShare, l2: ListItem | ListItemShare) => {
    const sortBy: SORT_BY = state.value.sortMode[mode]
    // Comparisons are different depending on which list we are viewing
    if (mode === VIDEO_SHARING_MODE.myVideos) {
      const ll1 = l1 as ListItem
      const ll2 = l2 as ListItem
      if (sortBy === SORT_BY.dataset)
        return ll1.dataset.name.localeCompare(ll2.dataset.name)
      else if (sortBy === SORT_BY.date)
        // In Javascript Dates can be compared directly but in Typescript must be cast first
        return (
          Number(ll1.video.details.created) - Number(ll2.video.details.created)
        )
      else if (sortBy === SORT_BY.selection) {
        // Selection is already present as a string
        return ll1.dataset.selection.localeCompare(ll2.dataset.selection)
      } else return 0
    } else {
      const ll1 = l1 as ListItemShare
      const ll2 = l2 as ListItemShare
      if (sortBy === SORT_BY.dataset)
        return ll1.item.dataset.name.localeCompare(ll2.item.dataset.name)
      else if (sortBy === SORT_BY.date)
        // Comparison should be on Share creation, not Video creation
        return Number(ll1.share.created) - Number(ll2.share.created)
      else if (sortBy === SORT_BY.selection) {
        return ll1.item.dataset.selection.localeCompare(
          ll2.item.dataset.selection
        )
      } else return 0
    }
  }
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
        .sort(sortVideos(VIDEO_SHARING_MODE.myVideos))
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
      return sharedWithMe.sort(sortVideos(VIDEO_SHARING_MODE.sharedToMe))
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
  selectNone: () => void
  updateLocalVideo: (video: Video) => Promise<void>
  updateVideoDetails: (id: string, details: VideoDetailsData) => Promise<void>
  createShare: (listItem: ListItem) => Promise<void>
  updateShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
  deleteShare: (videoID: string, videoSharing: VideoSharing) => Promise<void>
  sortVideosBy: (mode: VIDEO_SHARING_MODE, sortby: SORT_BY) => void

  createAnnotation: (
    listItemShare: ListItemShare,
    annotation: Annotation
  ) => Promise<void>

  updateAnnotation: (
    listItemShare: ListItemShare,
    annotation: Annotation
  ) => Promise<void>

  deleteAnnotation: (
    listItemShare: ListItemShare,
    annotation: Annotation
  ) => Promise<void>

  createAnnotationComment: (
    listItemShare: ListItemShare,
    annotation: Annotation,
    comment: AnnotationComment
  ) => Promise<void>

  createComment: (
    listItemShare: ListItemShare,
    comment: ShareComment
  ) => Promise<void>
}
const actions = {
  detailMode: function (
    mode: VIDEO_DETAIL_MODE,
    submode: VIDEO_DETAIL_MODE
  ): void {
    state.value.detailMode.mode = mode
    state.value.detailMode.submode = submode
  },
  selectNone(): void {
    const { mode, submode } = state.value.detailMode
    switch (mode) {
      case VIDEO_DETAIL_MODE.annotate:
      case VIDEO_DETAIL_MODE.play:
        state.value.detailMode.mode = VIDEO_DETAIL_MODE.none
        state.value.detailMode.submode = VIDEO_DETAIL_MODE.none
        actions.selectNoOriginal()
        actions.selectNoShare()
        break
      case VIDEO_DETAIL_MODE.share:
        if (
          submode === VIDEO_DETAIL_MODE.play ||
          submode === VIDEO_DETAIL_MODE.trim
        )
          actions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
        else {
          actions.detailMode(VIDEO_DETAIL_MODE.none, VIDEO_DETAIL_MODE.none)
          actions.selectNoShare()
        }
        break
      default:
        break
    }
  },
  createShare: function (listItem: ListItem): Promise<void> {
    const videoID = listItem.video.details.id
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.POST,
      credentials: true,
      query: { id: videoID },
      route: '/api/video/share',
    }
    return apiRequest<VideoSharingData>(payload).then(
      (newShareData: VideoSharingData) => {
        const newShare: VideoSharing = new VideoSharing().updateFromShare(
          newShareData
        )
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
      }
    )
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

  /******************SERVER calls for CRUD in annotations ********** */
  createAnnotation: function (
    listItemShare: ListItemShare,
    annotation: Annotation
  ): Promise<void> {
    const videoID = listItemShare.item.video.details.id
    const shareID = listItemShare.share._id

    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.POST,
      credentials: true,
      body: annotation,
      query: { videoID, shareID },
      route: '/api/video/share/annotation',
    }
    // Server will return the created Annotation with an _id
    return apiRequest<Annotation>(payload).then((newAnnotation: Annotation) => {
      newAnnotation.nowActive = false
      const v = state.value.videos.get(videoID)
      if (v) {
        const share = v.users.sharing.find((s) => s._id === shareID)
        if (share) share.annotations.push(newAnnotation)
      }
    })
  },

  updateAnnotation: function (
    listItemShare: ListItemShare,
    annotation: Annotation
  ): Promise<void> {
    const videoID = listItemShare.item.video.details.id
    const shareID = listItemShare.share._id
    const annotationID = annotation._id || ''

    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      body: annotation,
      query: { videoID, shareID, annotationID },
      route: '/api/video/share/annotation',
    }
    return apiRequest<void>(payload).then(() => {
      const v = state.value.videos.get(videoID)
      if (v) v.updateAnnotation(listItemShare.share, annotation)
    })
  },

  deleteAnnotation: function (
    listItemShare: ListItemShare,
    annotation: Annotation
  ): Promise<void> {
    const videoID = listItemShare.item.video.details.id
    const shareID = listItemShare.share._id
    const annotationID = annotation._id || ''

    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.DELETE,
      credentials: true,
      query: { videoID, shareID, annotationID },
      route: '/api/video/share/annotation',
    }

    return apiRequest<void>(payload).then(() => {
      const v = state.value.videos.get(videoID)
      if (v) {
        const share = v.users.sharing.find((s) => s._id == shareID)
        if (share) {
          const aIndex = share.annotations.findIndex(
            (a) => a._id === annotationID
          )
          if (aIndex >= 0) share.annotations.splice(aIndex, 1)
        }
      }
    })
  },

  createAnnotationComment: function (
    listItemShare: ListItemShare,
    annotation: Annotation,
    comment: AnnotationComment
  ): Promise<void> {
    const videoID = listItemShare.item.video.details.id
    const shareID = listItemShare.share._id
    const annotationID = annotation._id || ''

    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      body: comment,
      query: { videoID, shareID, annotationID },
      route: '/api/video/share/annotation/comment',
    }
    return apiRequest<void>(payload).then(() => {
      const v = state.value.videos.get(videoID)
      if (v) v.updateAnnotation(listItemShare.share, annotation)
    })
  },

  createComment: function (
    listItemShare: ListItemShare,
    comment: ShareComment
  ): Promise<void> {
    const videoID = listItemShare.item.video.details.id
    const shareID = listItemShare.share._id

    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      credentials: true,
      body: comment,
      query: { videoID, shareID },
      route: '/api/video/share/comment',
    }
    return apiRequest<VideoSharingData>(payload).then(
      (vsd: VideoSharingData) => {
        const v = state.value.videos.get(videoID)
        if (v) v.updateSharing([vsd])
      }
    )
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

  sortVideosBy: (mode: VIDEO_SHARING_MODE, sortby: SORT_BY) => {
    state.value.sortMode[mode] = sortby
  },

  selectOriginal: function (video: ListItem): void {
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

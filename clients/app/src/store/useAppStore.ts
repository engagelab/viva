import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '../api/apiRequest'
import {
  User,
  DeviceStatus,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '../types/main'
import { useDeviceService, CordovaPathName } from './useDevice'

import { useVideoStore } from './useVideoStore'
import { useDatasetStore } from './useDatasetStore'
import { useNotifyStore } from './useNotifyStore'
const { actions: notifyActions } = useNotifyStore()
const { actions: deviceActions } = useDeviceService()
const { actions: videoActions } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
import { appVersion } from '../constants'

// ------------  Types --------------
interface ServerStatus {
  cpuload: Record<string, unknown>
}
export interface AppState {
  selectedUser: User
  hostType: string
  isLoggedIn: boolean
  isAuthorised: boolean
  useCordova: boolean
  appIsOld: boolean
  deviceStatus: DeviceStatus
  serverStatus: ServerStatus
  cordovaPath: string[]
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
  selectedUser: new User(),
  hostType: 'tablet',
  isLoggedIn: false,
  isAuthorised: false,
  useCordova: false,
  cordovaPath: [],
  appIsOld: false,
  deviceStatus: {
    mobile: false,
    browser: '',
    isFullScreen: false,
    lastActive: new Date().getTime(), // ms from epoch
  },
  serverStatus: {
    cpuload: {},
  },
})

// ------------  Getters (Read only) --------------
interface Getters {
  hostType: ComputedRef<string>
  lastActive: ComputedRef<number>
  isLoggedIn: ComputedRef<boolean>
  isAuthorised: ComputedRef<boolean>
  useCordova: ComputedRef<boolean>
  appIsOld: ComputedRef<boolean>
  isFullScreen: ComputedRef<boolean>
  deviceStatus: ComputedRef<DeviceStatus>
  serverStatus: ComputedRef<ServerStatus>
  user: ComputedRef<User>
}
const getters = {
  get hostType(): ComputedRef<string> {
    return computed(() => _appState.value.hostType)
  },
  get lastActive(): ComputedRef<number> {
    return computed(() => _appState.value.deviceStatus.lastActive)
  },
  get isLoggedIn(): ComputedRef<boolean> {
    return computed(() => _appState.value.isLoggedIn)
  },
  get isAuthorised(): ComputedRef<boolean> {
    return computed(() => _appState.value.isAuthorised)
  },
  get useCordova(): ComputedRef<boolean> {
    return computed(() => _appState.value.useCordova)
  },
  get appIsOld(): ComputedRef<boolean> {
    return computed(() => _appState.value.appIsOld)
  },
  get isFullScreen(): ComputedRef<boolean> {
    return computed(() => _appState.value.deviceStatus.isFullScreen)
  },
  get deviceStatus(): ComputedRef<DeviceStatus> {
    return computed(() => _appState.value.deviceStatus)
  },
  get serverStatus(): ComputedRef<ServerStatus> {
    return computed(() => _appState.value.serverStatus)
  },
  get user(): ComputedRef<User> {
    return computed(() => _appState.value.selectedUser)
  },
}
// ------------  Actions --------------
interface Actions {
  setFullScreen: (value: boolean) => void
  setUseCordova: (value: boolean) => void
  activeNow: () => void
  addDraftIdToUser: (fileID: string) => void
  removeDraftId: (fileID: string) => void
  detectDevice: () => void
  detectAppVersion: () => void
  logout: () => void
  updateUserAtServer: (user: User | void) => Promise<void>
  redirectedLogin: () => Promise<void>
  getLoginSession: () => Promise<void>
  tokenLogin: () => Promise<boolean>
  setCordovaPath: (path: string[]) => void
}
const actions = {
  setFullScreen(value: boolean): void {
    _appState.value.deviceStatus.isFullScreen = value
  },
  setUseCordova(value: boolean): void {
    _appState.value.useCordova = value
  },
  activeNow(): void {
    _appState.value.deviceStatus.lastActive = new Date().getTime()
  },
  addDraftIdToUser(fileID: string): void {
    if (_appState.value.selectedUser)
      _appState.value.selectedUser.videos.draftIDs.push(fileID)
  },
  removeDraftId(fileID: string): void {
    if (_appState.value.selectedUser) {
      const vs = _appState.value.selectedUser.videos
      const i = vs.draftIDs.indexOf(fileID)
      if (i > -1) {
        vs.removedDraftIDs.push(vs.draftIDs[i])
        vs.draftIDs.splice(i, 1)
      }
    }
  },
  detectDevice(): void {
    const ua = navigator.userAgent
    console.log(ua)
    const deviceStatus = {
      mobile: ua.indexOf('Mobi') !== -1,
      browser:
        ua.indexOf('Chrome') !== -1 && ua.indexOf('Safari') !== -1
          ? 'Chrome'
          : 'Safari',
    }
    _appState.value.deviceStatus.mobile = deviceStatus.mobile
    _appState.value.deviceStatus.browser = deviceStatus.browser
  },
  detectAppVersion(): void {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/appversion',
    }
    apiRequest<{ version: string }>(payload).then((result) => {
      if (appVersion !== result.version) {
        _appState.value.appIsOld = true
        notifyActions.setSnackbar({
          visibility: true,
          text: 'Viva appen er en eldre versjon, og du må laste ned en ny versjon fra Appstore',
          callback: undefined,
          type: 'message',
        })
      }
    })
  },
  logout(): void {
    _appState.value.isLoggedIn = false
    _appState.value.isAuthorised = false
    videoActions.clearDataUponLogout()
    videoActions.abortAllUploads()
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/auth/logout',
    }
    apiRequest(payload)
      .then(() => {
        localStorage.removeItem('jwt')
        router.push('/login?page=0')
      })
      .catch((error: Error) => console.log(error))
  },
  // Used by mobile app to exchange token for session.
  // Token is attached inside communication.js
  // Token is only used if session is not available
  getLoginSession(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/auth/token',
      credentials: true,
    }
    return apiRequest<void>(payload).catch((error: Error) => {
      console.log(error)
      this.logout()
    })
  },
  // Called after successful login to retieve user and mark as 'logged in'
  redirectedLogin(): Promise<void> {
    const completeLogin = () => {
      const payload: APIRequestPayload = {
        method: XHR_REQUEST_TYPE.GET,
        route: '/api/user',
        credentials: true,
      }
      return apiRequest<User>(payload)
        .then((response: User) => {
          if (response) {
            const user: User = new User(response)
            _appState.value.isLoggedIn = true
            _appState.value.isAuthorised = true

            actions.activeNow()
            _appState.value.selectedUser = user
            actions.setCordovaPath([CordovaPathName.users, user._id])
            deviceActions.setCordovaPath([CordovaPathName.users, user._id])
            videoActions.setCordovaPath([CordovaPathName.users, user._id])
            datasetActions.setPresetDatasetConfig(user.datasetConfig)
          } else {
            notifyActions.errorMessage('User not found')
            actions.logout()
          }
        })
        .catch((error: Error) => {
          return notifyActions.errorMessage(error)
        })
    }
    return completeLogin()
  },
  updateUserAtServer(user: User | void): Promise<void> {
    const u = user || _appState.value.selectedUser
    if (u) {
      const payload: APIRequestPayload = {
        method: XHR_REQUEST_TYPE.PUT,
        route: '/api/user',
        credentials: true,
        body: u,
      }
      if (datasetGetters.presetDatasetConfig.value)
        u.datasetConfig = datasetGetters.presetDatasetConfig.value
      return apiRequest<User>(payload)
        .then((su: User) => {
          _appState.value.selectedUser = new User(su)
          return Promise.resolve()
        })
        .catch((error: Error) => {
          notifyActions.errorMessage(error)
        })
    } else return Promise.resolve()
  },

  // Try to exchange token for a session if the token already exists
  tokenLogin: function (): Promise<boolean> {
    return apiRequest({
      route: '/auth/token',
      method: XHR_REQUEST_TYPE.GET,
      credentials: true,
    })
      .then(() => {
        // We now have an active session so proceed as normal..
        router.push('/postlogin')
        return Promise.resolve(true)
      })
      .catch(() => {
        // Exchange was not accepted, clear the token and redirect to login page
        console.log('No valid token. Redirecting to login page..')
        return Promise.resolve(false)
      })
  },
  setCordovaPath: (path: string[]): void => {
    _appState.value.cordovaPath = path
  },
}
// This defines the interface used externally
interface ServiceInterface {
  actions: Actions
  getters: Getters
}
export function useAppStore(): ServiceInterface {
  return {
    getters,
    actions,
  }
}

export type AppStoreType = ReturnType<typeof useAppStore>

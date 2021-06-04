import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '@/api/apiRequest'
import {
  User,
  UserData,
  DeviceStatus,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  Callback,
} from '../types/main'
import { useDeviceService, CordovaPathName } from './useDevice'

import { useVideoStore } from './useVideoStore'
import { useDatasetStore } from './useDatasetStore'
const { actions: deviceActions } = useDeviceService()
const { actions: videoActions } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
import { appVersion } from '../constants'

// ------------  Types --------------
interface Dialog {
  visible: boolean
  data: Record<string, unknown>
  doneCallback: Callback
}
interface ServerStatus {
  cpuload: Record<string, unknown>
}
interface Snackbar {
  visibility: boolean // A toggle for showing error messages to the user
  text: string
  callback: Callback
}
export interface AppState {
  selectedUser: User
  hostType: string
  isLoggedIn: boolean
  isAuthorised: boolean
  useCordova: boolean
  appIsOld: boolean
  dialog: Dialog
  deviceStatus: DeviceStatus
  serverStatus: ServerStatus
  snackbar: Snackbar
  cordovaPath: string[]
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
  selectedUser: User | undefined,
  hostType: 'tablet',
  isLoggedIn: false,
  isAuthorised: false,
  useCordova: false,
  cordovaPath: [],
  appIsOld: false,
  dialog: {
    visible: false,
    data: undefined, // Data object to pass to the child dialog
    doneCallback: undefined, // Callback function from the originating component
  },
  deviceStatus: {
    mobile: false,
    browser: '',
    isFullScreen: false,
    lastActive: new Date().getTime(), // ms from epoch
  },
  serverStatus: {
    cpuload: {},
  },
  snackbar: {
    visibility: false, // A toggle for showing error messages to the user
    text: '',
    callback: undefined,
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
  dialog: ComputedRef<Dialog>
  snackbar: ComputedRef<Snackbar>
  deviceStatus: ComputedRef<DeviceStatus>
  serverStatus: ComputedRef<ServerStatus>
  user: ComputedRef<User>
}
const getters = {
  get hostType(): ComputedRef<string> {
    return computed(() => _appState.value.hostType)
  },
  get lastActive(): ComputedRef<number> {
    return computed(() => _appState.value.lastActive)
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
  get dialog(): ComputedRef<Dialog> {
    return computed(() => _appState.value.dialog)
  },
  get snackbar(): ComputedRef<Snackbar> {
    return computed(() => _appState.value.snackbar)
  },
  get deviceStatus(): ComputedRef<DeviceStatus> {
    return computed(() => _appState.value.deviceStatus)
  },
  get serverStatus(): ComputedRef<ServerStatus> {
    return computed(() => _appState.value.serverStatus)
  },
  get user(): ComputedRef<User> {
    return computed(() => _appState.value.user)
  },
}
// ------------  Actions --------------
interface Actions {
  setFullScreen: (value: boolean) => void
  activeNow: () => void
  addDraftIdToUser: (fileID) => void
  removeDraftId: (fileID) => void
  setDialog: (dialog: Dialog) => void
  setSnackbar: (message: string) => void
  errorMessage: (message: Error | string) => void
  detectDevice: () => void
  detectAppVersion: (fade: boolean) => void
  logout: () => void
  updateUserAtServer: (user: User | void) => Promise<void>
  redirectedLogin: () => Promise<void>
  getLoginSession: () => Promise<void>
  tokenLogin: () => Promise<boolean>
  detectOldApp: () => Promise<void>
  setCordovaPath: (path: string[]) => void
}
const actions = {
  setFullScreen(value: boolean): void {
    _appState.value.deviceStatus.isFullScreen = value
  },
  activeNow(): void {
    _appState.value.deviceStatus.lastActive = new Date().getTime()
  },
  addDraftIdToUser(fileID): void {
    _appState.value.selectedUser.videos.draftIDs.push(fileID)
  },
  removeDraftId(fileID): void {
    const i = _appState.value.selectedUser.videos.draftIDs.indexOf(fileID)
    if (i > -1) {
      _appState.value.selectedUser.videos.removedDraftIDs.push(
        _appState.value.selectedUser.videos.draftIDs[i]
      )
      _appState.value.selectedUser.videos.draftIDs.splice(i, 1)
    }
  },
  setDialog(dialog: Dialog): void {
    _appState.value.dialog = dialog
  },
  setSnackbar(message: string): void {
    _appState.value.snackbar = {
      visibility: true,
      text: message,
      callback: undefined,
    }
  },
  errorMessage(error: Error | string): void {
    let errorMessage: string = error.message || (error as string)
    errorMessage += error.code ? ` Code: ${error.code}` : ''
    console.log(`Error: ${errorMessage}`)
    if (errorMessage == 'Invalid login') {
      this.logout()
      window.setTimeout(() => {
        this.setSnackbar({
          visibility: true,
          text: errorMessage + '. Vennligst logg inn igjen',
          type: 'error',
          callback: undefined,
        })
      }, 2000)
    }
    this.setSnackbar({
      visibility: true,
      text: errorMessage,
      type: 'error',
      callback: undefined,
    })
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
      contentType: 'text/html',
    }
    apiRequest(payload).then((version) => {
      if (appVersion !== version) {
        _appState.value.appIsOld = true
        this.setSnackbar({
          visibility: true,
          text: 'Viva appen er en eldre versjon, og du må laste ned en ny versjon fra Appstore',
          callback: undefined,
        })
      }
    })
  },
  logout(): void {
    _appState.value.selectedUser = undefined
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
        router.push('/logout')
      })
      .catch((err) => console.log(err))
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
    return apiRequest(payload).catch((error) => {
      console.log(error)
      this.logout()
    })
  },
  // Called after successful login to retieve user and mark as 'logged in'
  redirectedLogin(): Promise<void> {
    const errorOnLogin = (error) => {
      this.setSnackbar({
        visibility: true,
        text: error,
        callback: undefined,
      })
      this.logout()
    }

    const completeLogin = () => {
      const payload: APIRequestPayload = {
        method: XHR_REQUEST_TYPE.GET,
        route: '/api/user',
        credentials: true,
      }
      return apiRequest<UserData>(payload)
        .then((response: UserData) => {
          const user: User = response ? new User(response.user) : undefined
          if (user) {
            _appState.value.isLoggedIn = true
            _appState.value.isAuthorised = true

            this.activeNow()
            this.selectUser(user)
            this.setCordovaPath([CordovaPathName.users, user._id])
            deviceActions.setCordovaPath([CordovaPathName.users, user._id])
            videoActions.setCordovaPath([CordovaPathName.users, user._id])
            datasetActions.setPresetDatasett(user.datasett.id)
          } else {
            return errorOnLogin('User not found')
          }
        })
        .catch((error) => {
          return errorOnLogin(error)
        })
    }
    return completeLogin()
  },
  updateUserAtServer(user: User | void): Promise<void> {
    const u: User = user || _appState.value.selectedUser
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      route: '/api/user',
      credentials: true,
      body: u,
    }
    u.datasett = datasetGetters.presetDatasett
    return apiRequest(payload)
      .then((u) => (_appState.value.selectedUser = u))
      .catch((error) => {
        this.errorMessage(error)
      })
  },

  // Call server for the current version of the app
  detectOldApp: async function (): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      credentials: false,
      route: '/api/appversion',
      contentType: 'text/html',
    }
    let version = ''
    try {
      version = await apiRequest<string>(payload)
    } catch (error) {
      console.log(`Error getting server version: ${error.toString()}`)
    }
    if (appVersion !== version) {
      _appState.value.appIsOld = true
    }
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
        router.push('/login')
        return Promise.resolve(true)
      })
      .catch(() => {
        // Exchange was not accepted, clear the token and redirect to login page
        console.log('No valid token. Redirecting to login page..')
        _appState.value.currentLocalUser = undefined
        return Promise.resolve(false)
      })
  },
  setCordovaPath: (path: string[]): void => {
    state.value.cordovaPath = path
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

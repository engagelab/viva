import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '../api/apiRequest'
import {
  User,
  DeviceStatus,
  LocalUser,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  Callback,
  UserRecordingInProcess,
} from '../types/main'

import { useVideoStore } from './useVideoStore'
const { actions: videoActions } = useVideoStore()

// ------------  Types --------------
interface Dialog {
  visible: boolean
  data: Record<string, unknown>
  doneCallback: (d: boolean) => void
}
interface Snackbar {
  type: string
  visibility: boolean // A toggle for showing error messages to the user
  text: string
  callback?: Callback
}
export interface AppState {
  validToken: boolean
  errorMessage: string
  loading: boolean
  isLoggedIn: boolean
  selectedUser: User
  canvasData: Record<string, string>
  isAuthorised: boolean
  fade: boolean
  lastLogin: Date
  currentLocalUser: LocalUser | undefined
  appIsOld: boolean
  dialog: Dialog
  disableDelays: boolean
  snackbar: Snackbar
  deviceStatus: DeviceStatus
  userRecordingsInProcess: UserRecordingInProcess[]
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
  //
  validToken: false,
  errorMessage: '',
  loading: false,
  isLoggedIn: false,
  selectedUser: new User(),
  canvasData: {},
  isAuthorised: false,
  fade: false,
  lastLogin: new Date(),
  currentLocalUser: undefined,
  appIsOld: false,
  disableDelays: process.env.VUE_APP_DISABLE_DELAYS === 'true',
  dialog: {
    visible: false,
    data: {},
    doneCallback: () => ({}),
  },
  deviceStatus: {
    // mobile: false,
    // browser: '',
    // isFullScreen: false,
    lastActive: new Date().getTime(), // ms from epoch
  },
  // serverStatus: {
  //   cpuload: {},
  // },
  snackbar: {
    visibility: false, // A toggle for showing error messages to the user
    type: 'none',
    text: '',
  },
  userRecordingsInProcess: [],
})

// ------------  Getters (Read only) --------------
interface Getters {
  // hostType: ComputedRef<string>
  lastActive: ComputedRef<number>
  isLoggedIn: ComputedRef<boolean>
  isAuthorised: ComputedRef<boolean>
  dialog: ComputedRef<Dialog>
  snackbar: ComputedRef<Snackbar>
  user: ComputedRef<AppState['selectedUser']>
  usersDrafts: ComputedRef<UserRecordingInProcess[]>
}
const getters = {
  get lastActive(): ComputedRef<number> {
    return computed(() => _appState.value.deviceStatus.lastActive)
  },
  get isLoggedIn(): ComputedRef<boolean> {
    return computed(() => _appState.value.isLoggedIn)
  },
  get isAuthorised(): ComputedRef<boolean> {
    return computed(() => _appState.value.isAuthorised)
  },
  get dialog(): ComputedRef<Dialog> {
    return computed(() => _appState.value.dialog)
  },
  get snackbar(): ComputedRef<Snackbar> {
    return computed(() => _appState.value.snackbar)
  },
  get user(): ComputedRef<AppState['selectedUser']> {
    return computed(() => _appState.value.selectedUser)
  },
  get usersDrafts(): ComputedRef<UserRecordingInProcess[]> {
    return computed(() => _appState.value.userRecordingsInProcess)
  },
}
// ------------  Actions --------------
interface Actions {
  activeNow: () => void
  addDraftIdToUser: (fileID: string) => void
  removeDraftId: (fileID: string) => void
  setDialog: (dialog: Dialog) => void
  setSnackbar: (newSnackbar: Snackbar) => void
  errorMessage: (message: Error | string) => void
  logout: () => void
  updateUserAtServer: (user: User | void) => Promise<void>
  redirectedLogin: () => Promise<void>
  getLoginSession: () => Promise<void>
  tokenLogin: () => Promise<boolean>
  fetchLTIData: () => Promise<void>
  getUsersDrafts: () => Promise<void>
}
const actions = {
  fetchLTIData(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/users',
      credentials: true,
    }
    return apiRequest<Record<string, string>>(payload)
      .then((response: Record<string, string>) => {
        if (response) {
          _appState.value.canvasData = response
          console.dir(response)
        }
      })
      .catch((error: Error) => {
        console.log(error)
      })
  },
  // setFullScreen(value: boolean): void {
  //   _appState.value.deviceStatus.isFullScreen = value
  // },
  // setUseCordova(value: boolean): void {
  //   _appState.value.useCordova = value
  // },
  activeNow(): void {
    _appState.value.deviceStatus.lastActive = new Date().getTime()
  },
  addDraftIdToUser(fileID: string): void {
    if (_appState.value.selectedUser)
      _appState.value.selectedUser.videos.draftIDs.push(fileID)
  },
  removeDraftId(fileID: string): void {
    if (_appState.value.selectedUser) {
      const i = _appState.value.selectedUser.videos.draftIDs.indexOf(fileID)
      if (i > -1) {
        _appState.value.selectedUser.videos.removedDraftIDs.push(
          _appState.value.selectedUser.videos.draftIDs[i]
        )
        _appState.value.selectedUser.videos.draftIDs.splice(i, 1)
      }
    }
  },
  setDialog(dialog: Dialog): void {
    _appState.value.dialog = dialog
  },
  setSnackbar(newSnackbar: Snackbar): void {
    _appState.value.snackbar = newSnackbar
  },
  errorMessage(error: Error | string): void {
    let errorMessage = ''
    if (typeof error === 'string') errorMessage = error
    else errorMessage = error.message
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
        router.push('/logout')
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
          } else {
            actions.errorMessage('User not found')
            actions.logout()
          }
        })
        .catch((error: Error) => {
          return actions.errorMessage(error)
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
      return apiRequest<User>(payload)
        .then((su: User) => {
          _appState.value.selectedUser = su
          return Promise.resolve()
        })
        .catch((error: Error) => {
          actions.errorMessage(error)
        })
    } else return Promise.resolve()
  },
  getUsersDrafts(): Promise<void> {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/users/drafts',
      credentials: true,
    }
    return apiRequest<User[]>(payload)
      .then((usersDrafts) => {
        _appState.value.userRecordingsInProcess = usersDrafts.map((u) => ({
          name: u.profile.username,
          videos: u.videos.draftIDs,
        }))
        return Promise.resolve()
      })
      .catch((error: Error) => {
        actions.errorMessage(error)
        return Promise.reject(error)
      })
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
        return Promise.resolve(false)
      })
  },
  // setCordovaPath: (path: string[]): void => {
  //   _appState.value.cordovaPath = path
  // },
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

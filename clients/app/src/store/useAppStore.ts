import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '@/api/apiRequest'
import {
  PersistedAppState,
  LocalUser,
  User,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '@/types/main'

import { useVideoStore } from './useVideoStore'
import { useDatasetStore } from './useDatasetStore'
const { getters: videoGetters, actions: videoActions } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
import { appVersion } from '../constants'

// ------------  Types --------------
interface Dialog {
  visible: boolean
  data: Record<string, unknown>
  doneCallback: () => ()
}
interface DeviceStatus {
  mobile: boolean
  browser: string
  isFullScreen: boolean
  lastActive: number, // ms from epoch
}
interface ServerStatus {
  cpuload: Record<string, unknown>
}
interface Snackbar {
  visibility: boolean, // A toggle for showing error messages to the user
  text: string,
  callback: () => (),
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
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
    selectedUser: undefined,
    hostType: 'tablet',
    isLoggedIn: false,
    isAuthorised: false,
    useCordova: false,
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
    }
})

// This will be saved to device storage
const _persistedAppState: Ref<PersistedAppState> = ref({
  localUsers: {},
})

// ------------  Getters (Read only) --------------
interface Getters {
  hostType: ComputedRef<string>
  lastActive: ComputedRef<number>,
  isLoggedIn: ComputedRef<boolean>
  isAuthorised: ComputedRef<boolean>
  useCordova: ComputedRef<boolean>
  appIsOld: ComputedRef<boolean>
  isFullScreen: ComputedRef<boolean>,
  dialog: ComputedRef<Dialog>
  snackbar: ComputedRef<Snackbar>,
  deviceStatus: ComputedRef<DeviceStatus>,
  serverStatus: ComputedRef<ServerStatus>,
  user: ComputedRef<User>,
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
  setSnackbar: (message: string) => void
  errorMessage: (message: Error | string) => void
  detectDevice: () => void
  detectAppVersion: (fade: boolean) => void
  logout: () => void
  updateUser: () => void
  redirectedLogin: () => Promise<void>
  getLoginSession: () => Promise<void>
  tokenLogin: () => Promise<boolean>
  detectOldApp: () => Promise<void>
}
const actions = {
  setSnackbar(message) {
    _appState.value.snackbar = {
      visibility: true,
      text: message,
      callback: undefined,
    };
  },
  errorMessage(error: Error | string) {
    let errorMessage: string = error.message || error as String;
    errorMessage += error.code ? ` Code: ${error.code}` : '';
    console.log(`Error: ${errorMessage}`);
    if (errorMessage == 'Invalid login') {
      this.logout()
      window.setTimeout(() => {
        this.setSnackbar({
          visibility: true,
          text: errorMessage + '. Vennligst logg inn igjen',
          type: 'error',
          callback: undefined,
        })
      }, 2000);
    }
    this.setSnackbar({
      visibility: true,
      text: errorMessage,
      type: 'error',
      callback: undefined,
    });
  },
  detectDevice() {
    const ua = navigator.userAgent;
    console.log(ua);
    const deviceStatus = {
      mobile: ua.indexOf('Mobi') !== -1,
      browser:
        ua.indexOf('Chrome') !== -1 && ua.indexOf('Safari') !== -1
          ? 'Chrome'
          : 'Safari',
    };
    _appState.value.deviceStatus.mobile = deviceStatus.mobile;
    _appState.value.deviceStatus.browser = deviceStatus.browser;
  },
  detectAppVersion() {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/appversion',
      contentType: 'text/html'
    }
    apiRequest(payload).then((version) => {
        if (appVersion !== version) {
          _appState.value.appIsOld = true
          this.setSnackbar({
            visibility: true,
            text: 'Viva appen er en eldre versjon, og du må laste ned en ny versjon fra Appstore',
            callback: undefined,
          });
        }
      })
  },
  logout() {
    _appState.value.selectedUser = undefined;
    _appState.value.isLoggedIn = false;
    _appState.value.isAuthorised = false;
    videoActions.clearDataUponLogout()
    videoActions.abortAllUploads()
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/auth/logout'
    }
    apiRequest(payload).then(() => {
      localStorage.removeItem('jwt')
      router.push('/logout')
    }).catch(err => console.log(err))
  },
  // Used by mobile app to exchange token for session.
  // Token is attached inside communication.js
  // Token is only used if session is not available
  getLoginSession() {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/auth/token',
      credentials: true,
    }
    return apiRequest(payload)
      .catch(error => {
        console.log(error);
        this.logout()
      });
  },
  // Called after successful login to retieve user and mark as 'logged in'
  redirectedLogin() {
    const errorOnLogin = error => {
      this.setSnackbar({
        visibility: true,
        text: error,
        callback: undefined,
      });
      this.logout()
    };

    const completeLogin = () => {
      const payload: APIRequestPayload = {
        method: XHR_REQUEST_TYPE.GET,
        route: '/api/user',
        credentials: true,
      }
      return apiRequest(payload).then(response => {
          const user = response ? response.user : false;
          if (user) {
            _appState.value.isLoggedIn = true;
            _appState.value.isAuthorised = true;

            this.activeNow()
            this.selectUser(user)
            datasetActions.setPresetDatasett(user.datasett)
          } else {
            return errorOnLogin('User not found');
          }

          // Check for an encryptionKey, create one and save, if not found
          // This key is needed at the top level to encrypt Video metadata items
          // The entire User model should not persist in browser and be removed from browser on logout
          if (!user.encryptionKey && !state.useCordova) {
            // Generate a key, export and convert to string for storage sever-side
            return webcryptoService.generateKey().then(key => {
              webcryptoService.keyToString(key).then(exportedKey => {
                user.encryptionKey = exportedKey;
                this.updateUser(user)
              });
            });
          }
        })
        .catch(error => {
          return errorOnLogin(error);
        });
    };
    return completeLogin();
  },
  updateUser(user) {
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.PUT,
      route: '/api/user',
      credentials: true,
      body: user,
    }
    user.datasett = datasetGetters.presetDatasett
    return apiRequest(payload)
      .then(u => _appState.value.selectedUser = u)
      .catch(error => {
        this.errorMessage(error)
      });
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
//export const AppKey: InjectionKey<UseApp> = Symbol('UseApp')

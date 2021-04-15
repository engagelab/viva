import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '@/api/apiRequest'
import {
  PersistedAppState,
  LocalUser,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
} from '@/types/main'

import { appVersion } from '../constants'

// ------------  Types --------------
interface AppStatus {
  validToken: boolean
  loading: boolean
  isMobileApp: boolean
}
export interface AppState {
  validToken: boolean
  errorMessage: string
  loading: boolean
  fade: boolean
  lastLogin: Date
  currentLocalUser: LocalUser | undefined
  appIsOld: boolean
  disableDelays: boolean
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
  validToken: false,
  errorMessage: '',
  loading: false,
  fade: false,
  lastLogin: new Date(),
  currentLocalUser: undefined,
  appIsOld: false,
  disableDelays: process.env.VUE_APP_DISABLE_DELAYS === 'true',
})

// This will be saved to device storage
const _persistedAppState: Ref<PersistedAppState> = ref({
  localUsers: {},
})

// ------------  Getters (Read only) --------------
interface Getters {
  status: ComputedRef<AppStatus>
  fade: ComputedRef<boolean>
  disableDelays: ComputedRef<boolean>
  currentLocalUser: ComputedRef<LocalUser | undefined>
  persistedLocalUsers: ComputedRef<Record<string, LocalUser>>
}
const getters = {
  get status(): ComputedRef<AppStatus> {
    return computed(() => ({
      loading: _appState.value.loading,
      validToken: _appState.value.validToken,
      isMobileApp: navigator.userAgent.indexOf('Mobile') > -1,
    }))
  },
  // Current state of the display 'fade'
  get fade(): ComputedRef<boolean> {
    return computed(() => _appState.value.fade)
  },
  // TESTING ONLY. Remove app delays
  get disableDelays(): ComputedRef<boolean> {
    return computed(() => _appState.value.disableDelays)
  },
  get currentLocalUser(): ComputedRef<LocalUser | undefined> {
    return computed(() => {
      return _appState.value.currentLocalUser
        ? _appState.value.currentLocalUser
        : undefined
    })
  },
  get persistedLocalUsers(): ComputedRef<Record<string, LocalUser>> {
    return computed(() => _persistedAppState.value.localUsers)
  },
}
// ------------  Actions --------------
interface Actions {
  setDisableDelays: (s: boolean) => void
  setError: (message: string) => void
  setLoading: (loading: boolean) => void
  setFade: (fade: boolean) => void
  setCurrentLocalUser: (user: LocalUser) => void
  logout: (rememberMe: boolean) => void
  tokenLogin: () => Promise<boolean>
  detectOldApp: () => Promise<void>
}
const actions = {
  // FOR TESTING ONLY. Remove app delays
  setDisableDelays(s: boolean) {
    _appState.value.disableDelays = s
  },
  setError: function (message: string): void {
    _appState.value.errorMessage = message
  },
  setLoading: function (loading: boolean): void {
    _appState.value.loading = loading
  },
  // Fade the display down or up
  setFade: function (fade: boolean): void {
    _appState.value.fade = fade
  },
  setCurrentLocalUser: function (user: LocalUser): void {
    _appState.value.currentLocalUser = user
    localStorage.setItem('jwt', user.jwt)
  },
  // The intention of logout is to enforce a new login with the server
  logout: function (rememberMe: boolean): void {
    if (_appState.value.currentLocalUser) {
      if (rememberMe) {
        _persistedAppState.value.localUsers[
          _appState.value.currentLocalUser._id
        ] = _appState.value.currentLocalUser
      } else {
        delete _persistedAppState.value.localUsers[
          _appState.value.currentLocalUser._id
        ]
      }
      _appState.value.currentLocalUser = undefined
    }
    localStorage.removeItem('jwt')
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

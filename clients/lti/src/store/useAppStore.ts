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
import { ref, computed, ComputedRef, Ref } from 'vue'
import router from '../router'
import { apiRequest } from '../api/apiRequest'
import {
  PersistedAppState,
  LocalUser,
  APIRequestPayload,
  XHR_REQUEST_TYPE,
  User,
  NameAndRole,
  DialogConfig,
} from '../types/main'

import { appVersion } from '../constants'

// ------------  Types --------------
interface AppStatus {
  validToken: boolean
  loading: boolean
  isMobileApp: boolean
}
interface CanvasData {
  namesAndRoles: NameAndRole[]
}
export interface AppState {
  validToken: boolean
  errorMessage: string
  loading: boolean
  isLoggedIn: boolean
  selectedUser: User
  canvasData: CanvasData
  isAuthorised: boolean
  fade: boolean
  lastLogin: Date
  currentLocalUser: LocalUser | undefined
  appIsOld: boolean
  disableDelays: boolean
  dialogConfig: DialogConfig
}
// ------------  State (internal) --------------
const _appState: Ref<AppState> = ref({
  validToken: false,
  errorMessage: '',
  loading: false,
  isLoggedIn: false,
  selectedUser: new User(),
  canvasData: {
    namesAndRoles: [],
  },
  isAuthorised: false,
  fade: false,
  lastLogin: new Date(),
  currentLocalUser: undefined,
  appIsOld: false,
  disableDelays: process.env.VUE_APP_DISABLE_DELAYS === 'true',
  dialogConfig: {
    title: '',
    text: '',
    visible: false,
    cancel: () => ({}),
    cancelText: 'Cancel',
    confirm: () => ({}),
    confirmText: 'Confirm',
  },
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
  user: ComputedRef<User>
  canvasData: ComputedRef<CanvasData>
  dialogConfig: ComputedRef<DialogConfig>
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
  get user(): ComputedRef<User> {
    return computed(() => _appState.value.selectedUser)
  },
  get canvasData(): ComputedRef<CanvasData> {
    return computed(() => _appState.value.canvasData)
  },
  get dialogConfig(): ComputedRef<DialogConfig> {
    return computed(() => _appState.value.dialogConfig)
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
  fetchLTIData: () => Promise<void>
  redirectedLogin: () => Promise<void>
  nameAndRole: (ltiID: string) => NameAndRole
  setDialog: (visible: boolean, config?: DialogConfig) => void
}
const actions = {
  setDialog(visible: boolean, config?: DialogConfig): void {
    if (config) _appState.value.dialogConfig = config
    _appState.value.dialogConfig.visible = visible
  },
  nameAndRole(ltiID: string): NameAndRole {
    const namerole = _appState.value.canvasData.namesAndRoles.find(
      (nr) => nr.ltiID === ltiID
    )
    return (
      namerole || {
        name: 'not found',
        ltiID,
        email: '',
        roles: [],
        abbreviation: 'NF',
      }
    )
  },
  fetchLTIData(): Promise<void> {
    const rgx = new RegExp(/(\p{L}{1})\p{L}+/, 'gu')
    const payload: APIRequestPayload = {
      method: XHR_REQUEST_TYPE.GET,
      route: '/api/users',
      query: { mode: 'namesandroles' },
      credentials: true,
    }
    return apiRequest<NameAndRole[]>(payload)
      .then((response: NameAndRole[]) => {
        if (response && response.length) {
          const n = response.map((nar) => {
            const initials: RegExpMatchArray[] =
              [...nar.name.matchAll(rgx)] || []
            const abbreviation: string = (
              (initials.shift()?.[1] || '') + (initials.pop()?.[1] || '')
            ).toUpperCase()
            return {
              ...nar,
              abbreviation,
            }
          })
          _appState.value.canvasData.namesAndRoles = n
        }
      })
      .catch((error: Error) => {
        console.log(error)
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
            _appState.value.selectedUser = user
          } else {
            console.log('User not found')
          }
        })
        .catch((error: Error) => {
          console.log(error)
        })
    }
    return completeLogin()
  },

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

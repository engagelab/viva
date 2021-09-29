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
import './tailwind.css'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { globalTranslations } from './translations'
import router from './router'
import App from './App.vue'

import { useAppStore } from './store/useAppStore'

const { actions: appActions } = useAppStore()

const app = createApp(App)
// Redirected OAuth login for mobile devices
// Using cordova-plugin-oauth
// Called from a callback URL like
// com.example.foo://oauth_callback?code=b10a8db164e0754105b7a99be72e3fe5
// it would be received in JavaScript like this:
window.addEventListener('message', function (event) {
  if (event.origin) console.log(`Login callback event origin: ${event.origin}`)
  if (typeof event.data === 'string' && event.data.match(/^oauth::/)) {
    const data = JSON.parse(event.data.substring(7))
    if (data.mode == 'login' && data.code && data.code !== 'undefined') {
      // The JWT will be sent with future requests to authenticate Mobile users in case the session has expired
      localStorage.setItem('jwt', data.code)
      appActions.tokenLogin()
    } else {
      router.push('/')
    }
  }
})

const i18n = createI18n({
  locale: navigator.language || 'nb_NO',
  globalInjection: true,
  fallbackLocale: {
    'nb-NO': ['nb_NO'],
    nb: ['nb_NO'],
    'nn-NO': ['nn_NO'],
    nn: ['nn_NO'],
    'en-AU': ['en'],
  },
  legacy: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
  messages: globalTranslations,
})

/* interface SLPlusCustomEventDetail {
  type: string
  error: Error
} */
// Catch slPLus errors sent via utilities.js error function
window.addEventListener('vivaerror', ((event: CustomEvent) => {
  //do something
  const error = event.detail
  if (error) {
    const errorText = error.toString()
    console.log(errorText)
  }
}) as EventListener)

// Catch unhandled errors
window.addEventListener('unhandledrejection', function (event) {
  console.warn(
    `Uncaught promise: ${event.promise.toString()} Reason: ${event.reason.toString()}`
  )
})

// Bootstrap the Vue app when called
const initialiseApp = () => {
  app.use(router).use(i18n).mount('#app')
}

// add cordova.js only if serving the app through file://
// After cordova is ready, bootstrap the Vue app
if (window.cordova) {
  // If running Cordova, configure it once it becomes ready. Else, configure indexedDB
  const onDeviceReady = () => {
    appActions.setUseCordova(true)
    initialiseApp()
  }
  document.addEventListener('deviceready', onDeviceReady, false)
} else {
  initialiseApp()
}

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
    // For Andoird, check device permissions
    const permissions = cordova.plugins.permissions
    const permissionList = permissions
      ? [
          permissions.CAMERA,
          permissions.RECORD_AUDIO,
          permissions.READ_EXTERNAL_STORAGE,
          permissions.WRITE_EXTERNAL_STORAGE,
          permissions.INTERNET,
        ]
      : []
    const permissionError = (
      p: AndroidPermissions,
      callback: () => void
    ): void => {
      console.warn(`Permission ${p} is not turned on`)
      callback()
    }
    const permissionSuccess = (
      p: AndroidPermissions,
      callback: () => void,
      status: { hasPermission: boolean }
    ): void => {
      if (!status.hasPermission) {
        permissions.requestPermission(
          p,
          (status2) => {
            if (!status2.hasPermission) permissionError(p, callback)
          },
          () => {
            permissionError(p, callback)
          }
        )
      }
    }
    const checkPermission = (
      p: AndroidPermissions,
      callback: () => void
    ): void => {
      permissions.checkPermission(
        p,
        (status) => {
          permissionSuccess(p, callback, status)
        },
        () => {
          permissionError(p, callback)
        }
      )
    }

    // Check permissions in series, asynchronously
    const checkPermissionList = (): void => {
      if (permissionList.length > 0) {
        window.setTimeout(() => {
          const p = permissionList.pop()
          if (p) checkPermission(p, checkPermissionList)
        }, 2000)
      }
    }
    if (permissions) checkPermissionList()

    appActions.setUseCordova(true)
    initialiseApp()
  }
  document.addEventListener('deviceready', onDeviceReady, false)
} else {
  initialiseApp()
}

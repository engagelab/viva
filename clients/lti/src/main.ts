import './tailwind.css'
import { createApp } from 'vue'
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
  if (typeof event.data === 'string' && event.data.match(/^oauth::/)) {
    const data = JSON.parse(event.data.substring(7))
    if (data.mode == 'login' && data.code && data.code !== 'undefined') {
      // The JWT will be sent with future requests to authenticate Mobile users in case the session has expired
      localStorage.setItem('jwt', data.code)
      appActions.tokenLogin()
    } else {
      router.push('/')
    }
  } else if (typeof event.data === 'string' && event.data.match(/lti/g)) {
    const data = JSON.parse(event.data)
    if (data.subject === 'lti.fetchWindowSize') {
      localStorage.setItem('windowHeight', data.height)
      // This removes the outside scroll bar in the LTI iframe
      // const h = document.documentElement.clientHeight
      parent.postMessage(
        JSON.stringify({
          subject: 'lti.frameResize',
          height: data.height,
        }),
        '*'
      )
    }
  }
})
// window.parent.postMessage({ subject: 'lti.fetchWindowSize' }, '*')

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
  app.use(router).mount('#app')
}

initialiseApp()

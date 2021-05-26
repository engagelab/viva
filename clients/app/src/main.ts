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

// add cordova.js only if serving the app through file://
// After cordova is ready, bootstrap the Vue app
if (window.cordova) {
  // If running Cordova, configure it once it becomes ready. Else, configure indexedDB
  const onDeviceReady = () => {
    // For Andoird, check device permissions
    const permissions = cordova.plugins.permissions;
    const permissionList = [
      permissions.CAMERA,
      permissions.RECORD_AUDIO,
      permissions.READ_EXTERNAL_STORAGE,
      permissions.WRITE_EXTERNAL_STORAGE,
      permissions.INTERNET,
    ];
    const permissionError = (p, callback) => {
      console.warn(`Permission ${p} is not turned on`);
      callback();
    };
    const permissionSuccess = (p, callback, status) => {
      if (!status.hasPermission) {
        permissions.requestPermission(
          p,
          status2 => {
            if (!status2.hasPermission) return permissionError(p, callback);
          },
          permissionError(p, callback)
        );
      }
    };
    const checkPermission = (p, callback) => {
      permissions.checkPermission(
        p,
        status => permissionSuccess(p, callback, status),
        permissionError(p, callback)
      );
    };

    // Check permissions in series, asynchronously
    function checkPermissionList() {
      if (permissionList.length > 0) {
        window.setTimeout(() => {
          checkPermission(permissionList.pop(), checkPermissionList);
        }, 2000)
      }
    }
    checkPermissionList();

    cordovaService.createStorage();
    store.commit('general/useCordova');
    store.commit('video/useCordova', true);
    // eslint-disable-next-line no-undef
    StatusBar.hide();
    initialiseApp();
  };
  document.addEventListener('deviceready', onDeviceReady, false);
} else {
  // preventChromeRefresh()
  if (webcryptoService.setupAPI()) {
    indexedDBService.createDatabase();
    store.commit('video/useCordova', false);
    initialiseApp();
  } else {
    console.log(
      'Required cryptography services not supported on this platform'
    );
  }
}

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

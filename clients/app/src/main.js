import Vue from 'vue';
// import 'whatwg-fetch'
import 'indexeddb-getall-shim';
import 'inobounce';
import '@/main.css';
import cordovaService from './api/cordovaService';
import indexedDBService from './api/indexedDBServiceDirect';
import webcryptoService from './api/webCryptoService';
import router from './router';
import store from './store/index';
import i18n from '../src/i18n';
import App from './App.vue';

// Bootstrap the Vue app when called
const initialiseApp = () => {
  /* eslint-disable no-new */
  new Vue({
    store,
    router,
    i18n,
    render: h => h(App),
  }).$mount('#app');
};

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
          status => {
            if (!status.hasPermission) return permissionError(p, callback);
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

// Using cordova-plugin-oauth
// Called from a callback URL like
// com.example.foo://oauth_callback?code=b10a8db164e0754105b7a99be72e3fe5
// it would be received in JavaScript like this:
window.addEventListener('message', function(event) {
  console.log('App received message from OAuth plugin');
  if (typeof event.data === 'string' && event.data.match(/^oauth::/)) {
    const data = JSON.parse(event.data.substring(7));
    if (data.mode == 'login' && data.code && data.code !== 'undefined') {
      localStorage.setItem('jwt', data.code);
      store.dispatch('general/getLoginSession', data.code).then(() => {
        router.push('/settings');
      });
    } else if (data.mode == 'transfer') {
      store.dispatch('video/transferSuccess', data)
      // router.push({ path: 'transferred', query: data });
    } else {
      router.push('/login?page=0');
    }
  }
});

Vue.config.productionTip = false;

// Ability to bubble events to components above $parent level
// https://stackoverflow.com/questions/41993508/vuejs-bubbling-custom-events
// usage:  @click="$bubble('my-event', 'payload')"
Vue.use(Vue => {
  Vue.prototype.$bubble = function $bubble(eventName, ...args) {
    // Emit the event on all parent components
    let component = this;
    do {
      component.$emit(eventName, ...args);
      component = component.$parent;
    } while (component);
  };
});

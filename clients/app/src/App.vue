<template>
  <div class="flex flex-col mx-auto relative h-screen bg-viva-beige" id="app" @click="activeNow()">
    <router-view />
    <Snackbar />
    <Dialog />
  </div>
</template>

<script>
import store from './store/index';
import constants from './constants';
import Snackbar from './components/Snackbar';
import Dialog from './components/Dialog';

const { strings } = constants;

export default {
  components: {
    Snackbar,
    Dialog,
  },
  name: 'App',
  data: () => ({
    cordovaExists: false,
  }),
  created() {
    // Set the locale to the browser's preferred language
    let browserLocale =
      navigator.languages && navigator.languages.length
        ? navigator.languages[0]
        : navigator.language;
    if (
      browserLocale === 'nb' ||
      browserLocale === 'nn' ||
      browserLocale === 'nb-NO' ||
      browserLocale === 'nn-NO' ||
      browserLocale === 'no-NO' ||
      browserLocale === 'no'
    ) {
      browserLocale = 'no';
    } else if (
      browserLocale.substr(0, 2) === 'en' &&
      browserLocale.length > 2
    ) {
      browserLocale = 'en';
    }
    this.$i18n.locale = browserLocale;

    // Listen for changes to app foreground / background
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const idleTime = Math.floor(
          (new Date().getTime() - store.getters['general/lastActive']) / 1000
        );
        const isLoggedIn = store.getters['general/isLoggedIn'];
        const recordingNow = store.getters['video/recordingNow'];
        store.commit('general/activeNow');

        // Log out if the user has been idle for too long
        if (isLoggedIn && idleTime > strings.idleTimeout && !recordingNow) {
          store.dispatch('general/logout')
        }
      } else if (document.visibilityState === 'hidden') {
        store.commit('general/activeNow');
      }
    });
  },
  mounted() {
    store.dispatch('general/detectDevice');
    store.dispatch('general/detectAppVersion');
  },
  methods: {
    activeNow() {
      store.commit('general/activeNow');
    },
  },
};
</script>

<style>
</style>

<template>
  <div id="app" class="fadeInOut h-full" :style="fadeState">
    <!--p @click="fixHeight()">FIX HEIGHT</p-->
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useAppStore } from './store/useAppStore'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'App',
  setup() {
    const router = useRouter()
    const appStore = useAppStore()
    appStore.actions.detectOldApp()
    const fadeState = computed(() => {
      return { opacity: appStore.getters.fade.value ? '0' : '1' }
    })
    const fixHeight = () => {
      const h = '90vh' // document.documentElement.clientHeight * 0.65
      parent.postMessage(
        JSON.stringify({
          subject: 'lti.frameResize',
          height: h,
        }),
        '*'
      )
    }

    // If we arrived here from a page reload, make sure to set up again
    if (router.currentRoute.value.path !== '/') {
      router.push('/login')
    }

    return {
      fixHeight,
      fadeState,
      disableDelays: appStore.getters.disableDelays,
    }
  },
})
</script>

<style lang="postcss">
html {
  @apply font-playful;
}
.fadeInOut {
  opacity: 1;
  -webkit-transition: opacity 0.5s ease-in-out;
  -moz-transition: opacity 0.5s ease-in-out;
  -ms-transition: opacity 0.5s ease-in-out;
  -o-transition: opacity 0.5s ease-in-out;
  transition: opacity 0.5s ease-in-out;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

/* ---- Transition effects available throughout the app ---- */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slidenext-enter-from {
  transform: translateX(100%);
}
.slidenext-enter-active,
.slidenext-leave-active {
  transition: all 0.25s ease-out;
}
.slidenext-leave-to {
  transform: translateX(-100%);
}

.slideprev-enter-from {
  transform: translateX(-100%);
}
.slideprev-enter-active,
.slideprev-leave-active {
  transition: all 0.25s ease-out;
}
.slideprev-leave-to {
  transform: translateX(100%);
}

.slideup-enter-from {
  transform: translateY(100%);
}
.slideup-enter-active,
.slideup-leave-active {
  transition: all 0.25s ease-out;
}
.slideup-leave-to {
  transform: translateY(-100%);
}
</style>

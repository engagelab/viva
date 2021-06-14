<template>
  <div id="app" class="fadeInOut h-screen" :style="fadeState">
    <div
      v-if="disableDelays"
      class="absolute top-0 right-0 pr-20 text-red-600 text-xs"
    >
      Delays & locks disabled
    </div>
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

    // If we arrived here from a page reload, make sure to set up again
    if (router.currentRoute.value.path !== '/') {
      router.push('/login')
    }

    return {
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
/* @media screen and (prefers-reduced-motion: reduce) {
  .next-enter {
    opacity: 0;
    transform: translate3d(100px, 0, 0);
  }
  .next-enter-active,
  .next-leave-active {
    transition: 0.5s;
  }
  .next-leave-to {
    opacity: 0;
    transform: translate3d(-100px, 0, 0);
  }

  .prev-enter {
    opacity: 0;
    transform: translate3d(-100px, 0, 0);
  }
  .prev-enter-active,
  .prev-leave-active {
    transition: 0.5s;
  }
  .prev-leave-to {
    opacity: 0;
    transform: translate3d(100px, 0, 0);
  }
} */
</style>

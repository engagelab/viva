<template>
  <div class="relative w-screen h-screen overflow-hidden">
    <!-- <div
      class="relative flex md:flex-row flex-col h-full justify-center bg-blue-button"
    >
      Welcome to the Dashboard. Your username is: {{ user }}
      <SlButton class="m-4" @click="monitor()">Monitor</SlButton>
    </div> -->
    <div class="flex flex-wrap w-full border-2 h-full">
      <div class="w-1/2">
        <RecordingsComponent />
      </div>
      <div class="w-1/2">
        <VideoComponent :key="video ? video.details.id : 'video component'" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent } from 'vue'
/* import router from '../router' */

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'
/* import SlButton from '@/components/base/SlButton.vue' */

import RecordingsComponent from '@/components/RecordingsComponent.vue'
import VideoComponent from '@/components/VideoComponent.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    /*  SlButton, */
    RecordingsComponent,
    VideoComponent,
  },
  setup() {
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: videoGetters } = useVideoStore()
    const user = appGetters.user.value
    appActions.fetchLTIData()

    const video = videoGetters.selectedVideo

    return {
      user,
      video,
    }
  },
})
</script>

<style scoped lang="postcss">
.slide-rightmenu-enter-from {
  transform-box: border-box;
  transform: translateX(100%);
}
.slide-rightmenu-enter-active,
.slide-rightmenu-leave-active {
  transition: all 1s ease;
}
.slide-rightmenu-leave-to {
  transform-box: border-box;
  transform: translateX(100%);
}

.widthTransition {
  transition: transform 1s ease;
}
@responsive {
  .translate-x-full {
    -webkit-transform: translateX(66%);
    transform: translateX(66%);
  }

  .-translate-x-full {
    -webkit-transform: translateX(-50%);
    transform: translateX(-50%);
  }

  .translate-x-0 {
    -webkit-transform: translateX(16.6 %);
    transform: translateX(16.6%);
  }
}
/* .slidemenu-right-enter-from {
  transform: translateX(-100%);
}
.slidemenu-right-enter-active,
.slidemenu-right-leave-active {
  transition: all 1s ease;
}
.slidemenu-right-leave-to {
  transform: translateX(100%);
} */
</style>

<template>
  <div>
    <div class="flex flex-col p-4">
      <ul class="flex border-b space-x-2">
        <div class="hover:bg-blue-300 cursor-pointer" @click="showTab = 'all'">
          AllVideos
        </div>
        <div class="hover:bg-blue-300 cursor-pointer" @click="showTab = 'own'">
          My Recordings
        </div>
        <div
          class="hover:bg-blue-300 cursor-pointer"
          @click="showTab = 'shared'"
        >
          Shared Videos
        </div>
      </ul>
    </div>
    <div class="flex flex-wrap my-2">
      <div class="w-1/6">
        <RecordingsComponent :videos="videos" />
        <!-- <RecordingsComponent /> -->
      </div>
      <div class="w-5/6">
        <VideoComponent :key="video ? video.details.id : 'video component'" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, computed } from 'vue'
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
    const showTab = ref('all')

    const video = videoGetters.selectedVideo

    const videos = computed(() => {
      console.log(videoGetters.videos.value)
      if (showTab.value == 'all') return videoGetters.videos.value
      else if (showTab.value == 'shared')
        return videoGetters.videosSharedWithMe.value
      else
        return videoGetters.videos.value.filter(
          (video) => video.users.owner == appGetters.user.value._id
        )
    })

    return {
      user,
      video,
      showTab,
      videos,
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

<template>
  <div class="bg-grey-bg p-4">
    <div class="flex flex-row font-serious font-extralight text-white py-4">
      <div
        class="cursor-pointer mr-6"
        :class="{ 'font-medium': currentTab === 'all' }"
        @click="showTab('all')"
      >
        All
      </div>
      <div
        class="cursor-pointer mr-6"
        :class="{ 'font-medium': currentTab === 'own' }"
        @click="showTab('own')"
      >
        My Videos
      </div>
      <div
        class="cursor-pointer mr-6"
        :class="{ 'font-medium': currentTab === 'shared' }"
        @click="showTab('shared')"
      >
        Shared With Me
      </div>
    </div>
    <div>
      <!--VideoJsComponent :key="video ? video.details.id : 'video component'" /-->
      <VideoComponent v-if="video" :key="video.details.id" />
      <div v-else class="flex flex-row flex-wrap gap-4">
        <VideoCard
          v-for="(video, videoIndex) in videos"
          :key="videoIndex"
          :video="video"
          @click="selectVideo(video)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, computed, onMounted } from 'vue'
import { Video } from '../types/main'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'

import VideoComponent from '@/components/VideoComponent.vue'
import VideoCard from '@/components/VideoCard.vue'
// import VideoJsComponent from '@/components/VideojsComponent.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    VideoCard,
    VideoComponent,
    // VideoJsComponent,
  },
  setup() {
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: videoGetters, actions: videoActions } = useVideoStore()
    const user = appGetters.user.value
    appActions.fetchLTIData()
    const currentTab = ref('all')

    onMounted(() => {
      videoActions.getVideoMetadata()
    })

    const video = videoGetters.selectedVideo

    function showTab(tabName: string) {
      currentTab.value = tabName
      videoActions.selectNoVideo()
    }

    function selectVideo(video: Video) {
      videoActions.selectVideo(video)
    }
    videoActions.selectNoVideo()

    const videos = computed(() => {
      if (currentTab.value == 'all') return videoGetters.videos.value
      else if (currentTab.value == 'shared')
        return videoGetters.videosSharedWithMe.value
      else
        return videoGetters.videos.value.filter(
          (video) => video.users.owner == appGetters.user.value._id
        )
    })

    return {
      user,
      video,
      selectVideo,
      showTab,
      currentTab,
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

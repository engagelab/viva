<template>
  <div class="text-black">
    Videos

    <div class="mx-3">
      <button
        class="px-4 py-2 bg-green-400 rounded-lg w-full my-1"
        v-for="(video, videoIndex) in videoList"
        :key="videoIndex"
        @click="selectVideo(video)"
      >
        {{ video.details.name }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue'
import { useVideoStore } from '@/store/useVideoStore'
import { Video } from '../types/main'

const { getters: videoGetters, actions: videoActions } = useVideoStore()
/* import Edit from '../views/pages/edit.vue' */

export default defineComponent({
  name: 'Recording list',
  setup() {
    const videoList = computed(() => videoGetters.videos.value)

    onMounted(() => {
      videoActions.getVideoMetadata()
    })

    const selectVideo = (video: Video) => {
      videoActions.selectVideo(video)
    }

    return {
      videoList,
      // method
      selectVideo,
    }
  },
})
</script>

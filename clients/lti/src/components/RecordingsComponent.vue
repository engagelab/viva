<template>
  <div class="text-black">
    User recordings

    <div>
      <button
        class="px-4 py-2 bg-green-400 rounded-lg"
        v-for="(video, videoIndex) in videoList"
        :key="videoIndex"
        @click="selectVideo(video)"
      >
        {{ video }}
      </button>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useVideoStore } from '@/store/useVideoStore'
import { User } from '../types/main'

const { actions: videoActions } = useVideoStore()
/* import Edit from '../views/pages/edit.vue' */

export default defineComponent({
  name: 'Recording list',
  components: {},
  props: {
    user: { type: User, required: true },
  },
  setup(props) {
    const videoList = computed(() => props.user.videos.draftIDs)

    const selectVideo = (videoId: string) => {
      videoActions.selectVideo(videoId)
    }

    return {
      videoList,
      // method
      selectVideo,
    }
  },
})
</script>

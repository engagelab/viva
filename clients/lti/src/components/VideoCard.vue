<template>
  <div class="bg-grey-card text-grey-text rounded-xl p-4">
    <p class="mb-2">Added by {{ video.details.name }}</p>
    <video
      :src="`${baseUrl}/api/video/file?videoref=${video.details.id}`"
      alt="video preview"
    >
      <track kind="subtitles" />
    </video>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Video } from '../types/main'
import { baseUrl } from '@/constants'

export default defineComponent({
  name: 'videocard',
  props: {
    video: { type: Object as PropType<Video>, required: true },
  },
  setup() {
    return {
      baseUrl,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>

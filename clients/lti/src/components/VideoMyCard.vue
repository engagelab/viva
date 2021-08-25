<template>
  <div
    class="flex flex-col bg-grey-card text-grey-text rounded-xl bg-cover bg-center bg-no-repeat h-64"
    :style="{
      'background-image': `url(${baseUrl}/api/video/file?videoref=${item.video.details.id}&mode=thumbnail)`,
    }"
  >
    <div class="flex justify-center mt-4">
      <div class="flex flex-col items-center text-white">
        <p class="m-1 text-xs">By {{ item.videoOwner.name }}</p>
        <p class="m-1 text-xs">
          {{ formatDate(item.video.details.created) }}
        </p>
      </div>
    </div>
    <!--img
      class="object-cover h-36 w-full"
      :src="`${baseUrl}/api/video/file?videoref=${item.video.details.id}&mode=thumbnail`"
      alt="video thumbnail"
    /-->
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import moment from 'moment'
import { ListItem } from '../types/main'
import { baseUrl } from '@/constants'

export default defineComponent({
  name: 'videomycard',
  props: {
    item: { type: Object as PropType<ListItem>, required: true },
  },
  setup() {
    function formatDate(date: Date) {
      return moment(date).format('MMM Do')
    }
    return {
      formatDate,
      baseUrl,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>

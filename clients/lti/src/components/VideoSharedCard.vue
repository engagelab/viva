<template>
  <div class="bg-grey-card text-grey-text rounded-xl w-64">
    <p class="m-2 text-xs p-2">By {{ svideo.creator.name }}</p>
    <img
      class="object-cover h-36 w-full"
      :src="`${baseUrl}/api/video/file?videoref=${svideo.original.details.id}&mode=thumbnail`"
      alt="video thumbnail"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ListItem } from '../types/main'
import { baseUrl } from '@/constants'

export default defineComponent({
  name: 'videosharedcard',
  props: {
    svideo: { type: Object as PropType<ListItem>, required: true },
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

<template>
  <div
    class="flex flex-row items-center text-viva-grey-500 bg-viva-grey-400 my-1"
    @click.stop="openShare(share)"
  >
    <img
      class="object-cover h-36 p-4"
      :src="`${baseUrl}/api/video/file?videoref=${share.video.details.id}&mode=thumbnail`"
      alt="video thumbnail"
    />
    <div class="mx-6">
      <p class="text-white">{{ share.share.title }}</p>
      <p class="m-1 text-xs">
        By <span class="text-white">{{ share.creatorName.name }}</span>
      </p>
    </div>
    <div class="flex flex-row">
      <div
        v-for="(u, i) in share.users"
        :key="`share-user-${i}`"
        :title="u.name"
        class="flex items-center justify-center w-10 h-10 rounded-full border text-xs -m-1 bg-black"
      >
        {{ u.abbreviation }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ListItemShare } from '../types/main'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions } = useVideoStore()

export default defineComponent({
  name: 'videoSharedCard',
  props: {
    share: { type: Object as PropType<ListItemShare>, required: true },
  },
  setup() {
    function openShare(share: ListItemShare) {
      videoActions.selectShare(share)
      videoActions.detailMode(
        VIDEO_DETAIL_MODE.annotate,
        VIDEO_DETAIL_MODE.none
      )
    }
    return {
      baseUrl,
      openShare,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>

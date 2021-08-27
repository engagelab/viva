<template>
  <div
    class="flex flex-col text-viva-grey-500 rounded-xl bg-viva-grey-400 bg-cover bg-center bg-no-repeat my-1"
    :style="{
      'background-image': `url(${baseUrl}/api/video/file?videoref=${listitem.video.details.id}&mode=thumbnail)`,
    }"
  >
    <div class="relative flex flex-col justify-between py-6 h-96">
      <div class="flex flex-col items-center text-white">
        <p class="m-1 text-xs">By {{ listitem.owner.name }}</p>
        <p class="m-1 text-xs">
          {{ formatDate(listitem.video.details.created) }}
        </p>
      </div>
      <div class="relative flex flex-col items-center">
        <div
          class="absolute top-0 left-0 ml-4 flex flex-col text-white font-extralight"
        >
          <p class="m-1 text-xl max-w-xxs lg:text-2xl lg:max-w-sm">
            {{ listitem.dataset.name }}{{ listitem.dataset.selection }}
          </p>
          <p class="m-1 text-xs">{{ listitem.video.details.name }}</p>
          <p class="m-1 text-xs">{{ listitem.video.details.description }}</p>
        </div>
        <Button
          :childclass="'w-16 h-16 bg-transparent border'"
          @vclick.stop="play(listitem)"
        >
          Play
        </Button>
      </div>
      <div class="flex flex-row justify-center">
        <Button
          :childclass="'w-32'"
          :backgroundcolour="'bg-viva-blue-800'"
          @vclick.stop="newShare(listitem)"
        >
          New share
        </Button>
        <Button
          class="absolute bottom-6 right-6"
          :childclass="'w-10 h-10 border'"
          @click.stop="openCard = !openCard"
        >
          {{ openCard ? '↑' : '↓' }}
        </Button>
      </div>
    </div>
    <div
      class="transition-maxheight duration-500 ease-in-out overflow-x-hidden overflow-y-auto bg-viva-grey-300"
      :class="[openCard ? 'max-h-96' : 'max-h-0']"
    >
      <div v-for="share in listitem.shares" :key="share.id">
        <div
          class="flex flex-row items-center bg-viva-grey-400 my-1"
          @click.stop="openShare(listitem, share)"
        >
          <img
            class="object-cover h-36"
            :src="`${baseUrl}/api/video/file?videoref=${listitem.video.details.id}&mode=thumbnail`"
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
              class="flex items-center justify-center w-10 h-10 rounded-full border text-xs"
            >
              {{ u.abbreviation }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import moment from 'moment'
import { ListItem, ListItemShare } from '../types/main'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import Button from '@/components/base/Button.vue'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions } = useVideoStore()

export default defineComponent({
  name: 'videomycard',
  components: {
    Button,
  },
  props: {
    listitem: { type: Object as PropType<ListItem>, required: true },
  },
  setup() {
    const openCard = ref(false)
    function formatDate(date: Date) {
      return moment(date).format('MMM Do')
    }
    function play(listitem: ListItem) {
      videoActions.detailMode(VIDEO_DETAIL_MODE.play)
      videoActions.selectVideo(listitem)
    }
    function newShare(listitem: ListItem) {
      videoActions.createShare(listitem.video.details.id)
      videoActions.detailMode(VIDEO_DETAIL_MODE.share)
      videoActions.selectVideo(listitem)
    }
    function openShare(listitem: ListItem, share: ListItemShare) {
      videoActions.selectVideo(listitem)
      videoActions.selectShare(share)
      videoActions.detailMode(VIDEO_DETAIL_MODE.share)
    }
    return {
      openCard,
      openShare,
      formatDate,
      baseUrl,
      play,
      newShare,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>

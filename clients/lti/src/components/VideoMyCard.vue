<template>
  <div
    class="flex flex-col text-viva-grey-500 rounded-xl bg-viva-grey-400 my-1 overflow-hidden"
  >
    <div
      class="relative flex flex-col justify-between h-96 bg-opacity-40 bg-viva-grey-300"
    >
      <div
        class="absolute filter blur-sm w-full h-full bg-cover bg-center bg-no-repeat"
        :style="{
          'background-image': `url(${baseUrl}/api/video/file?videoref=${listitem.video.details.id}&mode=thumbnail)`,
        }"
      ></div>
      <div class="relative flex flex-col items-center text-white pt-3">
        <p class="m-1 text-xs">By {{ listitem.owner.name }}</p>
        <p class="m-1 text-xs">
          {{ formatDate(listitem.video.details.created) }}
        </p>
      </div>
      <div class="relative flex flex-col items-center">
        <div class="flex flex-col text-white font-extralight items-center">
          <p class="m-1 mb-4 text-xl max-w-xxs lg:text-2xl lg:max-w-sm">
            {{ listitem.dataset.name }}{{ listitem.dataset.selection }}
          </p>
          <p class="m-1 text-xs">{{ listitem.video.details.name }}</p>
          <p class="m-1 text-xs">{{ listitem.video.details.description }}</p>
        </div>
        <div
          class="absolute top-0 left-0 ml-4 flex items-center justify-center w-16 h-16 rounded-full p-5 pl-6 border-white border-opacity-40 border-2"
          @click.stop="play(listitem)"
        >
          <img :src="playButtonSVG" alt="play-button" />
        </div>
      </div>
      <div class="relative flex flex-row justify-center pb-3">
        <Button
          :childclass="'w-32'"
          :backgroundcolour="'bg-viva-blue-800'"
          @vclick.stop="newShare(listitem)"
        >
          New share
        </Button>
        <div
          class="absolute bottom-6 right-6 flex items-center justify-center w-10 h-10 p-3 rounded-full border-white border-opacity-40 border-2 transform transition duration-500"
          :class="{ 'rotate-180': openCard }"
          @click.stop="openCard = !openCard"
        >
          <img :src="arrowTopSVG" alt="arrow-button" />
        </div>
      </div>
    </div>
    <div
      class="transition-maxheight duration-500 ease-in-out overflow-x-hidden overflow-y-auto no-scrollbar bg-viva-grey-300"
      :class="[openCard ? 'max-h-96' : 'max-h-0']"
    >
      <VideoSharedCard
        v-for="share in listitem.shares"
        :key="share.id"
        :share="share"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import moment from 'moment'
import { ListItem } from '../types/main'
import { baseUrl, VIDEO_DETAIL_MODE } from '@/constants'
import VideoSharedCard from '@/components/VideoSharedCard.vue'
import Button from '@/components/base/Button.vue'
import playButtonSVG from '@/assets/icons/svg/play.svg'
import arrowTopSVG from '@/assets/icons/svg/arrow_top.svg'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions } = useVideoStore()

export default defineComponent({
  name: 'VideoMyCard',
  components: {
    VideoSharedCard,
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
      videoActions.detailMode(VIDEO_DETAIL_MODE.play, VIDEO_DETAIL_MODE.play)
      videoActions.selectVideo(listitem)
    }
    function newShare(listitem: ListItem) {
      videoActions.createShare(listitem.video.details.id)
      videoActions.detailMode(VIDEO_DETAIL_MODE.share, VIDEO_DETAIL_MODE.none)
      videoActions.selectVideo(listitem)
    }
    return {
      openCard,
      formatDate,
      baseUrl,
      play,
      newShare,
      // assets
      playButtonSVG,
      arrowTopSVG,
    }
  },
})
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style type="postcss" scoped></style>

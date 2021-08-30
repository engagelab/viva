<template>
  <div class="relative p-4 flex flex-col">
    <div
      class="flex flex-row justify-start font-serious font-extralight text-viva-grey-500 py-4"
    >
      <!--div
        class="cursor-pointer mr-6"
        :class="{
          'font-medium text-white': currentTab === VIDEO_SHARING_MODE.feed,
        }"
        @click="showTab(VIDEO_SHARING_MODE.feed)"
      >
        Feed
      </div-->
      <div
        class="cursor-pointer mr-6"
        :class="{
          'font-medium text-white': currentTab === VIDEO_SHARING_MODE.myVideos,
        }"
        @click="showTab(VIDEO_SHARING_MODE.myVideos)"
      >
        My Videos
      </div>
      <div
        class="cursor-pointer mr-6"
        :class="{
          'font-medium text-white':
            currentTab === VIDEO_SHARING_MODE.sharedToMe,
        }"
        @click="showTab(VIDEO_SHARING_MODE.sharedToMe)"
      >
        Shared To Me
      </div>
    </div>
    <div class="w-auto lg:w-192 overflow-y-auto no-scrollbar">
      <div
        v-show="currentTab === VIDEO_SHARING_MODE.feed"
        class="flex flex-row flex-wrap"
      >
        <VideoFeedCard
          v-for="(statusItem, itemIndex) in feed"
          :key="itemIndex"
          :statusItem="statusItem"
        />
      </div>
      <div
        v-show="currentTab === VIDEO_SHARING_MODE.myVideos"
        class="flex flex-col"
      >
        <p class="text-lg text-white">My Videos</p>
        <VideoMyCard
          v-for="(item, itemIndex) in myVideos"
          :key="itemIndex"
          :listitem="item"
        />
      </div>
      <div
        v-show="currentTab === VIDEO_SHARING_MODE.sharedToMe"
        class="flex flex-col"
      >
        <p class="text-lg text-white">Shared with me</p>
        <VideoSharedCard
          v-for="(share, itemIndex) in sharedToMe"
          :key="itemIndex"
          :share="share"
        />
      </div>
    </div>
    <div
      v-if="detailMode.mode !== VIDEO_DETAIL_MODE.none"
      class="fixed top-0 left-0 flex flex-col items-center w-full h-full bg-black bg-opacity-75 rounded-xl"
      @mousedown.self="selectNone()"
    >
      <Player
        v-if="
          detailMode.mode === VIDEO_DETAIL_MODE.play ||
          detailMode.submode === VIDEO_DETAIL_MODE.play
        "
      />
      <Annotate v-if="detailMode.mode === VIDEO_DETAIL_MODE.annotate" />
      <Share v-if="detailMode.mode === VIDEO_DETAIL_MODE.share" />
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from 'vue'
import { VIDEO_DETAIL_MODE, VIDEO_SHARING_MODE } from '@/constants'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'

import VideoFeedCard from '@/components/VideoFeedCard.vue'
import VideoMyCard from '@/components/VideoMyCard.vue'
import VideoSharedCard from '@/components/VideoSharedCard.vue'
import Annotate from '@/views/Annotate.vue'
import Player from '@/views/Player.vue'
import Share from '@/views/Share.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    VideoFeedCard,
    VideoMyCard,
    VideoSharedCard,
    Annotate,
    Player,
    Share,
  },
  setup() {
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: videoGetters, actions: videoActions } = useVideoStore()
    const user = appGetters.user.value
    appActions.fetchLTIData()
    const currentTab: Ref<string> = ref(VIDEO_SHARING_MODE.myVideos)

    onMounted(() => {
      videoActions.getVideoMetadata()
    })

    function showTab(tabName: VIDEO_SHARING_MODE) {
      currentTab.value = tabName
      console.log(currentTab.value)
      videoActions.selectNoVideo()
    }

    videoActions.selectNoVideo()

    function selectNone() {
      const { mode, submode } = videoGetters.detailMode.value
      switch (mode) {
        case VIDEO_DETAIL_MODE.play:
          videoActions.detailMode(
            VIDEO_DETAIL_MODE.none,
            VIDEO_DETAIL_MODE.none
          )
          videoActions.detailMode(
            VIDEO_DETAIL_MODE.none,
            VIDEO_DETAIL_MODE.none
          )
          break
        case VIDEO_DETAIL_MODE.share:
          if (
            submode === VIDEO_DETAIL_MODE.play ||
            submode === VIDEO_DETAIL_MODE.trim
          )
            videoActions.detailMode(
              VIDEO_DETAIL_MODE.share,
              VIDEO_DETAIL_MODE.none
            )
          else
            videoActions.detailMode(
              VIDEO_DETAIL_MODE.none,
              VIDEO_DETAIL_MODE.none
            )
          break
        case VIDEO_DETAIL_MODE.annotate:
          if (submode === VIDEO_DETAIL_MODE.play)
            videoActions.detailMode(
              VIDEO_DETAIL_MODE.annotate,
              VIDEO_DETAIL_MODE.none
            )
          else
            videoActions.detailMode(
              VIDEO_DETAIL_MODE.none,
              VIDEO_DETAIL_MODE.none
            )
          break
        default:
          break
      }
    }

    return {
      VIDEO_SHARING_MODE,
      VIDEO_DETAIL_MODE,
      user,
      feed: videoGetters.feed,
      myVideos: videoGetters.myVideos,
      sharedToMe: videoGetters.sharedToMe,
      selectedItem: videoGetters.selectedItem,
      selectNone,
      detailMode: videoGetters.detailMode,
      showTab,
      currentTab,
    }
  },
})
</script>

<style scoped lang="postcss"></style>

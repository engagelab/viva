<template>
  <div class="relative p-4 flex flex-col">
    <div
      class="flex flex-row justify-start font-serious font-extralight text-viva-grey-500 py-4"
    >
      <div
        class="cursor-pointer mr-6"
        :class="{
          'font-medium text-white': currentTab === VIDEO_SHARING_MODE.feed,
        }"
        @click="showTab(VIDEO_SHARING_MODE.feed)"
      >
        Feed
      </div>
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
    <div class="w-auto lg:w-192">
      <div
        v-show="currentTab === VIDEO_SHARING_MODE.feed"
        class="flex flex-row flex-wrap"
      >
        <VideoFeedCard
          v-for="(statusItem, itemIndex) in feed"
          :key="itemIndex"
          :statusItem="statusItem"
          @click="selectItem(statusItem.item)"
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
        class="flex flex-row flex-wrap"
      >
        <VideoSharedCard
          v-for="(item, itemIndex) in sharedToMe"
          :key="itemIndex"
          :listitem="item"
          @click="selectItem(item)"
        />
      </div>
    </div>
    <div
      v-if="selectedItem"
      class="fixed top-0 left-0 flex flex-col items-center w-full h-full bg-black bg-opacity-75 rounded-xl p-10"
      @click.self="selectNone()"
    >
      <Player v-if="detailMode === VIDEO_DETAIL_MODE.play" />
      <Share
        v-if="detailMode === VIDEO_DETAIL_MODE.share"
        class="w-auto lg:w-192"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from 'vue'
import { VIDEO_DETAIL_MODE, VIDEO_SHARING_MODE } from '@/constants'
import { ListItem } from '@/types/main'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'

import VideoFeedCard from '@/components/VideoFeedCard.vue'
import VideoMyCard from '@/components/VideoMyCard.vue'
import VideoSharedCard from '@/components/VideoSharedCard.vue'
import Player from '@/views/Player.vue'
import Share from '@/views/Share.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    VideoFeedCard,
    VideoMyCard,
    VideoSharedCard,
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
      const h = document.documentElement.clientHeight
      const windowHeight = parseInt(localStorage.getItem('windowHeight') || '0')
      if (windowHeight > 0 && (windowHeight > h || h < 500)) {
        parent.postMessage(
          JSON.stringify({
            subject: 'lti.frameResize',
            height: windowHeight,
          }),
          '*'
        )
      }
    })

    function showTab(tabName: VIDEO_SHARING_MODE) {
      currentTab.value = tabName
      console.log(currentTab.value)
      videoActions.selectNoVideo()
    }

    function selectItem(item: ListItem) {
      videoActions.detailMode(VIDEO_DETAIL_MODE.share)
      videoActions.selectVideo(item)
    }
    videoActions.selectNoVideo()

    return {
      VIDEO_SHARING_MODE,
      VIDEO_DETAIL_MODE,
      user,
      feed: videoGetters.feed,
      myVideos: videoGetters.myVideos,
      sharedToMe: videoGetters.sharedToMe,
      selectedItem: videoGetters.selectedItem,
      selectNone: videoActions.selectNoVideo,
      detailMode: videoGetters.detailMode,
      selectItem,
      showTab,
      currentTab,
    }
  },
})
</script>

<style scoped lang="postcss"></style>

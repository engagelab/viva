<template>
  <div class="bg-grey-bg p-4">
    <div class="flex flex-row font-serious font-extralight text-white py-4">
      <div
        class="cursor-pointer mr-6"
        :class="{ 'font-medium': currentTab === VIDEO_SHARING_MODE.feed }"
        @click="showTab(VIDEO_SHARING_MODE.feed)"
      >
        Feed
      </div>
      <div
        class="cursor-pointer mr-6"
        :class="{ 'font-medium': currentTab === VIDEO_SHARING_MODE.myVideos }"
        @click="showTab(VIDEO_SHARING_MODE.myVideos)"
      >
        My Videos
      </div>
      <div
        class="cursor-pointer mr-6"
        :class="{
          'font-medium': currentTab === VIDEO_SHARING_MODE.sharedToMe,
        }"
        @click="showTab(VIDEO_SHARING_MODE.sharedToMe)"
      >
        Shared To Me
      </div>
    </div>
    <div>
      <div
        v-if="currentTab === VIDEO_SHARING_MODE.feed"
        class="flex flex-row flex-wrap gap-4"
      >
        <VideoFeedCard
          v-for="(v, videoIndex) in feed"
          :key="videoIndex"
          :video="v"
          @click="selectVideo(v.item)"
        />
      </div>
      <div
        v-else-if="currentTab === VIDEO_SHARING_MODE.myVideos"
        class="flex flex-row flex-wrap gap-4"
      >
        <VideoMyCard
          v-for="(v, videoIndex) in myVideos"
          :key="videoIndex"
          :video="v"
          @click="selectVideo(v)"
        />
      </div>
      <div
        v-else-if="currentTab === VIDEO_SHARING_MODE.sharedToMe"
        class="flex flex-row flex-wrap gap-4"
      >
        <VideoSharedCard
          v-for="(v, videoIndex) in sharedToMe"
          :key="videoIndex"
          :video="v"
          @click="selectVideo(v)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from 'vue'
import { VIDEO_SHARING_MODE } from '@/constants'
import { ListItem } from '@/types/main'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'

import VideoFeedCard from '@/components/VideoFeedCard.vue'
import VideoMyCard from '@/components/VideoMyCard.vue'
import VideoSharedCard from '@/components/VideoSharedCard.vue'

export default defineComponent({
  name: 'Dashboard',
  components: {
    VideoFeedCard,
    VideoMyCard,
    VideoSharedCard,
  },
  setup() {
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: videoGetters, actions: videoActions } = useVideoStore()
    const user = appGetters.user.value
    appActions.fetchLTIData()
    const currentTab: Ref<string> = ref(VIDEO_SHARING_MODE.feed)

    onMounted(() => {
      videoActions.getVideoMetadata()
    })

    function showTab(tabName: string) {
      currentTab.value = tabName
      videoActions.selectNoVideo()
    }

    function selectVideo(item: ListItem) {
      videoActions.selectVideo(item)
    }
    videoActions.selectNoVideo()

    return {
      VIDEO_SHARING_MODE,
      user,
      feed: videoGetters.feed,
      myVideos: videoGetters.myVideos,
      sharedToMe: videoGetters.sharedToMe,
      selectVideo,
      showTab,
      currentTab,
    }
  },
})
</script>

<style scoped lang="postcss"></style>

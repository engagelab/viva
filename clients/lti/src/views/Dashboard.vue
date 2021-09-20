<!-- Copyright 2020, 2021 Richard Nesnass, Sharanya Manivasagam and Ole Smørdal

 This file is part of VIVA.

 VIVA is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 GPL-3.0-only or GPL-3.0-or-later

 VIVA is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with VIVA.  If not, see http://www.gnu.org/licenses/. -->
<template>
  <div class="relative p-4 flex flex-col">
    <div
      class="flex flex-row justify-start font-serious font-extralight text-viva-grey-500 py-4 w-auto"
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
      <!-- Sort function  -->
      <div class="flex flex-grow justify-end">
        <select
          class="col-end bg-transparent text-white"
          v-model="sortOrder"
          @change="sort"
        >
          <option disabled value="">Sort by</option>
          <option v-for="(sort, index) in Object.keys(SORT_BY)" :key="index">
            {{ sort }}
          </option>
        </select>
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
        <VideoMyCard
          v-for="(item, itemIndex) in myVideos"
          :key="itemIndex"
          :listitem="item"
          @annotate="
            setDetailMode(VIDEO_DETAIL_MODE.annotate, VIDEO_DETAIL_MODE.none)
          "
        />
      </div>
      <div
        v-show="currentTab === VIDEO_SHARING_MODE.sharedToMe"
        class="flex flex-col"
      >
        <VideoSharedCard
          v-for="(share, itemIndex) in sharedToMe"
          :key="itemIndex"
          :share="share"
          @annotate="
            setDetailMode(VIDEO_DETAIL_MODE.annotate, VIDEO_DETAIL_MODE.none)
          "
        />
      </div>
    </div>
    <div
      v-if="detailMode.mode !== VIDEO_DETAIL_MODE.none || dialogConfig.visible"
      class="fixed top-0 left-0 flex flex-col items-center justify-center w-full h-full bg-black bg-opacity-75 rounded-xl"
    >
      <Annotate
        class="w-auto lg:w-192 no-scrollbar"
        v-if="detailMode.mode === VIDEO_DETAIL_MODE.annotate"
      />
      <Player
        class="lg:w-192"
        v-if="
          detailMode.mode === VIDEO_DETAIL_MODE.play ||
          detailMode.submode === VIDEO_DETAIL_MODE.play
        "
      />
      <Share v-if="detailMode.mode === VIDEO_DETAIL_MODE.share" />
      <DialogBox v-if="dialogConfig.visible" />
    </div>
  </div>
</template>

<script lang="ts">
// @ is an alias to /src
import { defineComponent, ref, onMounted, Ref } from 'vue'
import { VIDEO_DETAIL_MODE, VIDEO_SHARING_MODE, SORT_BY } from '@/constants'

import { useAppStore } from '../store/useAppStore'
import { useVideoStore } from '../store/useVideoStore'
import VideoFeedCard from '@/components/VideoFeedCard.vue'
import VideoMyCard from '@/components/VideoMyCard.vue'
import VideoSharedCard from '@/components/VideoSharedCard.vue'
import DialogBox from '@/components/DialogBox.vue'
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
    DialogBox,
  },
  setup() {
    const { getters: appGetters, actions: appActions } = useAppStore()
    const { getters: videoGetters, actions: videoActions } = useVideoStore()
    const user = appGetters.user.value
    const sortOrder = ref(SORT_BY.date)
    appActions.fetchLTIData()
    const currentTab: Ref<VIDEO_SHARING_MODE> = ref(VIDEO_SHARING_MODE.myVideos)

    onMounted(() => {
      videoActions.getVideoMetadata()
    })

    function showTab(tabName: VIDEO_SHARING_MODE) {
      videoActions.selectNone()
      currentTab.value = tabName
      console.log(currentTab.value)
      videoActions.selectNoOriginal()
    }

    videoActions.selectNoOriginal()
    videoActions.selectNoShare()
    const sort = () => {
      videoActions.sortVideosBy(currentTab.value, sortOrder.value)
    }

    return {
      VIDEO_SHARING_MODE,
      VIDEO_DETAIL_MODE,
      user,
      feed: videoGetters.feed,
      myVideos: videoGetters.myVideos,
      sharedToMe: videoGetters.sharedToMe,
      selectedItem: videoGetters.selectedItem,
      sort,
      sortOrder,
      SORT_BY,
      detailMode: videoGetters.detailMode,
      dialogConfig: appGetters.dialogConfig,
      showTab,
      currentTab,
      setDetailMode: videoActions.detailMode,
    }
  },
})
</script>

<style scoped lang="postcss"></style>

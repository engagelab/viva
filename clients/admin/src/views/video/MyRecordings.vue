<template>
  <div class="flex flex-col flex-grow min-h-0">
    <div
      class="
        flex-none
        relative
        bg-viva-lilla
        text-white text-4xl
        md:text-6xl
        pl-4
        h-12
        md:h-20
      "
    >
      <img
        class="absolute top-0 right-0 w-8 mr-2 mt-2 p-1 md:m-4 cursor-pointer"
        src="@/assets/icons/svg/home_white.svg"
        @click="clickIcon('/login?page=3')"
      />
      <p class="absolute leading-tight bottom-0 pb-2 text-2xl">
        {{ t('lagringSamtykke') }}
      </p>
    </div>
    <div v-if="showDatasett" transition="expand" class="md:my-3">
      <Datasett />
    </div>
    <hr v-if="!showDatasett" style="width: 100%" />
    <div
      class="
        flex-none
        relative
        bg-viva-lilla
        text-white text-4xl
        md:text-6xl
        pl-4
        h-12
        md:h-20
      "
    >
      <SVGSymbol
        class="
          absolute
          top-0
          right-0
          w-4
          mr-6
          md:mr-10
          mt-2
          md:mt-4
          p-1
          text-viva-korall
          fill-current
          cursor-pointer
        "
        applyClasses="w-4 md:w-8 p-0"
        @click="toggleDatasett()"
        width="25"
        :rotation="showDatasett ? '270' : '90'"
      ></SVGSymbol>
      <p class="absolute leading-tight bottom-0 pb-2 text-2xl">
        {{ t('MyRecordings') }}
      </p>
    </div>
    <div
      v-if="selectedDatasett"
      class="
        mt-6
        pb-24
        md:mt-12
        flex-initial flex-shrink flex-grow
        min-h-0
        flex-col
        pl-4
        overflow-y-auto
        scrolling-touch
      "
    >
      <transition-group
        name="slide-fade"
        tag="div"
        :leave-to-class="leaveToClass"
        :enter-class="enterClass"
        mode="out-in"
      >
        <p
          v-if="allDraftVideos.length === 0 && allVideos.length === 0"
          key="novids"
        ></p>
        <VideoListItem
          class="p-2"
          v-for="draft in allDraftVideos"
          :key="draft.details.id"
          :video="draft"
          @select-video="clickVideo"
        />
      </transition-group>
      <!-- TODO: Add heading ala 'Mine opptak.'-->
      <template v-if="allDraftVideos.length > 0 && allVideos.length > 0">
        <hr class="mt-2" />
        <p class="text-xs mb-2">{{ t('uploadedVideos') }}</p>
      </template>
      <transition-group
        name="slide-fade"
        tag="div"
        :leave-to-class="leaveToClass"
        :enter-class="enterClass"
        mode="out-in"
      >
        <VideoListItem
          class="p-2"
          v-for="video in allVideos"
          :key="video.details.id"
          :video="video"
          @select-video="clickVideo"
        />
      </transition-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import router from '@/router'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import VideoListItem from '@/components/VideoListItem.vue'
import Datasett from '@/components/Dataset.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
import { VIDEO_STATUS_TYPES } from '@/constants'

import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
import { useAppStore } from '@/store/useAppStore'
const { actions: appActions } = useAppStore()
const { actions: videoActions, getters: videoGetters } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()

import { Video } from '@/types/main'

export default defineComponent({
  components: {
    Datasett,
    VideoListItem,
    SVGSymbol,
  },
  setup() {
    const messages = {
      nb_NO: {
        lagringSamtykke: 'Lagring og samtykker',
        MyRecordings: 'Mine opptak',
        uploadedVideos: 'Overførte opptak',
      },
      en: {
        lagringSamtykke: 'Storage and consents',
        MyRecordings: 'My recordings',
        uploadedVideos: 'Transferred recordings',
      },
    }
    const { t } = useI18n({ messages })
    const leaveToClass = ref('slide-fade-leave-to-right')
    const enterClass = ref('slide-fade-enter-right')
    const showDatasett = ref(true)
    const selectedDatasett = datasetGetters.selectedDataset

    // Lifecycle Hooks
    onMounted(() => {
      videoActions.selectVideo(undefined)
      videoActions.loadMetadata().then(() => videoActions.fetchMetadata())

      // Dataset locks
      const presetConfig = datasetGetters.presetDatasetConfig.value
      if (presetConfig) {
        const locks = Object.keys(presetConfig.locks)
        let locksChanged = false
        locks.forEach((datasetId) => {
          const today = moment()
          const lockedDay = moment(presetConfig.locks[datasetId].date)
          if (today.isAfter(lockedDay, 'day')) {
            datasetActions.unlockSelection(datasetId)
            locksChanged = true
          }
        })
        if (locksChanged) appActions.updateUserAtServer()
      }
    })

    function clickIcon(newRoute: string): void {
      router.push(newRoute)
    }
    function toggleDatasett(): void {
      showDatasett.value = !showDatasett.value
    }
    function clickVideo(video: Video) {
      if (video.status.main == VIDEO_STATUS_TYPES.draft) {
        videoActions.selectVideo(video)
        router.push('/videos/editor?page=0')
      } else if (video.status.main == VIDEO_STATUS_TYPES.error) {
        videoActions.selectVideo(video)
        router.push('/videos/error')
      }
    }

    return {
      t,
      selectedDatasett,
      allVideos: videoGetters.allVideos,
      allDraftVideos: videoGetters.allDraftVideos,
      showDatasett,
      clickIcon,
      toggleDatasett,
      clickVideo,
      leaveToClass,
      enterClass,
    }
  },
})
</script>

<style scoped>
hr {
  border: 0;
  clear: both;
  display: block;
  width: 96%;
}
.expand-transition {
  transition: all 0.3s ease;
  height: auto;
}
.expand-enter,
.expand-leave {
  height: 0;
}
</style>

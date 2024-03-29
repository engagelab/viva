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
  <div
    class="flex flex-row items-center justify-between viva-item max-w-xs"
    :class="backgroundColour"
  >
    <div class="max-w-24">
      <p class="text-sm">{{ datasetName }}</p>
      <p class="font-vagBold">{{ video.details.name }}</p>
      <p>{{ video.details.description }}</p>
      <p :class="videoStatus.textClass">
        {{ videoStatus.text }} {{ videoProgress }}
      </p>
    </div>
    <div class="pl-4" @click="clickItem(videoStatus)">
      <SVGSymbol
        class="p-2 fill-current"
        applyClasses="w-4 md:w-8"
        :class="videoStatus.symbolClass"
        :symbol="videoStatus.symbol"
        rotation="0"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  toRefs,
  PropType,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { Video } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'

const { actions: videoActions } = useVideoStore()

import SVGSymbol from './base/SVGSymbol.vue'
import { VIDEO_STATUS_TYPES, videoProgressCheckInterval } from '@/constants'

interface VideoStatus {
  text: string
  textClass: string
  status: string
  symbol: string
  symbolClass: string
}

export default defineComponent({
  components: {
    SVGSymbol,
  },
  props: {
    video: {
      type: Object as PropType<Video>,
      required: true,
    },
  },
  setup(props, context) {
    const messages = {
      nb_NO: {
        Overføre: 'Overføre til permanent lagring',
      },
      en: {
        Overføre: 'Transfer to permanent storage',
      },
    }
    const { t } = useI18n({ messages })
    const { video } = toRefs(props)
    const itemSelected = false
    let progressUpdateTimeout: number
    const disableTransfer = ref(false)
    const backgroundColour = computed(() => {
      const status =
        video.value.status.main == VIDEO_STATUS_TYPES.edited ? 'bg-green' : ''
      return itemSelected ? 'bg-white' : status
    })
    const datasetName = computed(() => {
      if (video.value.dataset && video.value.dataset.selection) {
        const selection = video.value.dataset.selection.reduce((acc, curr) => {
          const split = curr.title.split(':')
          return `${acc} > ${split[1]}`
        }, '')
        return `${video.value.dataset.name} ${selection}`
      } else {
        return ''
      }
    })
    const videoStatus = computed(() => {
      const v = video.value
      const status: VideoStatus = {
        text: 'Sjekk samtykker',
        textClass: 'text-viva-korall',
        status: 'draft',
        symbol: 'viva',
        symbolClass: 'text-viva-korall',
      }
      if (v.status.main == VIDEO_STATUS_TYPES.draft && !v.status.isConsented) {
        status.text = 'Sjekk samtykker'
      } else if (
        v.status.main == VIDEO_STATUS_TYPES.draft &&
        !v.status.isClassified
      ) {
        status.text = 'Må klassifiseres'
      } else if (
        v.status.main == VIDEO_STATUS_TYPES.draft &&
        !v.status.isEdited
      ) {
        status.text = 'Klipper og legger på filtre'
        status.symbolClass = 'text-viva-korall'
        status.textClass = 'text-viva-lilla'
      } else if (v.status.main == VIDEO_STATUS_TYPES.complete) {
        status.text = 'Opptak er lagret'
        status.symbolClass = 'black'
        status.textClass = 'black'
        status.symbol = 'accept'
      } else if (v.status.main == VIDEO_STATUS_TYPES.error) {
        status.text = 'Error'
        status.symbolClass = 'red'
        status.textClass = 'red'
      } else if (
        v.status.main === VIDEO_STATUS_TYPES.uploaded ||
        v.status.main === VIDEO_STATUS_TYPES.decrypted ||
        v.status.main === VIDEO_STATUS_TYPES.converted
      ) {
        status.text = 'Opptak behandles av UiOs VIVA tjeneste ...'
        status.symbol = 'wait'
        status.symbolClass = 'black'
        status.textClass = 'black'
      } else if (v.status.main == VIDEO_STATUS_TYPES.edited) {
        status.text = 'Klar til overføring'
        status.symbol = 'accept'
        status.symbolClass = 'green'
        status.textClass = 'green'
      }
      return status
    })
    const videoProgress = computed(() => {
      if (video.value.status.inPipeline) {
        return 'Opptak behandles...'
      } else if (video.value.status.uploadInProgress) {
        return 'Opptak sendes til lagring...'
      } else if (video.value.status.encryptionInProgress) {
        return 'Opptak krypteres...'
      } else if (video.value.status.decryptionInProgress) {
        return 'Opptak dekrypteres...'
      } else {
        return ''
      }
    })

    onMounted(() => {
      progressUpdateTimeout = window.setInterval(() => {
        if (
          video.value.status.main != VIDEO_STATUS_TYPES.draft &&
          video.value.status.main != VIDEO_STATUS_TYPES.complete &&
          video.value.status.main != VIDEO_STATUS_TYPES.error
        ) {
          videoActions.fetchVideoStatus(video.value).catch(() => {
            window.clearInterval(progressUpdateTimeout)
          })
        } else if (progressUpdateTimeout) {
          window.clearInterval(progressUpdateTimeout)
        }
      }, videoProgressCheckInterval * 1000)
    })

    onBeforeUnmount(() => {
      if (progressUpdateTimeout) {
        window.clearInterval(progressUpdateTimeout)
      }
    })

    function clickItem(status: VideoStatus) {
      if (status.symbol == 'viva') {
        setTimeout(() => {
          context.emit('select-video', { video: video.value })
        }, 100)
      }
    }
    // Initiate transfer of the video from VIVA server to final storage location
    function transferVideo() {
      if (!disableTransfer.value) {
        /* this.initiateTransfer({
          video: this.video,
          settingId: this.video.settingId,
          mode: 'transfer',
        }) */
      }
      disableTransfer.value = true
    }

    return {
      t,
      disableTransfer,
      videoProgress,
      videoStatus,
      datasetName,
      backgroundColour,
      VIDEO_STATUS_TYPES,

      clickItem,
      transferVideo,
    }
  },
})
</script>

<style scoped>
.green {
  color: green;
  fill: green;
}
</style>

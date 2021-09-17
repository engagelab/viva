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
  <div class="flex flex-col flex-grow min-h-0 w-full">
    <div
      class="
        flex flex-col flex-grow
        min-h-0
        md:mt-4
        p-4
        text-3xl
        md:text-5xl
        w-full
        relative
      "
    >
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=1"
        >{{ t('samtykker') }}</SliderItem
      >
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=2"
        :disabled="selectedVideo && !selectedVideo.status.recordingExists"
        >{{ t('rediger') }}</SliderItem
      >
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=3"
        >{{ t('klassifiser') }}</SliderItem
      >
      <SliderItem
        class="mb-2 md:mb-6 cursor-pointer text-lg"
        routePath="/videos/editor?page=4"
        :disabled="!readyForUpload"
        >{{ t('lagre') }}</SliderItem
      >
    </div>
  </div>
</template>

<script lang="ts">
const messages = {
  nb_NO: {
    samtykker: 'Samtykker',
    rediger: 'Rediger',
    klassifiser: 'Klassifiser',
    lagre: 'Lagre',
  },
  en: {
    samtykker: 'Consents',
    rediger: 'Edit',
    klassifiser: 'Classify',
    lagre: 'Save',
  },
}
import { defineComponent, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVideoStore } from '@/store/useVideoStore'
const { getters: videoGetters } = useVideoStore()

import SliderItem from '../../../components/base/SliderItem.vue'
export default defineComponent({
  components: {
    SliderItem,
  },
  setup() {
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo

    const readyForUpload = computed(() => {
      if (selectedVideo.value) {
        return (
          selectedVideo.value.status.recordingExists &&
          selectedVideo.value.status.isClassified &&
          (selectedVideo.value.status.isConsented ||
            selectedVideo.value.details.category === 'green')
        )
      } else return false
    })

    return {
      t,
      selectedVideo,
      readyForUpload,
    }
  },
})
</script>

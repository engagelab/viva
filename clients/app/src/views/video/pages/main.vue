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

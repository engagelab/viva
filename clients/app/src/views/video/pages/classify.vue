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
  <div class="flex flex-col px-4 pt-4 w-full">
    <SVGSymbol
      class="text-viva-korall fill-current"
      applyClasses="w-4 md:w-8"
      @click="back()"
      width="25"
      rotation="180"
    ></SVGSymbol>
    <div class="mx-4 mt-4 md:mx-8 md:mt-8">
      <div class="flex justify-left">
        <span>{{ t('infoklasse') }}</span>
        <div class="pl-8">
          <select v-model="selectedCategory" @change="dataChanged()">
            <option :value="null" hidden>{{ t('velg') }}</option>
            <option
              v-for="category in categoryBasedOnSetting"
              :value="category.value"
              :key="category.value"
            >
              {{ category.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex-1 rounded mt-4">
        <p>{{ t('filnavn') }}: {{ video.details.name }}</p>
      </div>

      <div class="flex-1 rounded mt-4">
        <AnswerInput
          class="m-2"
          mode="textarea"
          :border="false"
          :rows="5"
          :placeholder="t('placeholder')"
          v-model="video.details.description"
          @change="dataChanged()"
        ></AnswerInput>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { Video } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

import AnswerInput from '@/components/base/AnswerInput.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'

export default defineComponent({
  components: {
    AnswerInput,
    SVGSymbol,
  },
  setup() {
    const messages = {
      nb_NO: {
        infoklasse: 'Klassifiser beskyttelsesverdi for opptaket:',
        velg: 'Velg...',
        filnavn: 'Filnavn',
        placeholder: 'Her kan du gjøre notater til dette opptaket...',
        green: 'Åpen (grønn)',
        yellow: 'Begrenset (gul)',
        red: 'Fortrolig (rød)',
      },
      en: {
        infoklasse: 'Classify this recording as:',
        velg: 'Choose...',
        filnavn: 'Filename',
        placeholder: 'Optional notes for this recording...',
        green: 'Open (green)',
        yellow: 'Restricted (yellow)',
        red: 'Confidential (red)',
      },
    }
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo
    const video = ref(selectedVideo.value || new Video())
    const categoryLists = [
      { label: 'Åpen (grønn)', value: 'green' },
      { label: 'Begrenset (gul)', value: 'yellow' },
      // { label: 'Fortrolig (rød)', value: 'red' },
      //   { label: 'Black', value: 'black' }, We are not yet there :SM
    ]
    let selectedCategory = ref('')
    let firstTimeLoaded = false

    const hasNewDataAvailable = computed(() => {
      return selectedVideo.value
        ? selectedVideo.value.status.hasNewDataAvailable
        : false
    })

    const categoryBasedOnSetting = computed(() => {
      // If yellow is chosen in primary storage in Admin portal ,the user has to reduce the senstivity of the data
      // Or they are not provided with Red choice
      return categoryLists.map((c) => {
        return { label: t(c.value), value: c.value }
      })
    })

    onMounted(() => {
      if (selectedVideo.value) {
        firstTimeLoaded = true
        video.value.details.category = selectedVideo.value.details.category
        if (video.value.details.category != '') {
          selectedCategory.value = video.value.details.category
        }
        video.value.details.name = selectedVideo.value.details.name
        video.value.details.description =
          selectedVideo.value.details.description
        video.value.status.isConsented = selectedVideo.value.status.isConsented
        video.value.status.isClassified =
          selectedVideo.value.status.isClassified
        video.value.status.isEdited = selectedVideo.value.status.isEdited
      }
    })

    function dataChanged() {
      if (selectedCategory.value) {
        video.value.details.category = selectedCategory.value
        video.value.status.isClassified = true
      } else {
        video.value.details.category = ''
        video.value.status.isClassified = false
      }
      if (selectedVideo.value) {
        videoActions.setUnsavedChanges(selectedVideo.value.details.id)
      }
      return videoActions.updateMetadata(video.value)
    }

    function back() {
      dataChanged() // Video could be classified in previous login
      videoActions.updateMetadata(video.value)
      router.push('/videos/editor?page=0')
    }

    function newVideoName(newName: string) {
      video.value.details.name = newName
      dataChanged()
    }

    watch(
      () => hasNewDataAvailable,
      (newDataAvailable) => {
        if (newDataAvailable && !firstTimeLoaded) {
          dataChanged()
        } else {
          firstTimeLoaded = false
        }
      }
    )
    return {
      t,
      categoryBasedOnSetting,
      dataChanged,
      back,
      newVideoName,
      video,
      selectedCategory,
    }
  },
})
</script>

<style scoped>
.bold {
  font-family: 'VAG Rounded Std Bold';
}
p {
  margin-bottom: 2rem;
}
</style>

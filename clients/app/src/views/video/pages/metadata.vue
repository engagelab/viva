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
        <!--NewItem v-if="video.name" class="my-2" :initialName="video.name" @new-text="newVideoName" /-->
      </div>

      <div class="flex-1 rounded mt-4">
        <Input
          v-model="video.details.description"
          @change="dataChanged()"
          type="textarea"
          rows="5"
          :placeholder="t('placeholder')"
        />
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

import Input from '@/components/base/Input'
import NewItem from '@/components/base/NewItem'
import SVGSymbol from '@/components/base/SVGSymbol'

export default defineComponent({
  components: {
    Input,
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
    const video = ref(new Video())
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

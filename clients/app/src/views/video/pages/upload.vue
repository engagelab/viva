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
  <div class="p-4 flex flex-col w-full">
    <SVGSymbol
      class="text-viva-korall fill-current"
      applyClasses="w-4 md:w-8"
      @click="back()"
      width="25"
      rotation="180"
    ></SVGSymbol>
    <div
      class="flex flex-col flex-grow w-full justify-center items-center mt-6"
    >
      <p v-show="selectedVideo && selectedVideo.status.uploadProgress > 0">
        {{ selectedVideo ? selectedVideo.status.uploadProgress : '' }}%
      </p>
      <label v-if="!uploadComplete" for="checkbox"
        >{{ t('opptakSendes') }}&nbsp;</label
      >
      <label v-else for="checkbox">{{ t('opptakSendt') }}&nbsp;</label>
      <Button
        class="mt-4"
        v-show="selectedVideo && !selectedVideo.status.uploadInProgress"
        :disabled="
          selectedVideo &&
          !(
            selectedVideo.status.recordingExists &&
            selectedVideo.status.isClassified
          )
        "
        @vclick="startUpload()"
        >{{ t('send') }}</Button
      >
      <Button
        class="mt-4"
        v-show="selectedVideo && selectedVideo.status.uploadInProgress"
        :disabled="
          selectedVideo &&
          !(
            selectedVideo.status.recordingExists &&
            selectedVideo.status.isClassified
          )
        "
        @vclick="stopUpload()"
        >{{ t('cancel') }}</Button
      >
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

import Button from '@/components/base/Button.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
export default defineComponent({
  components: {
    Button,
    SVGSymbol,
  },
  setup() {
    const messages = {
      nb_NO: {
        opptakSendes:
          'Opptaket kan nå sendes fra din enhet til behandling i UiOs VIVA tjeneste',
        opptakSendt: 'Opptaket blir nå behandlet..',
        send: 'Send',
        cancel: 'Avbryt',
      },
      en: {
        opptakSendes:
          'The recording may now be transferred from your device to processing by the VIVA service',
        opptakSendt: 'The recording is now being processed..',
        send: 'Transfer',
        cancel: 'Cancel',
      },
    }
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo
    const uploadComplete = computed(() => {
      return (
        selectedVideo.value && selectedVideo.value.status.uploadProgress == 100
      )
    })
    function startUpload() {
      if (selectedVideo.value) {
        videoActions.controlUpload('start', selectedVideo.value)
      }
    }
    function stopUpload() {
      if (selectedVideo.value) {
        videoActions.controlUpload('abort', selectedVideo.value)
      }
    }
    function back() {
      if (uploadComplete.value) {
        router.push('/videos/list')
      } else {
        router.push('/videos/editor?page=0')
      }
    }
    return {
      t,
      startUpload,
      stopUpload,
      back,
      selectedVideo,
      uploadComplete,
    }
  },
})
</script>

<style scoped></style>

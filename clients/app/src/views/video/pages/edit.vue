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
  <div class="flex-1 flex-col">
    <div class="flex bg-black p-4 md:p-4">
      <Scrubber
        type="range"
        v-model="moveScrubber"
        :max="scrubberMax"
        :min="scrubberMin"
        :step="step"
        @input="(newValue) => updateEDL('move', [newValue])"
      />
    </div>
    <div class="flex flex-col items-top p-1 md:p-4">
      <SVGSymbol
        class="text-viva-korall fill-current self-start p-2"
        applyClasses="w-4 md:w-8"
        @click="back()"
        width="25"
        rotation="180"
      ></SVGSymbol>

      <div
        class="flex-1 flex-col md:items-center m-1 md:m-8 overflow-y-auto pt-2"
      >
        <div class="flex-1">
          <div
            class="
              flex
              items-center
              flex-shrink
              justify-between
              p-2
              bg-white
              rounded-md
              editItem
            "
          >
            <p class="w-4">{{ t('trim') }}</p>
            <transition name="expand">
              <div
                class="flex flex-row items-center"
                v-if="video.details.edl.trim.length > 0"
              >
                <div
                  class="
                    flex flex-row
                    items-center
                    rounded-full
                    ml-4
                    md:ml-12
                    p-2
                    cursor-pointer
                  "
                  :class="
                    trimButtonDisabled(0)
                      ? ['bg-gray-400', 'text-white']
                      : ['bg-viva-korall', 'text-black']
                  "
                  @click="setTrim(0)"
                >
                  <SVGSymbol
                    class="pointer-events-none fill-current"
                    applyClasses="w-4"
                    width="25"
                    rotation="180"
                    symbol="scissor"
                  ></SVGSymbol>
                  <p class="ml-2 leading-none pointer-events-none">
                    ⇤{{ video.details.edl.trim[0].toFixed(2) }}s
                  </p>
                </div>
                <div
                  class="
                    flex flex-row
                    items-center
                    ml-2
                    p-2
                    rounded-full
                    cursor-pointer
                  "
                  :class="
                    trimButtonDisabled(1)
                      ? ['bg-gray-400', 'text-white']
                      : ['bg-viva-korall', 'text-black']
                  "
                  @click="setTrim(1)"
                >
                  <p class="mr-2 leading-none pointer-events-none">
                    {{ video.details.edl.trim[1].toFixed(2) }}s⇥
                  </p>
                  <SVGSymbol
                    class="pointer-events-none fill-current"
                    applyClasses="w-4"
                    width="25"
                    rotation="0"
                    symbol="scissor"
                  ></SVGSymbol>
                </div>
              </div>
            </transition>
            <SVGSymbol
              v-if="video.details.edl.trim.length > 0"
              class="ml-4 md:ml-12 p-2 rounded-full"
              applyClasses="w-4 md:w-8"
              @click="clearTrim()"
              width="20"
              rotation="0"
              symbol="remove"
            ></SVGSymbol>
            <SVGSymbol
              v-else
              class="ml-4 p-2 rounded-full"
              applyClasses="w-4 md:w-8"
              @click="addTrim()"
              width="20"
              rotation="0"
              symbol="addNew"
            ></SVGSymbol>
          </div>
        </div>
        <transition-group
          name="blur"
          tag="div"
          class="scrollBlurContainer flex-grow-0 flex-shrink flex-none flex-col"
        >
          <div
            class="flex-1 flex-col mt-4"
            v-for="(item, index) in video.details.edl.blur"
            :key="index + 'key'"
          >
            <div
              class="flex items-center justify-between p-2 bg-white rounded-md"
            >
              <p class="w-4">{{ t('blur') }}</p>
              <transition name="expand">
                <div class="flex flex-row items-center">
                  <div
                    class="
                      flex flex-row
                      items-center
                      ml-4
                      md:ml-12
                      p-2
                      rounded-full
                      cursor-pointer
                    "
                    :class="
                      blurButtonDisabled(index, 0)
                        ? ['bg-gray-400', 'text-white']
                        : ['bg-viva-korall', 'text-black']
                    "
                    @click="setBlur(index, 0)"
                  >
                    <SVGSymbol
                      class="pointer-events-none fill-current"
                      applyClasses="w-4"
                      width="25"
                      rotation="330"
                      symbol="blur"
                    ></SVGSymbol>
                    <p class="ml-2 leading-none pointer-events-none">
                      ⇤{{ video.details.edl.blur[index][0].toFixed(2) }}s
                    </p>
                  </div>
                  <div
                    class="
                      flex flex-row
                      items-center
                      ml-2
                      p-2
                      rounded-full
                      cursor-pointer
                    "
                    :class="
                      blurButtonDisabled(index, 1)
                        ? ['bg-gray-400', 'text-white']
                        : ['bg-viva-korall', 'text-black']
                    "
                    @click="setBlur(index, 1)"
                  >
                    <p class="mr-2 leading-none pointer-events-none">
                      {{ video.details.edl.blur[index][1].toFixed(2) }}s⇥
                    </p>
                    <SVGSymbol
                      class="pointer-events-none fill-current"
                      applyClasses="w-4"
                      width="25"
                      rotation="30"
                      symbol="blur"
                    ></SVGSymbol>
                  </div>
                </div>
              </transition>
              <SVGSymbol
                class="ml-4 md:ml-12 p-2 rounded-full"
                applyClasses="w-4 md:w-8"
                @click="clearBlur(index)"
                width="20"
                rotation="0"
                symbol="remove"
              ></SVGSymbol>
            </div>
          </div>
        </transition-group>
        <div
          class="flex items-center justify-between p-2 mt-4 bg-white rounded-md"
        >
          <p class="w-4">{{ t('blur') }}</p>
          <SVGSymbol
            class="ml-4 p-2 rounded-full"
            applyClasses="w-4 md:w-8"
            @click="addBlur()"
            width="20"
            rotation="0"
            symbol="addNew"
          ></SVGSymbol>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
const messages = {
  nb_NO: {
    trim: 'Trim',
    blur: 'Maskér',
  },
  en: {
    trim: 'Trim',
    blur: 'Blur',
  },
}
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  watch,
  PropType,
  toRefs,
} from 'vue'
import router from '@/router'
import { useI18n } from 'vue-i18n'
import { Video } from '@/types/main'
import { useVideoStore } from '@/store/useVideoStore'
const { actions: videoActions, getters: videoGetters } = useVideoStore()

import SVGSymbol from '@/components/base/SVGSymbol.vue'
import Scrubber from '@/components/base/Scrubber.vue'

interface StateFromParent {
  playerCurrentTime: string
}

export default defineComponent({
  components: {
    SVGSymbol,
    Scrubber,
  },
  props: {
    stateFromParent: {
      type: Object as PropType<StateFromParent>,
      required: true,
    },
  },
  setup(props, context) {
    const { stateFromParent } = toRefs(props)
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo
    const moveScrubber = ref('0')
    const video = ref(new Video())
    let step = 0.01

    onMounted(() => {
      if (selectedVideo.value) {
        video.value.details.edl = selectedVideo.value.details.edl
        let scrubberMinimum = 0
        if (video.value.details.edl.trim.length > 0) {
          scrubberMinimum = video.value.details.edl.trim[0]
        }
        updateEDL('move', [scrubberMinimum])
      }
    })

    watch(
      () => stateFromParent.value.playerCurrentTime,
      (newValue) => {
        moveScrubber.value = newValue
      }
    )

    // ---------- Computed -------

    const duration = computed(() => {
      return selectedVideo.value ? selectedVideo.value.details.duration : 0
    })

    const scrubberMax = computed(() => {
      return video.value.details.edl.trim[1] || duration.value
    })

    const scrubberMin = computed(() => {
      return video.value.details.edl.trim[0] || 0
    })

    // -------- Methods -------------

    function back() {
      videoActions.updateMetadata(video.value)
      router.push('/videos/editor?page=0')
    }
    function updateEDL(type: string, newValue: number[]) {
      // TODO: Can we use the store to fix this instead?
      context.emit('edl-updated', { type, newValue })
    }

    // ----------------   Blur and Trim ------------------
    function trimButtonDisabled(bound: number) {
      if (bound == 0) {
        return (
          video.value.details.edl.trim.length > 0 &&
          parseFloat(moveScrubber.value) > video.value.details.edl.trim[1]
        )
      }
      return (
        video.value.details.edl.trim.length > 0 &&
        parseFloat(moveScrubber.value) < video.value.details.edl.trim[0]
      )
    }
    function blurButtonDisabled(index: number, bound: number) {
      const trim = video.value.details.edl.trim
      const blur = video.value.details.edl.blur
      const time = parseFloat(moveScrubber.value)

      // Upper bound
      if (bound > 0) {
        return (
          time < blur[index][0] ||
          (trim.length > 0 && (time < trim[0] || time > trim[1]))
        )
      }

      // Lower bound
      return (
        (blur[index][1] > 0 && time >= blur[index][1]) ||
        (trim.length > 0 && (time < trim[0] || time > trim[1]))
      )
    }
    function addTrim() {
      video.value.details.edl.trim = [0, duration.value]
    }
    function clearTrim() {
      if (selectedVideo.value) {
        video.value.details.edl.trim = []
        videoActions.updateMetadata(video.value)
        updateEDL('trim', [0, selectedVideo.value.details.duration])
      }
    }
    function setTrim(bound: number) {
      if (!trimButtonDisabled(bound)) {
        video.value.details.edl.trim[bound] = parseFloat(moveScrubber.value)
        videoActions.updateMetadata(video.value)
      }
    }
    function addBlur() {
      video.value.details.edl.blur.push([0, 0])
    }
    function setBlur(index: number, bound: number) {
      if (!blurButtonDisabled(index, bound)) {
        const newValue = [
          video.value.details.edl.blur[index][0],
          video.value.details.edl.blur[index][1],
        ]
        newValue[bound] = parseFloat(moveScrubber.value)
        video.value.details.edl.blur[index] = newValue
        videoActions.updateMetadata(video.value)
      }
    }
    function clearBlur(index: number) {
      video.value.details.edl.blur.splice(index, 1)
      videoActions.updateMetadata(video.value)
    }

    return {
      t,
      step,
      video,
      moveScrubber,

      back,
      scrubberMax,
      scrubberMin,
      trimButtonDisabled,
      blurButtonDisabled,
      addTrim,
      clearTrim,
      setTrim,
      addBlur,
      setBlur,
      clearBlur,
      updateEDL,
    }
  },
})
</script>

<style scoped>
/* .scrollBlurContainer {
  max-height: 200px;
} */
.blur-enter-active {
  transition: all 0.5s linear;
}
.blur-leave-active {
  transition: all 0.5s linear;
}
.blur-enter, .blur-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.expand-enter-active {
  transition: flex 0.5s linear;
}
.expand-leave-active {
  transition: flex 0.5s linear;
}
.expand-enter,
.expand-leave-to {
  flex: 0;
}
</style>

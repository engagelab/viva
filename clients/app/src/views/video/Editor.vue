<template>
  <!--div v-if="selectedVideo && video" class="flex flex-col flex-grow min-h-0 relative"-->
  <div class="flex flex-col flex-grow min-h-0 w-full">
    <div
      class="
        flex flex-col flex-grow
        min-h-o
        overflow-y-auto
        scrolling-touch
        w-full
        relative
      "
    >
      <!--div
            v-show="!selectedVideo.decryptionInProgress"
            id="videoContainer"
            ref="videoContainer"
      -->
      <div class="relative flex-none bg-black" @click="toggleScreenMode()">
        <div
          v-if="loadingVideoNow"
          class="
            absolute
            flex flex-row
            items-center
            justify-center
            bg-black bg-opacity-50
            text-white
            h-full
            w-full
            text-xs
            z-10
          "
        >
          <p>{{ t('pleaseWait') }}</p>
        </div>
        <video
          :class="fullScreenMode ? 'playbackVideo' : 'playbackVideoSmall'"
          ref="playbackVideo"
          id="playbackVideo"
          oncontextmenu="return false;"
          playsinline
          webkit-playsinline
          preload="metadata"
          :type="videoMimeType"
        >
          <track kind="subtitles" />
        </video>
      </div>
      <!--/div>
          <div v-show="selectedVideo.decryptionInProgress">
            <div>dekryptering..</div>
      </div-->
      <div
        class="
          flex flex-row flex-grow-0
          w-full
          bg-black
          py-1
          md:py-4
          justify-between
        "
      >
        <div class="flex flex-grow-0 justify-center items-center">
          <div class="mx-4 text-white">{{ playerTime }}</div>
        </div>
        <div
          class="flex flex-grow justify-center items-center"
          v-if="page === '0'"
        >
          <SVGSymbol
            v-show="!recording"
            applyClasses="w-8 h-8 md:w-12"
            @click="startRecording()"
            width="50"
            symbol="record"
          ></SVGSymbol>
        </div>
        <div
          class="flex flex-grow-0 justify-center content-center items-center"
          v-show="videoDataLoaded"
        >
          <SVGSymbol
            v-show="!recording && !playing"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 h-8 md:w-12"
            @click="startPlaying()"
            symbol="play"
          ></SVGSymbol>
          <SVGSymbol
            v-show="playing"
            class="pr-4 justify-center content-center"
            applyClasses="w-6 j-8 md:w-12"
            @click="stopPlaying()"
            symbol="stop"
          ></SVGSymbol>
        </div>
        <!--div
          class="text-white"
          style="width:90px;height:50px;"
          v-show="!playing && !videoDataLoaded"
        ></div-->
        <div
          class="flex flex-grow justify-center items-center"
          style="width: 90px"
        >
          <SVGSymbol
            v-show="!recording"
            @click="deleteDraft($event)"
            applyClasses="w-4 md:w-8"
            symbol="delete"
          ></SVGSymbol>
        </div>
      </div>

      <!-- Estimated storage remaining -->
      <!--div v-if="deviceStatus.browser != 'Safari'">
          <span>
            estimert lagring tilgjengelig:
            {{ estimatedStorageRemaining }}%
          </span>
      </div-->

      <div
        class="
          absolute
          p-4
          top-0
          z-10
          text-white
          w-full
          flex flex-row
          justify-between
        "
      >
        <div>
          <p class="text-sm">{{ datasetName }}</p>
          <p v-if="selectedVideo" class="font-vagBold">
            {{ selectedVideo.details.name }}
          </p>
        </div>
        <SVGSymbol
          v-show="!recording && !playing"
          class="absolute top-0 right-0 w-8 m-4"
          @click="backToList()"
          symbol="list"
        ></SVGSymbol>
      </div>

      <Slider
        class="flex flex-col flex-grow min-h-0"
        :pages="rawPages"
        :movePageTo="page"
        :stateToChildren="stateToChildren"
        @edl-updated="edlUpdated"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  onMounted,
  watch,
  markRaw,
} from 'vue'
import router from '@/router'
import { CONSENT_TYPES } from '@/constants'
import { convertFilePath } from '@/utilities'
import { Video } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
import { useDeviceService } from '@/store/useDevice'
import { useNotifyStore } from '@/store/useNotifyStore'
const { actions: notifyActions } = useNotifyStore()
const { actions: deviceActions, getters: deviceGetters } = useDeviceService()
const { actions: appActions, getters: appGetters } = useAppStore()
const { actions: videoActions, getters: videoGetters } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()
const messages = {
  nb_NO: {
    pleaseWait: 'Laster inn Video..',
  },
  en: {
    pleaseWait: 'Loading video..',
  },
}

import { useI18n } from 'vue-i18n'
import Slider from '@/components/base/Slider.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
import main from './pages/main.vue'
import consent from './pages/consent.vue'
import edit from './pages/edit.vue'
import classify from './pages/classify.vue'
import upload from './pages/upload.vue'

export default defineComponent({
  name: 'editor',
  components: {
    Slider,
    SVGSymbol,
  },
  props: {
    page: {
      type: String,
      default: '0',
    },
  },
  setup() {
    const rawPages = [
      markRaw(main),
      markRaw(consent),
      markRaw(edit),
      markRaw(classify),
      markRaw(upload),
    ]
    const { t } = useI18n({ messages })
    const selectedVideo = videoGetters.selectedVideo
    const selectedDataset = datasetGetters.selectedDataset
    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)
    const video = ref(new Video().updateFromVideo(selectedVideo.value))
    const videoUrl = ref('')
    const fullScreenMode = ref(false)
    const stateToChildren = ref({
      playerCurrentTime: '0',
    })
    const playing = ref(false)
    const videoDataLoaded = ref(false)
    const loadingVideoNow = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = 0
    let playerCurrentTime = ref('0')
    let videoWasReplaced = false

    document.addEventListener('fullscreenchange', () => {
      // document.fullscreenElement will point to the element that
      // is in fullscreen mode if there is one. If not, the value
      // of the property is null.
      appActions.setFullScreen(!!document.fullscreenElement)
    })

    // Lifecycle Hooks

    onMounted(() => {
      if (!selectedVideo.value) {
        return router.push('/videos/list')
      }
      if (
        selectedDataset.value &&
        selectedDataset.value.consent.kind === CONSENT_TYPES.samtykke
      ) {
        datasetActions.fetchConsents(selectedVideo.value)
      }
      setupVideo(selectedVideo.value)
      videoDataLoaded.value = false
      videoWasReplaced = false
    })

    /* onUpdated(() => {
      if (reloadVideo) {
        reloadVideo = false
        loadPlayerWithVideo()
      }
    }) */

    // Computed values

    const datasetName = computed(() => {
      if (selectedVideo.value && selectedVideo.value.dataset.selection) {
        const utvalg = selectedVideo.value.dataset.selection.reduce(
          (acc, curr) => {
            return `${acc} > ${curr.title}`
          },
          ''
        )
        return `${selectedVideo.value.dataset.name} ${utvalg}`
      } else {
        return ''
      }
    })

    const playerTime = computed(() => {
      if (deviceGetters.recordingNow.value) {
        return '--:--.-'
      } else {
        const timeAsInt = parseInt(playerCurrentTime.value)
        let minutes = Math.floor(timeAsInt / 60)
        // prettier-ignore
        let seconds = minutes > 0 ? timeAsInt % (60 * minutes) : timeAsInt;
        let milliseconds = timeAsInt.toFixed(2)
        milliseconds = milliseconds.substring(milliseconds.length - 2)
        const minutesString = minutes > 9 ? minutes : '0' + minutes
        const secondsString = seconds > 9 ? seconds : '0' + seconds
        return `${minutesString}:${secondsString}.${milliseconds}`
      }
    })

    const videoMimeType = computed(() => {
      return appGetters.deviceStatus.value.browser === 'Chrome'
        ? 'video/webm'
        : 'video/mp4'
    })

    const hasNewDataAvailable = computed(() => {
      return selectedVideo.value
        ? selectedVideo.value.status.hasNewDataAvailable
        : false
    })

    watch(
      () => hasNewDataAvailable.value,
      (newValue) => {
        if (newValue) loadPlayerWithVideo()
      }
    )
    watch(
      () => selectedVideo.value,
      (newValue) => {
        if (newValue) setupVideo(newValue)
      }
    )

    // METHODS

    function backToList(): void {
      if (!deviceGetters.recordingNow.value) router.push('/videos/list')
    }

    function toggleScreenMode(): void {
      fullScreenMode.value = !fullScreenMode.value
    }

    function confirmDeleteModalDone(confirmed: boolean) {
      notifyActions.setDialog({
        visible: false,
        data: {},
        doneCallback: () => ({}),
      })
      if (confirmed && selectedVideo.value) {
        videoActions
          .removeVideo(selectedVideo.value)
          .then(() => {
            appActions.removeDraftId(video.value.details.id)
            return appActions.updateUserAtServer().then(() => {
              console.log(`Removed a draft video: ${video.value.details.id}`)
            })
          })
          .then(() => {
            router.push('/videos/list')
          })
      }
    }

    function deleteDraft(event: Event): void {
      event.stopPropagation()
      notifyActions.setDialog({
        visible: true,
        data: {
          titleText: 'Advarsel',
          messageText:
            'Vennligst bekreft at du vil slette videoen. Det kan ikke bli ugjort!',
          cancelText: 'avbryt',
          confirmText: 'bekreft',
        },
        doneCallback: confirmDeleteModalDone,
      })
    }

    // Event handler for Edit Decision List updates
    function edlUpdated(d: { type: string; newValue: number[] }) {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        if (
          d.type == 'trim' &&
          !isNaN(player.duration) &&
          player.duration >= d.newValue[1]
        ) {
          playerUpperBound = d.newValue[1]
          playerLowerBound = d.newValue[0]
          player.currentTime = playerLowerBound
        } else if (d.type == 'move' && player.duration >= d.newValue[0]) {
          player.currentTime = d.newValue[0]
        }
        playerCurrentTime.value = player.currentTime.toString()
      }
    }

    // Called on initialisation of this view to create placeholder for edited data
    function setupVideo(chosenVideo: Video): void {
      // Create a video placeholder that can be modifed by the user
      const player: HTMLVideoElement | null = playbackVideo.value
      video.value = new Video().updateFromVideo(chosenVideo)
      if (chosenVideo && player) {
        video.value.updateFromVideo(chosenVideo)
        setPlayerBounds()
        loadPlayerWithVideo()
      }
    }

    function timeIsMasked(currentTime: number): boolean {
      return video.value.details.edl.blur.some(
        (blur) => currentTime >= blur[0] && currentTime <= blur[1]
      )
    }

    function setPlayerBounds(): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      const edl = video.value.details.edl
      if (player && edl) {
        if (edl.trim.length > 1) {
          playerLowerBound = edl.trim[0]
          playerUpperBound = edl.trim[1]
          player.currentTime = playerLowerBound
        }
        if (timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)'
        } else {
          player.style.filter = 'blur(0)'
        }
      }
    }

    function onTimeUpdate() {
      const player: HTMLVideoElement | null = playbackVideo.value
      let trim = video.value.details.edl.trim.length > 0
      let mask = video.value.details.edl.blur.length > 0
      if (player) {
        playerCurrentTime.value = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime.value
        if (
          player.currentTime >= playerUpperBound ||
          (trim && player.currentTime >= video.value.details.edl.trim[1])
        ) {
          stopPlaying()
        } else if (mask) {
          let blurOn = timeIsMasked(player.currentTime)
          if (blurOn) {
            player.muted = true
            player.style.filter = 'blur(15px)'
          } else {
            player.muted = false
            player.style.filter = 'blur(0)'
          }
        }
      }
    }

    function startPlaying() {
      const player: HTMLVideoElement | null = playbackVideo.value
      setPlayerBounds()
      if (player) {
        currentVolume = player.volume
        if (playing.value) {
          player.pause()
          playing.value = false
        } else {
          playing.value = true
          player.addEventListener('timeupdate', onTimeUpdate)
          player.play()
        }
      }
    }

    function stopPlaying() {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player) {
        player.pause()
        player.volume = currentVolume
        playing.value = false
        player.currentTime = playerLowerBound
        playerCurrentTime.value = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime.value
        if (timeIsMasked(player.currentTime)) {
          player.style.filter = 'blur(15px)'
        } else {
          player.style.filter = 'blur(0)'
        }
        player.removeEventListener('timeupdate', onTimeUpdate)
      }
    }

    // Load the player with video data from a new result
    // or reload it from store if reloadingFromStore == true
    // reloadingFromStore is true / triggered after the video data has been decrypted
    // or after returning to the video from the list
    function loadPlayerWithVideo(): void {
      const player: HTMLVideoElement | null = playbackVideo.value
      if (player && video.value && !deviceGetters.recordingNow.value) {
        const dataLoaded = () => {
          loadingVideoNow.value = false
          playerUpperBound = player.duration
          video.value.details.duration = player.duration
          video.value.status.recordingExists = true
          // We need to save the latest duration
          videoActions.updateMetadata(video.value).then(() => {
            // But if this is new video replacing an old, the unsavedChanges must be set true to request 'samtykker' acceptance
            if (videoWasReplaced)
              videoActions.setUnsavedChanges(video.value.details.id)
          })
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          videoDataLoaded.value = true
        }
        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)

        deviceActions
          .loadVideo(video.value.details.id + '.mp4')
          .then((fileEntry) => {
            if (fileEntry) {
              loadingVideoNow.value = true
              deviceActions.loadCordovaMedia(fileEntry).then((tempEntry) => {
                if (tempEntry) {
                  const path = convertFilePath(tempEntry.toURL()) + '#t=0.1'
                  //videoUrl.value = convertFilePath(tempEntry.toURL()) + '#t=0.1'
                  //videoUrl.value = tempEntry.toURL() + '#t=0.1'
                  player.setAttribute('src', path)
                  player.load()
                }
              })
            } else if (
              // Dev mode in web browser will load a sample video
              process.env.NODE_ENV === 'development' &&
              !appGetters.useCordova.value
            ) {
              player.setAttribute(
                'src',
                'https://localhost:8000/sampleClip.mp4'
              )
              player.load()
              if (selectedVideo.value)
                selectedVideo.value.status.recordingExists = true
            }
          })
      }
    }

    function startRecording() {
      if (video.value.details.duration > 0) {
        notifyActions.setDialog({
          visible: true,
          data: {
            titleText: 'Advarsel',
            messageText:
              'Vennligst bekreft at du vil overskrive videoen. Det kan ikke bli ugjort!',
            cancelText: 'avbryt',
            confirmText: 'bekreft',
          },
          doneCallback: confirmRecordingModalDone,
        })
      } else {
        recordVideo()
      }
    }

    function confirmRecordingModalDone(confirmed: boolean): void {
      notifyActions.setDialog({
        visible: false,
        data: {},
        doneCallback: () => ({}),
      })
      if (confirmed) {
        recordVideo()
      }
    }

    // Begin recording
    async function recordVideo() {
      // Make sure EDL is cleared if it is
      video.value.details.edl = {
        trim: [],
        blur: [],
      }
      videoWasReplaced = true

      // Call the device camera. Video will be stored under the name: video.details.id
      videoActions.replaceDraftVideo(video.value.details.id).then(() => {
        deviceActions.recordVideo(video.value.details.id).then(() => {
          const videoEntry = deviceGetters.video.value
          if (videoEntry) {
            // Add the FileEntry to the VideoStore to work with
            video.value.status.recordingExists = true
            videoActions
              .updateMetadata(video.value)
              .then(() => console.log('Completed video data save'))
            // Notify the app a new video is ready
            videoActions.setNewDataAvailable(video.value.details.id)
          }
        })
      })
    }

    return {
      t,
      // methods
      stopPlaying,
      startPlaying,
      startRecording,
      backToList,
      toggleScreenMode,
      deleteDraft,
      // data
      selectedVideo,
      datasetName,
      playerTime,
      videoMimeType,
      edlUpdated,
      stateToChildren,
      rawPages,
      playbackVideo,
      videoUrl,
      // booleans
      videoDataLoaded,
      recording: deviceGetters.recordingNow,
      playing,
      fullScreenMode,
      loadingVideoNow,
    }
  },
})
</script>
<style scoped>
.layout {
  background: #f5f7f9;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
}
.playbackVideo {
  margin: 0;
  width: 100%;
  z-index: 1;
}
.playbackVideoSmall {
  margin: auto;
  width: 50%;
  z-index: 1;
}
/* video::-webkit-media-controls-enclosure {
  display: none !important;
} */
#videoContainer {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  width: 100%;
}
</style>

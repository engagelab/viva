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
      <div class="flex-none bg-black" @click="toggleScreenMode()">
        <video
          class="playbackVideoSmall"
          ref="playbackVideo"
          id="playbackVideo"
          oncontextmenu="return false;"
          playsinline
          webkit-playsinline
          preload="metadata"
          :type="videoMimeType"
        ></video>
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
          v-if="pageNumber == 0"
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
            v-show="!recording && !playing && videoDataLoaded"
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

      <!-- Full screen mode -->
      <!--div v-if="!deviceStatus.mobile" type="flex" justify="end" style="margin-right: 20px;">
          <span>fullskjermopptak</span>
          <input type="checkbox" v-model="useFullScreen" />
      </div-->

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
        <img
          class="absolute top-0 right-0 w-8 m-4"
          src="@/assets/icons/svg/list_white.svg"
          @click="backToList()"
          alt="back to list"
        />
        <!--SVGSymbol
        applyClasses="w-4 h-4 md:w-8 md:h-8"
        @click.native="toggleScreenMode()"
        width="30"
        symbol="showList"
        ></SVGSymbol-->
      </div>

      <Slider
        class="flex flex-col flex-grow min-h-0"
        :pages="pages"
        :movePageTo="pageNumber"
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
  onUpdated,
  watch,
} from 'vue'
import router from '@/router'
import { CONSENT_TYPES, VIDEO_STATUS_TYPES } from '@/constants'
import { Video } from '@/types/main'
import { useAppStore } from '@/store/useAppStore'
import { useDatasetStore } from '@/store/useDatasetStore'
import { useVideoStore } from '@/store/useVideoStore'
import { useDeviceService } from '@/store/useDevice'
const { actions: deviceActions } = useDeviceService()
const { actions: appActions, getters: appGetters } = useAppStore()
const { actions: videoActions, getters: videoGetters } = useVideoStore()
const { getters: datasetGetters, actions: datasetActions } = useDatasetStore()

import Slider from '@/components/base/Slider.vue'
import SVGSymbol from '@/components/base/SVGSymbol.vue'
import main from './pages/main.vue'
import consent from './pages/consent.vue'
import edit from './pages/edit.vue'
import metadata from './pages/metadata.vue'
import upload from './pages/upload.vue'

export default defineComponent({
  name: 'editor',
  components: {
    Slider,
    SVGSymbol,
  },
  props: {
    pageNumber: {
      type: Number,
      default: 0,
    },
  },
  setup() {
    const pages = [main, consent, edit, metadata, upload]
    const selectedVideo = videoGetters.selectedVideo
    const selectedDataset = datasetGetters.selectedDataset
    const playbackVideo: Ref<HTMLVideoElement | null> = ref(null)
    const video = ref(new Video())
    const fullScreenMode = ref(false)
    const stateToChildren = ref({
      playerCurrentTime: '0',
    })
    const recording = ref(false)
    const playing = ref(false)
    const videoDataLoaded = ref(false)

    let playerLowerBound = 0 // Time >= 0 when video should start playing, when using the scrubber
    let playerUpperBound = 0 // Time <= player end time when video should stop playing, when using the scrubber
    let currentVolume = 0
    let playerCurrentTime = '0'
    let videoWasReplaced = false
    let reloadVideo = false

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
      if (selectedDataset.value.consent.type === CONSENT_TYPES.samtykke) {
        datasetActions.fetchConsents(selectedVideo.value)
      }
      setupVideo(selectedVideo.value)
      videoActions.setRecordingNow(false)
      reloadVideo = true
      videoDataLoaded.value = false
      videoWasReplaced = false
      if (
        selectedVideo.value.status.main == VIDEO_STATUS_TYPES.draft &&
        selectedVideo.value.status.recordingExists
      ) {
        videoActions.loadVideo(selectedVideo.value)
      }
    })

    onUpdated(() => {
      if (reloadVideo) {
        reloadVideo = false
        loadPlayerWithVideo()
      }
    })

    // Computed values

    const datasetName = computed(() => {
      if (selectedVideo.value?.dataset.selection) {
        const utvalg = selectedVideo.value.dataset.selection.reduce(
          (acc, curr) => {
            const split = curr.split(':')
            return `${acc} > ${split[1]}`
          },
          ''
        )
        return `${selectedVideo.value.dataset.name} ${utvalg}`
      } else {
        return ''
      }
    })

    const playerTime = computed(() => {
      if (recording.value) {
        return '--:--.-'
      } else {
        const timeAsInt = parseInt(playerCurrentTime)
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
      () => hasNewDataAvailable,
      () => loadPlayerWithVideo()
    )
    watch(
      () => selectedVideo,
      (newValue) => {
        if (newValue.value) setupVideo(newValue.value)
      }
    )

    // METHODS

    function backToList(): void {
      if (!recording.value) router.push('/videos/list')
    }

    function toggleScreenMode(): void {
      fullScreenMode.value = !fullScreenMode.value
    }

    function confirmDeleteModalDone(confirmed: boolean) {
      appActions.setDialog({
        visible: false,
        data: {},
        doneCallback: undefined,
      })
      if (confirmed && selectedVideo.value) {
        videoActions.removeVideo(selectedVideo.value).then(() => {
          router.push('/videos/list')
        })
      }
    }

    function deleteDraft(event: Event): void {
      event.stopPropagation()
      appActions.setDialog({
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
        playerCurrentTime = player.currentTime.toString()
      }
    }

    // Called on initialisation of this view to create placeholder for edited data
    function setupVideo(chosenVideo: Video): void {
      // Create a video placeholder that can be modifed by the user
      if (chosenVideo) {
        video.value.updateAll(chosenVideo)
        setPlayerBounds()
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
        playerCurrentTime = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime
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
        playerCurrentTime = player.currentTime.toString()
        stateToChildren.value.playerCurrentTime = playerCurrentTime
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
      if (player && selectedVideo.value) {
        const dataLoaded = () => {
          playerUpperBound = player.duration
          video.value.details.duration = player.duration
          // We need to save the latest duration
          videoActions.updateMetadata(video.value).then(() => {
            // But if this is new video replacing an old, the unsavedChanges must be set true to request 'samtykker' acceptance
            if (videoWasReplaced)
              videoActions.setUnsavedChanges(video.value.details.id)
          })
          setPlayerBounds()
          player.removeEventListener('loadeddata', dataLoaded)
          videoDataLoaded.value = true
          videoActions.setRecordingNow(false)
        }

        player.addEventListener('loadeddata', dataLoaded)
        player.addEventListener('ended', stopPlaying, false)

        const data = videoGetters.videoDataFile(selectedVideo.value.details.id) // Ensure chunks exist
        if (data.value) {
          // <- FileEntry
          videoActions.loadCordovaMedia(data.value).then((fileEntry) => {
            // <- MediaFile
            if (fileEntry) {
              const objectURL = fileEntry.nativeURL
              if (player.srcObject) player.srcObject = null
              player.setAttribute('src', objectURL + '#t=0.1')
              //set the media bounds in the dataLoaded function..
              player.load()
            }
          })
        }
      }
    }

    function startRecording() {
      if (video.value.details.duration > 0) {
        appActions.setDialog({
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
      appActions.setDialog({
        visible: false,
        data: {},
        doneCallback: undefined,
      })
      if (confirmed) {
        recordVideo()
      }
    }

    // Begin recording a video using MediaRecorder or Input method depending on device
    async function recordVideo() {
      // Make sure EDL is cleared if it is
      video.value.details.edl = {
        trim: [],
        blur: [],
      }
      recording.value = true
      videoWasReplaced = true
      videoActions.setRecordingNow(true)

      // Call the device camera. Video will be stored under the name: video.details.id
      videoActions.replaceDraftVideo(video.value.details.id).then(() => {
        deviceActions.recordVideo(video.value.details.id).then(() => {
          video.value.status.isEncrypted = true
          video.value.status.hasNewDataAvailable = true
          video.value.status.recordingExists = true
          video.value.status.hasUnsavedChanges = true
          recording.value = false
          videoActions
            .updateMetadata(video.value)
            .then(() => console.log('Completed video data save'))
        })
      })
    }

    return {
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
      pages,
      // booleans
      videoDataLoaded,
      recording,
      playing,
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
  background-color: green;
  z-index: 1;
}
.playbackVideoSmall {
  margin: auto;
  width: 50%;
  background-color: green;
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
